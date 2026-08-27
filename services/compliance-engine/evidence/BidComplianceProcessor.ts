import { PrismaClient } from "@prisma/client";
import { MockOCRExtractionProvider } from "../extraction/MockOCRExtractionProvider";
import { MockAIProvider } from "../../ai/providers/MockAIProvider";
import { DocumentClassifier } from "../classification/DocumentClassifier";
import { RequirementEvidenceMapper } from "./RequirementEvidenceMapper";
import { ComplianceEngine } from "../engine/ComplianceEngine";

const prisma = new PrismaClient();
const textExtractor = new MockOCRExtractionProvider();
const aiProvider = new MockAIProvider();
const complianceEngine = new ComplianceEngine();

export class BidComplianceProcessor {
    async processBid(bidId: string) {
        console.log(`\n[BidComplianceProcessor] Starting End-to-End Analysis for Bid ${bidId}...`);
        
        const bid = await prisma.bid.findUnique({
            where: { id: bidId },
            include: { documents: true, tender: true }
        });

        if (!bid) throw new Error("Bid not found.");

        // 1. Process Bidder Documents & Extract Evidence
        for (const doc of bid.documents) {
            const docClass = DocumentClassifier.classifyBidDocument(doc.filename, "");
            console.log(` -> Classifying ${doc.filename} as ${docClass}`);

            await prisma.document.update({
                where: { id: doc.id },
                data: { documentClass: docClass }
            });

            // Extract Text
            const textResult = await textExtractor.extract({ id: doc.id, fileReference: doc.filename });
            
            // AI Evidence Extraction (simplistic full-page mapping for demo)
            for (const page of textResult.pages) {
                const evidences = await aiProvider.extractEvidence({
                    documentId: doc.id,
                    section: "GENERAL",
                    pageNumber: page.pageNumber,
                    text: page.text
                });

                for (const ev of evidences) {
                    await prisma.evidence.create({
                        data: {
                            documentId: doc.id,
                            type: ev.field,
                            value: ev.rawValue,
                            numericValue: ev.normalizedValue && typeof ev.normalizedValue === 'number' ? ev.normalizedValue : null,
                            confidence: ev.confidence,
                            normalizedValue: JSON.stringify(ev.normalizedValue),
                            validationStatus: "VALID" // Mocked pass-through for demo
                        }
                    });
                }
            }
        }

        // 2. Fetch Active Requirements and Bid Evidence
        const activeRequirements = await prisma.tenderRequirement.findMany({
            where: { tenderId: bid.tenderId, status: "ACTIVE", reviewStatus: "APPROVED" } // Only evaluate against approved requirements
        });

        const allEvidence = await prisma.evidence.findMany({
            where: { document: { bidId } }
        });

        // 3. Map Evidence to Requirements
        console.log(`\n[BidComplianceProcessor] Mapping Evidence to Requirements...`);
        const mappings = RequirementEvidenceMapper.mapEvidenceToRequirements(activeRequirements, allEvidence);

        // 4. Deterministic Evaluation
        console.log(`[BidComplianceProcessor] Running Deterministic Compliance Engine...`);
        
        let compliantCount = 0;
        let nonCompliantCount = 0;
        let missingEvidenceCount = 0;

        for (const req of activeRequirements) {
            const mappedEvidence = mappings[req.id];

            // Using the Phase 2 engine. In a real system, we'd pass the mappedEvidence directly to evaluator,
            // but for integration, we'll let ComplianceEngine fetch all evidence and we trust its grouping,
            // OR we bypass the engine shell and use DeterministicEvaluator directly for the explainable output.
            // Since ComplianceEngine saves to DB, we'll just run it.
        }
        
        // Actually, we should just trigger Phase 2 engine which was refactored in Phase 2 to iterate requirements!
        await complianceEngine.evaluateBid(bidId);

        // 5. Generate Summary
        const results = await prisma.complianceResult.findMany({
            where: { evidence: { document: { bidId } } },
            include: { requirement: true }
        });

        for (const result of results) {
            if (result.status === "COMPLIANT") compliantCount++;
            else if (result.status === "NON_COMPLIANT") nonCompliantCount++;
            else if (result.status === "MISSING_EVIDENCE" || result.status === "INSUFFICIENT_EVIDENCE") missingEvidenceCount++;
        }

        console.log(`\n=== BID COMPLIANCE SUMMARY ===`);
        console.log(`Total Active Requirements: ${activeRequirements.length}`);
        console.log(`Compliant: ${compliantCount}`);
        console.log(`Non-Compliant: ${nonCompliantCount}`);
        console.log(`Missing Evidence / Needs Review: ${missingEvidenceCount}`);
        console.log(`Overall Status: ${nonCompliantCount > 0 ? "NON_COMPLIANT" : (missingEvidenceCount > 0 ? "REQUIRES_OFFICER_REVIEW" : "COMPLIANT")}`);
    }
}
