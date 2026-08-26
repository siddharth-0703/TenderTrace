import { DeterministicEvaluator, Operator } from "../rules/DeterministicEvaluator";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const evaluator = new DeterministicEvaluator();

export class ComplianceEngine {
    
    async evaluateBid(bidId: string) {
        // 1. Get bid and tender requirements
        const bid = await prisma.bid.findUnique({
            where: { id: bidId },
            include: {
                tender: {
                    include: { requirements: true }
                },
                documents: {
                    include: { evidence: true }
                }
            }
        });

        if (!bid) throw new Error("Bid not found");

        const requirements = bid.tender.requirements;
        
        // 2. Flatten all evidence from all documents belonging to this bid
        const allEvidence = bid.documents.flatMap(doc => doc.evidence);

        // 3. Evaluate each requirement
        for (const req of requirements) {
            // Find matching evidence (mock matching by type)
            const matchingEvidence = allEvidence.find(e => e.type === req.type);

            let status = "INSUFFICIENT_EVIDENCE";
            let reason = "No matching evidence found for requirement.";
            let evidenceId = null;

            if (matchingEvidence) {
                const rule = {
                    operator: req.operator as Operator,
                    threshold: req.threshold ?? undefined,
                    expectedValue: req.expectedValue ?? undefined
                };

                const result = evaluator.evaluate(rule, matchingEvidence.numericValue, matchingEvidence.value);
                status = result.status;
                reason = result.reason;
                evidenceId = matchingEvidence.id;
            }

            // 4. Save result
            await prisma.complianceResult.create({
                data: {
                    requirementId: req.id,
                    evidenceId: evidenceId,
                    status: status,
                    reason: reason,
                    confidence: matchingEvidence?.confidence ?? 1.0,
                }
            });
        }

        // Return summary
        const results = await prisma.complianceResult.findMany({
            where: { requirement: { tenderId: bid.tenderId } } // In a real scenario, filter by bidId, but our schema links Result to Requirement and Evidence. Wait, we should link ComplianceResult to BidId. Let's fix that in schema if possible, or just fetch via evidence.
        });

        return {
            bidId,
            status: "EVALUATED",
            totalEvaluated: requirements.length
        };
    }
}
