import { PrismaClient, TenderRequirement, Document } from "@prisma/client";

const prisma = new PrismaClient();

export class CrossDocumentAnalyzer {
    async analyzeTenderPackage(tenderId: string) {
        // Fetch all active requirements for this tender, ordered by creation (assuming processing order)
        const requirements = await prisma.tenderRequirement.findMany({
            where: { tenderId, status: "ACTIVE" },
            include: { tender: { include: { documents: true } } }
        });

        // 1. Duplicate & Conflict Detection
        const processedTypes = new Map<string, TenderRequirement>();

        for (const req of requirements) {
            const key = `${req.category}_${req.type}`;
            const existingReq = processedTypes.get(key);

            if (existingReq) {
                // We have a cross-document overlap.
                const ruleA = JSON.stringify(existingReq.rules);
                const ruleB = JSON.stringify(req.rules);

                if (ruleA === ruleB) {
                    // Exact duplicate rule across documents
                    await prisma.tenderRequirement.update({
                        where: { id: req.id },
                        data: { reviewStatus: "REVIEW_REQUIRED" } // Treat as duplicate candidate
                    });
                } else {
                    // Conflict! Check if one is a Corrigendum modifying the other.
                    const sourceDocId = req.sourceDocumentId;
                    let isCorrigendumOverride = false;

                    if (sourceDocId) {
                        const doc = await prisma.document.findUnique({ where: { id: sourceDocId } });
                        if (doc && doc.documentClass === "CORRIGENDUM") {
                            // Phase 4 Correction: Only supersede if the AI metadata explicitly flags it as modifying this.
                            const aiMetadata: any = req.aiMetadata;
                            if (aiMetadata && aiMetadata.modifiesRequirementType === req.type) {
                                isCorrigendumOverride = true;
                            }
                        }
                    }

                    if (isCorrigendumOverride) {
                        // Supersede the older requirement
                        await prisma.tenderRequirement.update({
                            where: { id: existingReq.id },
                            data: { status: "SUPERSEDED" }
                        });
                        
                        await prisma.tenderRequirement.update({
                            where: { id: req.id },
                            data: { 
                                version: existingReq.version + 1,
                                supersededById: req.id, // Just illustrative mapping for relation
                                reviewStatus: "EXTRACTED"
                            }
                        });

                        processedTypes.set(key, req); // Update active reference
                    } else {
                        // True Conflict, requires human review
                        await prisma.tenderRequirement.updateMany({
                            where: { id: { in: [req.id, existingReq.id] } },
                            data: { reviewStatus: "CONFLICTING" }
                        });
                    }
                }
            } else {
                processedTypes.set(key, req);
            }
        }
    }
}
