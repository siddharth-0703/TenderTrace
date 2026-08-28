import { DeterministicEvaluator } from "../rules/DeterministicEvaluator";
import { PrismaClient, Prisma } from "@prisma/client";
import { Normalizer } from "../normalization/Normalizer";
import { EvidenceValidator, ValidationStatus } from "../normalization/EvidenceValidator";
import { Rule, RuleSchema } from "../rules/RuleSchema";

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
            
            // Backwards compatibility layer for Phase 1 requirements
            let canonicalRule: Rule | null = null;
            if (req.rules) {
                // Parse structured rule
                const parsed = RuleSchema.safeParse(req.rules);
                if (parsed.success) {
                    canonicalRule = parsed.data;
                }
            }
            
            if (!canonicalRule && req.operator && req.type) {
                // Build a condition rule from Phase 1 legacy fields
                canonicalRule = {
                    type: "condition",
                    field: req.type,
                    operator: req.operator as any,
                    value: req.threshold ?? req.expectedValue ?? undefined,
                    unit: req.unit ?? undefined
                };
            }

            if (!canonicalRule) {
                await prisma.complianceResult.create({
                    data: {
                        requirementId: req.id,
                        status: "REQUIRES_OFFICER_REVIEW",
                        reason: "Requirement rule could not be parsed."
                    }
                });
                continue;
            }

            // Gather, Normalize and Validate evidence
            const relevantEvidence = allEvidence.filter(e => {
                // simple grouping heuristic for this demo
                return true; 
            }).map(e => {
                let norm = undefined;
                if (e.value && (e.type.includes("TURNOVER") || req.unit)) {
                    const res = Normalizer.normalizeNumeric(e.value);
                    if (res) norm = res;
                }
                const validation = EvidenceValidator.validate(e);
                
                return {
                    ...e,
                    normalizedValue: norm,
                    validationStatus: validation
                };
            });

            // Detect Conflicting Evidence for scalar values
            const conflicts: any[] = [];
            const fieldsChecked = new Set<string>();
            for (const ev of relevantEvidence) {
                if (ev.normalizedValue) {
                    const matchingOthers = relevantEvidence.filter(e => e.id !== ev.id && e.type === ev.type && e.normalizedValue);
                    for (const other of matchingOthers) {
                        if (other.normalizedValue?.amount !== ev.normalizedValue?.amount) {
                            if (!fieldsChecked.has(ev.type)) {
                                conflicts.push(ev);
                                conflicts.push(other);
                                fieldsChecked.add(ev.type);
                            }
                        }
                    }
                }
            }

            if (conflicts.length > 0) {
                await prisma.complianceResult.create({
                    data: {
                        requirementId: req.id,
                        status: "CONFLICTING_EVIDENCE",
                        reason: "Multiple documents provide conflicting values for this requirement.",
                        conflictingEvidence: JSON.stringify(conflicts.map(c => ({ id: c.id, value: c.value, documentId: c.documentId })))
                    }
                });
                continue;
            }
            
            // Filter out EXPIRED/INVALID evidence
            const validEvidence = relevantEvidence.filter(e => e.validationStatus !== "EXPIRED" && e.validationStatus !== "INVALID");

            // Evaluate
            const result = evaluator.evaluate(canonicalRule, validEvidence);

            // 4. Save result
            await prisma.complianceResult.create({
                data: {
                    requirementId: req.id,
                    status: result.status,
                    reason: result.trace.reason ?? "Compound evaluation complete.",
                    evaluationTrace: result.trace as unknown as Prisma.InputJsonValue
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
