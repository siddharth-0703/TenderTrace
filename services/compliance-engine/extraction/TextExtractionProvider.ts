export interface DocumentInput {
    id: string;
    fileReference: string;
}

export interface PageText {
    pageNumber: number;
    text: string;
}

export interface TextExtractionResult {
    documentId: string;
    pages: PageText[];
}

export interface TextExtractionProvider {
    extract(document: DocumentInput): Promise<TextExtractionResult>;
}
