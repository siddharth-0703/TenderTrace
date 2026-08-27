import { PrismaClient } from "@prisma/client";
import { TenderTextLoader } from "../text/TenderTextLoader";
import { BidTextLoader } from "../text/BidTextLoader";
import { TenderRequirementDetector } from "./TenderRequirementDetector";
import { BidEvidenceDetector } from "./BidEvidenceDetector";
import { RequirementEvidenceMatcher } from "./RequirementEvidenceMatcher";
import { ComplianceEngine } from "../engine/ComplianceEngine";
import { RuleSchema } from "../rules/RuleSchema";

const prisma = new PrismaClient();
const complianceEngine = new ComplianceEngine();

export class TenderBidMatchingProcessor {
    static async processMatch(tenderId: string, bidId: string) {
        console.log(`[MATCHING_STARTED] Tender: ${tenderId}, Bid: ${bidId}`);

        // 1. Load Tender Text
        const tenderPages = await TenderTextLoader.loadTenderText(tenderId);
        console.log(`[TENDER_TEXT_LOADED] Pages: ${tenderPages.length}`);

        // 2. Detect Tender Requirements
        const requirementCandidates = TenderRequirementDetector.detectRequirements(tenderPages);
        console.log(`[REQUIREMENTS_DETECTED] Count: ${requirementCandidates.length}`);

        // 3. Save Requirements to DB (so ComplianceEngine can use them)
        for (const cand of requirementCandidates) {
            const rules = {
                type: "condition",
                field: cand.field,
                operator: cand.operator,
                value: cand.value,
                currency: cand.currency
            };
            
            await prisma.tenderRequirement.create({
                data: {
                    tenderId: tenderId,
                    type: cand.type,
                    description: cand.sourceText,
                    category: "FINANCIAL", // Dummy default for legacy schema
                    operator: cand.operator,
                    sourceDocumentId: cand.documentId,
                    sourceProvenance: JSON.stringify({ page: cand.pageNumber, originalText: cand.sourceText }),
                    rules: JSON.stringify(rules), // stringified JSON
                    aiMetadata: JSON.stringify({ heuristicConfidence: cand.heuristicConfidence })
                }
            });
        }

        // 4. Load Bid Text
        const bidPages = await BidTextLoader.loadBidText(bidId);
        console.log(`[BID_TEXT_LOADED] Pages: ${bidPages.length}`);

        // 5. Detect Bid Evidence
        const evidenceCandidates = BidEvidenceDetector.detectEvidence(bidPages);
        console.log(`[EVIDENCE_DETECTED] Count: ${evidenceCandidates.length}`);

        // 6. Save Evidence to DB
        for (const cand of evidenceCandidates) {
            await prisma.evidence.create({
                data: {
                    documentId: cand.documentId,
                    type: cand.field,
                    value: String(cand.value),
                    numericValue: cand.numericValue,
                    unit: cand.currency, // Store currency in unit field
                    sourceText: cand.sourceText,
                    page: cand.pageNumber,
                    extractionMethod: "HEURISTIC",
                    confidence: 0.8
                }
            });
        }

        // Fetch fresh from DB
        const requirements = await prisma.tenderRequirement.findMany({ where: { tenderId } });
        
        // Fetch all documents for this bid
        const bidDocs = await prisma.document.findMany({ where: { bidId } });
        const bidDocIds = bidDocs.map(d => d.id);
        const evidenceList = await prisma.evidence.findMany({ where: { documentId: { in: bidDocIds } } });

        // 7. Match Evidence to Requirements
        const matches = RequirementEvidenceMatcher.match(requirements, evidenceList);
        
        // 8. Save Matching Records
        let matchedCount = 0;
        let conflictCount = 0;

        for (const match of matches) {
            await prisma.requirementEvidenceMatch.create({
                data: {
                    requirementId: match.requirementId,
                    evidenceId: match.evidenceId,
                    matchScore: match.matchScore,
                    matchReasons: JSON.stringify(match.matchReasons),
                    matchingTrace: JSON.stringify(match.matchingTrace)
                }
            });
            matchedCount++;
        }

        // 9. Invoke Existing Compliance Engine
        await complianceEngine.evaluateBid(bidId);
        console.log(`[COMPLIANCE_EVALUATION_COMPLETED]`);

        // Calculate summary
        const results = await prisma.complianceResult.findMany({
            where: { requirement: { tenderId }, evidence: { documentId: { in: bidDocIds } } }
        });

        const complianceSummary = {
            compliant: results.filter(r => r.status === "COMPLIANT").length,
            nonCompliant: results.filter(r => r.status === "NON_COMPLIANT").length,
            insufficientEvidence: results.filter(r => r.status === "INSUFFICIENT_EVIDENCE").length,
            conflictingEvidence: results.filter(r => r.status === "CONFLICTING_EVIDENCE").length
        };
        
        conflictCount = complianceSummary.conflictingEvidence;

        const res = {
            tenderId,
            bidId,
            status: "COMPLETED",
            requirementsProcessed: requirements.length,
            evidenceFound: evidenceList.length,
            matched: matchedCount,
            unmatched: requirements.length - matchedCount, // Approx
            conflicts: conflictCount,
            complianceSummary
        };

        console.log(`[MATCHING_COMPLETED]`);
        return res;
    }
}
