import { PrismaClient, Prisma } from "@prisma/client";
import { FraudAnalysisInput, FraudAnalysisResult, FraudAnalysisService } from "./mock/MockFraudAnalysisService";
import { FraudIndicator } from "./detectors/FraudIndicator";
import { IdentityMismatchDetector } from "./detectors/IdentityMismatchDetector";
import { DocumentDuplicationDetector } from "./detectors/DocumentDuplicationDetector";
import { CompanyConsistencyDetector, ExtractedEntityDoc } from "./detectors/CompanyConsistencyDetector";
import { CrossBidSimilarityDetector, CrossBidDocRecord } from "./detectors/CrossBidSimilarityDetector";
import { MetadataAnomalyDetector, DocumentTimestampRecord } from "./detectors/MetadataAnomalyDetector";
import { EvidenceCorrelator } from "./scoring/EvidenceCorrelator";
import { RiskScorer } from "./scoring/RiskScorer";

const prisma = new PrismaClient();

/**
 * FraudEngine
 *
 * Orchestrates all fraud detectors against a single bid, clusters evidence via
 * EvidenceCorrelator, computes risk score + confidence + investigation priority,
 * persists the complete assessment in Prisma, and returns the result.
 */
export class FraudEngine implements FraudAnalysisService {
    private identityDetector = new IdentityMismatchDetector();
    private companyConsistencyDetector = new CompanyConsistencyDetector();
    private duplicationDetector = new DocumentDuplicationDetector();
    private crossBidSimilarityDetector = new CrossBidSimilarityDetector();
    private metadataDetector = new MetadataAnomalyDetector();
    private correlator = new EvidenceCorrelator();
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

        // ── 2. Load ALL documents across all bids in this tender ────────────
        const allTenderDocuments = await prisma.document.findMany({
            where: {
                bidId: { not: null },
                bid: { tenderId: bid.tenderId }
            },
            include: {
                bid: {
                    include: { bidder: true }
                }
            }
        });

        const allIndicators: FraudIndicator[] = [];

        // ── 3. EXTRACT STRUCTURED ENTITY & FORENSIC FIELDS ───────────────────
        const registeredName = bid.bidder.legalName;
        const regInfo = bid.bidder.registrationInfo as any;
        const registeredPan = regInfo?.pan;
        const registeredGstin = regInfo?.gstin;
        const registeredAddress = regInfo?.address || (bid.bidder.contactInformation as any)?.address;

        const extractedDocs: ExtractedEntityDoc[] = [];
        const documentNames: { documentId: string; entityName: string; documentType?: string }[] = [];
        const docTimestamps: DocumentTimestampRecord[] = [];

        for (const doc of bid.documents) {
            let compName: string | undefined;
            let pan: string | undefined;
            let gstin: string | undefined;
            let udyamNumber: string | undefined;
            let address: string | undefined;
            let issuedDate: Date | null = null;
            let expiryDate: Date | null = null;
            let registrationDate: Date | null = null;
            let docType = doc.fileType;

            for (const ev of doc.evidence) {
                const val = (ev.value || "").trim();
                const type = (ev.type || "").toUpperCase();

                if (type === "ENTITY_NAME" || type === "LEGAL_NAME" || type === "COMPANY_NAME") {
                    compName = val;
                    documentNames.push({ documentId: doc.id, entityName: val, documentType: doc.filename });
                } else if (type === "PAN" || type === "PAN_NUMBER") {
                    pan = val;
                } else if (type === "GSTIN" || type === "GST_NUMBER") {
                    gstin = val;
                } else if (type === "UDYAM" || type === "UDYAM_NUMBER" || type === "MSME_NUMBER") {
                    udyamNumber = val;
                } else if (type === "ADDRESS" || type === "REGISTERED_ADDRESS") {
                    address = val;
                } else if (type === "ISSUE_DATE" || type === "ISSUED_DATE") {
                    const parsed = new Date(val);
                    if (!isNaN(parsed.getTime())) issuedDate = parsed;
                } else if (type === "EXPIRY_DATE" || type === "VALIDITY_DATE") {
                    const parsed = new Date(val);
                    if (!isNaN(parsed.getTime())) expiryDate = parsed;
                } else if (type === "REGISTRATION_DATE" || type === "INCORPORATION_DATE") {
                    const parsed = new Date(val);
                    if (!isNaN(parsed.getTime())) registrationDate = parsed;
                } else if (type === "DOCUMENT_TYPE") {
                    docType = val;
                }
            }

            extractedDocs.push({
                documentId: doc.id,
                documentType: docType || doc.filename,
                companyName: compName,
                pan,
                gstin,
                udyamNumber,
                address
            });

            docTimestamps.push({
                documentId: doc.id,
                filename: doc.filename,
                uploadTimestamp: doc.uploadTimestamp,
                issuedDate,
                expiryDate,
                registrationDate
            });
        }

