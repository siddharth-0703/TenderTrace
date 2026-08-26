import { z } from "zod";
import { Operator } from "./DeterministicEvaluator";

export const RuleOperatorSchema = z.enum([
    ">=", "<=", ">", "<", "==", "!=", "IN", "EXISTS", "NOT_EXISTS"
]);

export const ConditionRuleSchema = z.object({
    type: z.literal("condition"),
    field: z.string(),
    operator: RuleOperatorSchema,
    value: z.any().optional(),
    unit: z.string().optional(),
    expectedList: z.array(z.string()).optional()
});

export type ConditionRule = z.infer<typeof ConditionRuleSchema>;

export type LogicalRule = {
    type: "AND" | "OR" | "NOT";
    conditions: Rule[];
};

export type Rule = ConditionRule | LogicalRule;

// We define the logical schema recursively
export const LogicalRuleSchema: z.ZodType<LogicalRule> = z.lazy(() =>
    z.object({
        type: z.enum(["AND", "OR", "NOT"]),
        conditions: z.array(RuleSchema)
    })
);

export const RuleSchema: z.ZodType<Rule> = z.lazy(() =>
    z.union([ConditionRuleSchema, LogicalRuleSchema])
);

// Evaluation Trace types
export type EvaluationNode = {
    type: "condition" | "AND" | "OR" | "NOT";
    result: boolean;
    reason?: string;
    field?: string;
    operator?: string;
    required?: any;
    actual?: any;
    children?: EvaluationNode[];
};
