import { PrismaClient } from "@prisma/client";
import { TenderTextLoader } from "../text/TenderTextLoader";
import { TenderRequirementDetector } from "../matching/TenderRequirementDetector";
import { CrossDocumentAnalyzer } from "../analysis/CrossDocumentAnalyzer";
import { DocumentClassifier } from "../classification/DocumentClassifier";

const prisma = new PrismaClient();
const crossDocAnalyzer = new CrossDocumentAnalyzer();

export class TenderPackageProcessor {
    async processPackage(tenderId: string, documentIds: string[]) {
        console.log(`[TenderPackageProcessor] Processing ${documentIds.length} documents for tender ${tenderId}...`);
        
        // 1. Classify documents
        for (const docId of documentIds) {
            const doc = await prisma.document.findUnique({ where: { id: docId } });
            if (doc) {
                const docClass = DocumentClassifier.classify(doc.filename, "");
                await prisma.document.update({
                    where: { id: docId },
                    data: { documentClass: docClass }
                });
                console.log(`[TenderPackageProcessor] Classified ${doc.filename} -> ${docClass}`);
            }
        }

        // 2. Load Tender Text from real extracted pages
        const tenderPages = await TenderTextLoader.loadTenderText(tenderId);
        console.log(`[TenderPackageProcessor] Loaded ${tenderPages.length} pages`);

        // 3. Detect Real Requirements using TenderRequirementDetector
        const requirementCandidates = TenderRequirementDetector.detectRequirements(tenderPages);
        console.log(`[TenderPackageProcessor] Detected ${requirementCandidates.length} requirements`);

        // Clean up old requirements for this tender to prevent duplication
        await prisma.tenderRequirement.deleteMany({ where: { tenderId } });

        // 4. Save Requirements to DB
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
                    category: cand.type === 'EMD' || cand.type === 'GST' || cand.type === 'TURNOVER' ? "FINANCIAL" : "TECHNICAL",
                    operator: cand.operator,
                    sourceDocumentId: cand.documentId,
                    sourceProvenance: JSON.stringify({ page: cand.pageNumber, originalText: cand.sourceText }),
                    rules: JSON.stringify(rules),
                    reviewStatus: "EXTRACTED",
                    aiMetadata: JSON.stringify({ heuristicConfidence: cand.heuristicConfidence })
                }
            });
        }

        // 5. Cross-Document Analysis (Corrigenda, Conflicts, Deduplication)
        console.log(`[TenderPackageProcessor] Running Cross-Document Analysis...`);
        try {
            await crossDocAnalyzer.analyzeTenderPackage(tenderId);
        } catch (err) {
            console.error(`[TenderPackageProcessor] CrossDocAnalyzer error:`, err);
        }

        console.log(`[TenderPackageProcessor] Package analysis complete. Requirements saved: ${requirementCandidates.length}`);
    }
}
