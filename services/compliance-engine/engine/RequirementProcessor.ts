import { PrismaClient, Prisma } from "@prisma/client";
import { MockOCRExtractionProvider } from "../extraction/MockOCRExtractionProvider";
import { SectionDetector } from "../detection/SectionDetector";
import { RequirementCandidateDetector } from "../detection/RequirementCandidateDetector";
import { MockAIProvider } from "../../ai/providers/MockAIProvider";
import { AIRequirementOutputSchema } from "../../ai/schemas/ai-output-schema";
import { ReviewStatus } from "../rules/RequirementMetadata";

const prisma = new PrismaClient();
const textExtractor = new MockOCRExtractionProvider();
const aiProvider = new MockAIProvider();

export class RequirementProcessor {
    
    async processTenderDocument(tenderId: string, documentId: string, fileReference: string) {
        // 1. Text Extraction
        const textResult = await textExtractor.extract({ id: documentId, fileReference });

        // 2. Section Detection
        const sections = SectionDetector.detectSections(textResult);

        // 3. Requirement Candidate Detection
        const candidates = RequirementCandidateDetector.detectCandidates(sections);

        // 4. AI Extraction & Validation Loop
        const extractedRequirements = [];
        
        for (const candidate of candidates) {
            // Call AI
            const rawOutputs = await aiProvider.extractRequirements({
                documentId,
                section: candidate.sectionTitle,
                pageNumber: candidate.pageNumber,
                text: candidate.text
            });

            for (const output of rawOutputs) {
                // Zod Validation
                const validation = AIRequirementOutputSchema.safeParse(output);
                
                if (validation.success) {
                    const data = validation.data;
                    
                    // Confidence Thresholds
                    const avgConfidence = data.confidence ? 
                        (data.confidence.detection + data.confidence.classification + data.confidence.ruleExtraction) / 3 
                        : 0;
                    
                    let reviewStatus: ReviewStatus = "EXTRACTED";
                    if (avgConfidence < 0.70) {
                        reviewStatus = "REVIEW_REQUIRED";
                    } else if (avgConfidence < 0.90) {
                        reviewStatus = "REVIEW_REQUIRED"; // "RECOMMENDED" collapses into REQUIRED for safety in DB
                    } else {
                        reviewStatus = "EXTRACTED"; // Ready for auto-approval workflow depending on policy
                    }

                    // Save to DB
                    const req = await prisma.tenderRequirement.create({
                        data: {
                            tenderId: tenderId,
                            category: data.category,
                            type: data.type,
                            description: data.description,
                            mandatory: data.mandatory,
                            rules: JSON.stringify(data.rule),
                            operator: "AI_EXTRACTED", // Legacy fallback
                            sourceDocumentId: documentId,
                            reviewStatus: reviewStatus,
                            confidence: JSON.stringify(data.confidence),
                            sourceProvenance: JSON.stringify({
                                documentId,
                                pageNumber: candidate.pageNumber,
                                section: candidate.sectionTitle,
                                originalText: candidate.text
                            }),
                            aiMetadata: JSON.stringify({
                                provider: "MockAIProvider",
                                promptVersion: "REQUIREMENT_EXTRACTION_V1",
                                extractedAt: new Date().toISOString()
                            })
                        }
                    });
                    
                    extractedRequirements.push(req);
                }
            }
        }

        // 5. Duplicate and Conflict Detection
        await this.detectDuplicatesAndConflicts(tenderId);

        return extractedRequirements;
    }

    private async detectDuplicatesAndConflicts(tenderId: string) {
        const requirements = await prisma.tenderRequirement.findMany({
            where: { tenderId }
        });

        const checkedIds = new Set<string>();

        for (let i = 0; i < requirements.length; i++) {
            const reqA = requirements[i];
            if (checkedIds.has(reqA.id)) continue;

            for (let j = i + 1; j < requirements.length; j++) {
                const reqB = requirements[j];
                
                if (reqA.type === reqB.type && reqA.category === reqB.category) {
                    
                    // Simplified duplicate/conflict logic based on structured rules
                    const ruleA = JSON.stringify(reqA.rules);
                    const ruleB = JSON.stringify(reqB.rules);

                    if (ruleA === ruleB) {
                        // Same exact rule extracted twice
                        await prisma.tenderRequirement.update({
                            where: { id: reqA.id },
                            data: { reviewStatus: "REVIEW_REQUIRED" } // Flag as DUPLICATE_CANDIDATE conceptually
                        });
                        checkedIds.add(reqB.id); // Mark B as handled
                    } else {
                        // Conflict!
                        await prisma.tenderRequirement.updateMany({
                            where: { id: { in: [reqA.id, reqB.id] } },
                            data: { reviewStatus: "CONFLICTING" }
                        });
                        checkedIds.add(reqB.id);
                    }
                }
            }
        }
    }
}
