import { DocumentInput, ExtractionResult, DocumentTextExtractor } from "../interfaces/ExtractionInterfaces";

export class MockOCRProvider implements DocumentTextExtractor {
    async extract(document: DocumentInput): Promise<ExtractionResult> {
        return {
            documentId: document.id,
            text: "This is a mock extracted text from the document. Turnover: 72000000 INR",
            method: "MOCK_OCR",
            confidence: 0.95,
            pages: [
                {
                    pageNumber: 1,
                    text: "Turnover: 72000000 INR",
                    confidence: 0.95
                }
            ]
        };
    }
}
