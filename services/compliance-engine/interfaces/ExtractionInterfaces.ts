export interface DocumentInput {
    id: string;
    fileReference: string;
}

export interface ExtractionResult {
    documentId: string;
    text: string;
    method: string;
    confidence: number;
    pages: Array<{ pageNumber: number; text: string; confidence: number }>;
}

export interface DocumentTextExtractor {
    extract(document: DocumentInput): Promise<ExtractionResult>;
}
