import { AIRequirementOutput } from "../schemas/ai-output-schema";

export interface RequirementExtractionInput {
    documentId: string;
    section: string;
    pageNumber: number;
    text: string;
}

export interface AIProvider {
    extractRequirements(input: RequirementExtractionInput): Promise<AIRequirementOutput[]>;
}
