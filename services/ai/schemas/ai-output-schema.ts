import { z } from "zod";
import { RuleSchema } from "../../compliance-engine/rules/RuleSchema";

// Schema for temporal constraints
export const TemporalConstraintSchema = z.object({
    type: z.enum(["RELATIVE", "ABSOLUTE"]),
    value: z.number().optional(),
    unit: z.enum(["FINANCIAL_YEARS", "YEARS", "MONTHS", "DAYS"]).optional(),
    reference: z.string().optional()
});

// The final structured JSON we expect from the AI model
export const AIRequirementOutputSchema = z.object({
    category: z.string(),
    type: z.string(),
    description: z.string(),
    mandatory: z.boolean().default(true),
    rule: RuleSchema.optional(), // Must map to Phase 2 deterministic rule
    applicability: z.object({
        period: TemporalConstraintSchema.optional()
    }).optional(),
    confidence: z.object({
        detection: z.number(),
        classification: z.number(),
        ruleExtraction: z.number()
    }).optional()
});

export type AIRequirementOutput = z.infer<typeof AIRequirementOutputSchema>;
