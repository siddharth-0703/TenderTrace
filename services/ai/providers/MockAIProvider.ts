import { AIProvider, RequirementExtractionInput } from "./AIProvider";
import { AIRequirementOutput } from "../schemas/ai-output-schema";
import { REQUIREMENT_EXTRACTION_V1 } from "../prompts/requirement-extraction";

export class MockAIProvider implements AIProvider {
    private readonly PROMPT_VERSION = "REQUIREMENT_EXTRACTION_V1";

    async extractRequirements(input: RequirementExtractionInput): Promise<AIRequirementOutput[]> {
        // This is a generic mock that checks the input text and returns deterministic JSON
        // to pass the Golden Test Cases without calling a live LLM API.
        
        const lowerText = input.text.toLowerCase();
        
        if (lowerText.includes("turnover") && lowerText.includes("5 crore") && lowerText.includes("three financial years")) {
            return [{
                category: "FINANCIAL", type: "TURNOVER", description: input.text, mandatory: true,
                rule: { type: "condition", field: "averageAnnualTurnover", operator: ">=", value: 50000000, unit: "INR" },
                applicability: { period: { type: "RELATIVE", value: 3, unit: "FINANCIAL_YEARS" } },
                confidence: { detection: 0.98, classification: 0.95, ruleExtraction: 0.92 }
            }];
        }
        
        if (lowerText.includes("similar works") && lowerText.includes("three") && lowerText.includes("five years")) {
            return [{
                category: "EXPERIENCE", type: "PAST_PERFORMANCE", description: input.text, mandatory: true,
                rule: { type: "condition", field: "similarCompletedWorks", operator: ">=", value: 3 },
                applicability: { period: { type: "RELATIVE", value: 5, unit: "YEARS" } },
                confidence: { detection: 0.95, classification: 0.90, ruleExtraction: 0.88 }
            }];
        }
        
        if (lowerText.includes("gst") && lowerText.includes("equivalent")) {
            return [{
                category: "REGISTRATION", type: "TAX", description: input.text, mandatory: true,
                rule: { type: "OR", conditions: [
                    { type: "condition", field: "GST_CERTIFICATE", operator: "EXISTS" },
                    { type: "condition", field: "EQUIVALENT_STATUTORY_REGISTRATION", operator: "EXISTS" }
                ]},
                confidence: { detection: 0.99, classification: 0.96, ruleExtraction: 0.94 }
            }];
        }
        
        if (lowerText.includes("manufacturers") && lowerText.includes("authorization letter")) {
            return [{
                category: "TECHNICAL", type: "OEM_AUTHORIZATION", description: input.text, mandatory: true,
                // In Phase 2 rule structure, we don't have an IF operator yet, so we could use a condition 
                // OR we just map it. The prompt expects IF bidderType == MANUFACTURER, but we use existing logic.
                // For simplicity, we represent it as a conditional flag.
                rule: { type: "condition", field: "OEM_AUTHORIZATION", operator: "EXISTS" }, // Simplification
                confidence: { detection: 0.90, classification: 0.85, ruleExtraction: 0.82 }
            }];
        }
        
        if (lowerText.includes("adequate financial capacity")) {
            // Ambiguous
            return [{
                category: "FINANCIAL", type: "UNKNOWN", description: input.text, mandatory: true,
                confidence: { detection: 0.60, classification: 0.50, ruleExtraction: 0.30 } // Low confidence will trigger review
            }];
        }

        if (lowerText.includes("minimum turnover shall be ₹5 crore")) {
            return [{
                category: "FINANCIAL", type: "TURNOVER", description: input.text, mandatory: true,
                rule: { type: "condition", field: "minimumTurnover", operator: ">=", value: 50000000, unit: "INR" },
                confidence: { detection: 0.95, classification: 0.95, ruleExtraction: 0.95 }
            }];
        }
        
        if (lowerText.includes("minimum turnover shall be ₹10 crore") && input.documentId.includes("corrigendum")) {
            return [{
                category: "FINANCIAL", type: "TURNOVER", description: input.text, mandatory: true,
                rule: { type: "condition", field: "minimumTurnover", operator: ">=", value: 100000000, unit: "INR" },
                confidence: { detection: 0.95, classification: 0.95, ruleExtraction: 0.95 },
                // Mocking the specific AI output structure for a Corrigendum override
            }] as any; 
            // In a real scenario, we'd adjust AIRequirementOutputSchema to allow custom metadata.
            // For now, we will intercept this back in the caller or rely on document type.
        }

        if (lowerText.includes("minimum turnover shall be ₹10 crore")) {
            return [{
                category: "FINANCIAL", type: "TURNOVER", description: input.text, mandatory: true,
                rule: { type: "condition", field: "minimumTurnover", operator: ">=", value: 100000000, unit: "INR" },
                confidence: { detection: 0.95, classification: 0.95, ruleExtraction: 0.95 }
            }];
        }

        return [];
    }

    // PHASE 5: BIDDER EVIDENCE EXTRACTION
    async extractEvidence(input: RequirementExtractionInput): Promise<any[]> {
        const lowerText = input.text.toLowerCase();
        
        if (lowerText.includes("turnover") && lowerText.includes("6.2 crore")) {
            return [{
                field: "minimumTurnover",
                rawValue: "6.2 Crore",
                normalizedValue: 62000000,
                currency: "INR",
                confidence: 0.98
            }];
        }
        
        if (lowerText.includes("gst") && lowerText.includes("active")) {
            return [{
                field: "GST_CERTIFICATE",
                rawValue: "ACTIVE",
                normalizedValue: true,
                confidence: 0.99
            }];
        }
        
        if (lowerText.includes("experience") && lowerText.includes("7 years")) {
            return [{
                field: "similarCompletedWorks", // Mapping to the experience rule field
                rawValue: "7 years",
                normalizedValue: 7,
                confidence: 0.95
            }];
        }

        return [];
    }
}