        // ── 4. RUN COMPANY CONSISTENCY DETECTOR ──────────────────────────────
        const companyConsistencyFlags = this.companyConsistencyDetector.detect({
            bidId: bid.id,
            registeredLegalName: registeredName,
            registeredAddress,
            registeredPan,
            registeredGstin,
            documents: extractedDocs
        });
        allIndicators.push(...companyConsistencyFlags);

        // ── 5. RUN IDENTITY MISMATCH DETECTOR ────────────────────────────────
        if (documentNames.length > 0) {
            const identityFlags = this.identityDetector.detect({
                bidId: bid.id,
                registeredName,
                documentNames
            });
            allIndicators.push(...identityFlags);
        }

        // ── 6. RUN DOCUMENT DUPLICATION DETECTOR ─────────────────────────────
        const dupRecords = allTenderDocuments.map(d => ({
            documentId: d.id,
            bidId: d.bidId!,
            bidderId: d.bid?.bidderId,
            bidderName: d.bid?.bidder?.legalName,
            filename: d.filename,
            hash: d.hash
        }));

        const duplicationFlags = this.duplicationDetector.detect({
            currentBidId: bid.id,
            currentBidderName: registeredName,
            allTenderDocuments: dupRecords
        });
        allIndicators.push(...duplicationFlags);

        // ── 7. RUN CROSS-BID SIMILARITY DETECTOR ─────────────────────────────
        const crossBidDocs: CrossBidDocRecord[] = allTenderDocuments.map(d => ({
            documentId: d.id,
            bidId: d.bidId!,
            bidderId: d.bid?.bidderId || "",
            bidderName: d.bid?.bidder?.legalName || "Unknown Bidder",
            filename: d.filename,
            fileType: d.fileType,
            fileSize: d.fileSize,
            hash: d.hash,
            extractedText: d.extractedText
        }));

        const crossBidFlags = this.crossBidSimilarityDetector.detect({
            currentBidId: bid.id,
            currentBidderName: registeredName,
            tenderId: bid.tenderId,
            allTenderDocuments: crossBidDocs
        });
        allIndicators.push(...crossBidFlags);

        // ── 8. RUN METADATA & SUSPICIOUS DATE FORENSICS ──────────────────────
        const metadataFlags = this.metadataDetector.detect({
            bidId: bid.id,
            tenderClosingDate: bid.tender.closingDate,
            tenderIssueDate: bid.tender.issueDate,
            documents: docTimestamps
        });
        allIndicators.push(...metadataFlags);

        // ── 9. CORRELATE EVIDENCE & DETECT COMPOUND CLUSTERS ─────────────────
        const { correlatedFindings, deduplicatedIndicators } = this.correlator.correlate(allIndicators);

        // ── 10. COMPUTE RISK SCORE, CONFIDENCE & INVESTIGATION PRIORITY ──────
        const scoreResult = this.scorer.score(deduplicatedIndicators, correlatedFindings);

        // ── 11. PERSIST FRAUD ANALYSIS RECORD ────────────────────────────────
        await prisma.fraudAnalysis.create({
            data: {
                bidId: bid.id,
                riskScore: scoreResult.riskScore,
                riskLevel: scoreResult.riskLevel,
                confidence: scoreResult.confidence,
                investigationPriority: scoreResult.investigationPriority,
                indicators: allIndicators as unknown as Prisma.InputJsonValue,
                correlatedFindings: correlatedFindings as unknown as Prisma.InputJsonValue
            }
        });

        // ── 12. RETURN STRUCTURED RESULT ─────────────────────────────────────
        return {
            status: allIndicators.length > 0 ? "FLAGGED" : "CLEAN",
            riskScore: scoreResult.riskScore,
            riskLevel: scoreResult.riskLevel,
            confidence: scoreResult.confidence,
            investigationPriority: scoreResult.investigationPriority,
            indicators: allIndicators,
            correlatedFindings,
            summaryRecommendation: scoreResult.summaryRecommendation
        };
    }
}

