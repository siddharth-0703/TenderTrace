export interface RequirementConfidence {
    detection: number;
    classification: number;
    ruleExtraction: number;
    valueExtraction?: number;
}

export interface SourceProvenance {
    documentId: string;
    pageNumber: number;
    section?: string;
    originalText: string;
}

export interface AIMetadata {
    provider: string;
    model?: string;
    promptVersion: string;
    extractedAt: string;
}

export type ReviewStatus = 
    | "DETECTED"
    | "EXTRACTED"
    | "VALIDATED"
    | "REVIEW_REQUIRED"
    | "APPROVED"
    | "REJECTED"
    | "CONFLICTING";
