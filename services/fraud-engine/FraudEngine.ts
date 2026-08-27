import { PrismaClient, Prisma } from "@prisma/client";
import { FraudAnalysisInput, FraudAnalysisResult, FraudAnalysisService } from "./mock/MockFraudAnalysisService";
import { FraudIndicator } from "./detectors/FraudIndicator";
import { IdentityMismatchDetector } from "./detectors/IdentityMismatchDetector";
import { DocumentDuplicationDetector } from "./detectors/DocumentDuplicationDetector";
import { MetadataAnomalyDetector } from "./detectors/MetadataAnomalyDetector";
import { RiskScorer } from "./scoring/RiskScorer";

const prisma = new PrismaClient();

/**
 * FraudEngine
 *
 * Orchestrates all fraud detectors against a single bid, persists a
 * FraudAnalysis record, and returns the structured result.
 *
 * Implements FraudAnalysisService so it can be swapped into server.ts
 * in place of MockFraudAnalysisService with zero interface changes.
 */
export class FraudEngine implements FraudAnalysisService {
    private identityDetector = new IdentityMismatchDetector();
    private duplicationDetector = new DocumentDuplicationDetector();
    private metadataDetector = new MetadataAnomalyDetector();
    private scorer = new RiskScorer();

    async analyze(input: FraudAnalysisInput): Promise<FraudAnalysisResult> {
        // ── 1. Load bid with all related data ────────────────────────────────
        const bid = await prisma.bid.findUnique({
            where: { id: input.bidId },
            include: {
                bidder: true,
                tender: true,
                documents: {
                    include: { evidence: true }
                }
            }
        });

        if (!bid) {
            throw new Error(`Bid not found: ${input.bidId}`);
        }

        // ── 2. Load ALL documents for this tender (for duplication check) ───
        const allTenderDocuments = await prisma.document.findMany({
            where: { bidId: { not: null }, tender: null, bid: { tenderId: bid.tenderId } },
            select: { id: true, bidId: true, hash: true }
        });

        // Map to the shape detectors expect
        const allTenderDocs = allTenderDocuments.map(d => ({
            documentId: d.id,
            bidId: d.bidId!,
            hash: d.hash
        }));

        const allIndicators: FraudIndicator[] = [];

        // ── 3. IDENTITY MISMATCH ─────────────────────────────────────────────
        const registeredName = bid.bidder.legalName;

        // Collect entity names from Evidence records (type ENTITY_NAME or LEGAL_NAME)
        const documentNames: { documentId: string; entityName: string }[] = [];
        for (const doc of bid.documents) {
            for (const ev of doc.evidence) {
                if (ev.type === "ENTITY_NAME" || ev.type === "LEGAL_NAME") {
                    documentNames.push({ documentId: doc.id, entityName: ev.value });
                }
            }
        }

        if (documentNames.length > 0) {
            const identityFlags = this.identityDetector.detect({
                bidId: bid.id,
                registeredName,
                documentNames
            });
            allIndicators.push(...identityFlags);
        }

        // ── 4. DOCUMENT DUPLICATION ──────────────────────────────────────────
        const duplicationFlags = this.duplicationDetector.detect({
            currentBidId: bid.id,
            allTenderDocuments: allTenderDocs
        });
        allIndicators.push(...duplicationFlags);

        // ── 5. METADATA ANOMALY ──────────────────────────────────────────────
        const docTimestamps = bid.documents.map(doc => {
            // Look for an evidence record with type ISSUE_DATE
            const issueDateEv = doc.evidence.find(e => e.type === "ISSUE_DATE");
            let issuedDate: Date | null = null;
            if (issueDateEv?.value) {
                const parsed = new Date(issueDateEv.value);
                if (!isNaN(parsed.getTime())) issuedDate = parsed;
            }
            return {
                documentId: doc.id,
                uploadTimestamp: doc.uploadTimestamp,
                issuedDate
            };
        });

        const metadataFlags = this.metadataDetector.detect({
            bidId: bid.id,
            tenderClosingDate: bid.tender.closingDate,
            documents: docTimestamps
        });
        allIndicators.push(...metadataFlags);

        // ── 6. Score ─────────────────────────────────────────────────────────
        const { riskScore, riskLevel } = this.scorer.score(allIndicators);

        // ── 7. Persist FraudAnalysis ─────────────────────────────────────────
        await prisma.fraudAnalysis.create({
            data: {
                bidId: bid.id,
                riskScore,
                riskLevel,
                indicators: allIndicators as unknown as Prisma.InputJsonValue
            }
        });

        // ── 8. Return structured result ──────────────────────────────────────
        return {
            status: allIndicators.length > 0 ? "FLAGGED" : "CLEAN",
            riskScore,
            riskLevel,
            indicators: allIndicators
        };
    }
}
