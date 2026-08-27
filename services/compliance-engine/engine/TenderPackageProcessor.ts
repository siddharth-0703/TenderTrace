import { PrismaClient } from "@prisma/client";
import { RequirementProcessor } from "./RequirementProcessor";
import { CrossDocumentAnalyzer } from "../analysis/CrossDocumentAnalyzer";
import { DocumentClassifier } from "../classification/DocumentClassifier";

const prisma = new PrismaClient();
const reqProcessor = new RequirementProcessor();
const crossDocAnalyzer = new CrossDocumentAnalyzer();

export class TenderPackageProcessor {
    async processPackage(tenderId: string, documentIds: string[]) {
        
        console.log(`[TenderPackageProcessor] Processing ${documentIds.length} documents for tender ${tenderId}...`);
        
        // 1. Process each document concurrently
        const processPromises = documentIds.map(async (docId) => {
            const doc = await prisma.document.findUnique({ where: { id: docId } });
            if (!doc) return;

            // Classify document
            const docClass = DocumentClassifier.classify(doc.filename, "");
            await prisma.document.update({
                where: { id: docId },
                data: { documentClass: docClass }
            });

            console.log(`[TenderPackageProcessor] Extracted ${doc.filename} -> ${docClass}`);
            
            // Run standard Phase 3 single-document extraction
            await reqProcessor.processTenderDocument(tenderId, docId, doc.filename);
        });

        await Promise.all(processPromises);

        // 2. Cross-Document Analysis (Corrigenda, Conflicts, Deduplication)
        console.log(`[TenderPackageProcessor] Running Cross-Document Analysis...`);
        await crossDocAnalyzer.analyzeTenderPackage(tenderId);

        console.log(`[TenderPackageProcessor] Package analysis complete.`);
    }
}
