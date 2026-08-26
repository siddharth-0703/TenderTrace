export type Operator = ">=" | "<=" | ">" | "<" | "==" | "!=" | "IN" | "EXISTS" | "NOT_EXISTS";

export interface EvaluationRule {
    operator: Operator;
    threshold?: number;
    expectedValue?: string;
    expectedList?: string[];
}

export type ComplianceStatus = 
    | "COMPLIANT" 
    | "NON_COMPLIANT" 
    | "PARTIALLY_COMPLIANT" 
    | "INSUFFICIENT_EVIDENCE" 
    | "REQUIRES_OFFICER_REVIEW";

export class DeterministicEvaluator {
    evaluate(rule: EvaluationRule, evidenceNumericValue?: number | null, evidenceStringValue?: string | null): { status: ComplianceStatus, reason: string } {
        if (rule.operator === "EXISTS") {
            if (evidenceStringValue || evidenceNumericValue !== undefined && evidenceNumericValue !== null) {
                return { status: "COMPLIANT", reason: "Required evidence exists." };
            }
            return { status: "INSUFFICIENT_EVIDENCE", reason: "Required evidence does not exist." };
        }

        if (rule.operator === "NOT_EXISTS") {
            if (!evidenceStringValue && (evidenceNumericValue === undefined || evidenceNumericValue === null)) {
                return { status: "COMPLIANT", reason: "Prohibited evidence does not exist." };
            }
            return { status: "NON_COMPLIANT", reason: "Prohibited evidence exists." };
        }

        if (rule.operator === "IN" && rule.expectedList) {
            if (evidenceStringValue && rule.expectedList.includes(evidenceStringValue)) {
                return { status: "COMPLIANT", reason: `Value '${evidenceStringValue}' is in expected list.` };
            }
            return { status: "NON_COMPLIANT", reason: `Value '${evidenceStringValue}' is not in expected list.` };
        }

        // Numeric comparisons
        if (rule.threshold !== undefined && rule.threshold !== null) {
            if (evidenceNumericValue === undefined || evidenceNumericValue === null) {
                return { status: "INSUFFICIENT_EVIDENCE", reason: "Numeric evidence is missing for threshold comparison." };
            }

            const val = evidenceNumericValue;
            const threshold = rule.threshold;

            switch (rule.operator) {
                case ">=":
                    if (val >= threshold) return { status: "COMPLIANT", reason: `Value ${val} satisfies >= ${threshold}.` };
                    return { status: "NON_COMPLIANT", reason: `Value ${val} is less than required ${threshold}.` };
                case ">":
                    if (val > threshold) return { status: "COMPLIANT", reason: `Value ${val} satisfies > ${threshold}.` };
                    return { status: "NON_COMPLIANT", reason: `Value ${val} is not greater than required ${threshold}.` };
                case "<=":
                    if (val <= threshold) return { status: "COMPLIANT", reason: `Value ${val} satisfies <= ${threshold}.` };
                    return { status: "NON_COMPLIANT", reason: `Value ${val} is greater than required ${threshold}.` };
                case "<":
                    if (val < threshold) return { status: "COMPLIANT", reason: `Value ${val} satisfies < ${threshold}.` };
                    return { status: "NON_COMPLIANT", reason: `Value ${val} is not less than required ${threshold}.` };
                case "==":
                    if (val === threshold) return { status: "COMPLIANT", reason: `Value ${val} equals ${threshold}.` };
                    return { status: "NON_COMPLIANT", reason: `Value ${val} does not equal ${threshold}.` };
                case "!=":
                    if (val !== threshold) return { status: "COMPLIANT", reason: `Value ${val} does not equal ${threshold}.` };
                    return { status: "NON_COMPLIANT", reason: `Value ${val} equals ${threshold} (prohibited).` };
            }
        }

        // String comparisons
        if (rule.expectedValue !== undefined && rule.expectedValue !== null) {
            if (evidenceStringValue === undefined || evidenceStringValue === null) {
                return { status: "INSUFFICIENT_EVIDENCE", reason: "String evidence is missing for exact match." };
            }

            const val = evidenceStringValue.toLowerCase().trim();
            const expected = rule.expectedValue.toLowerCase().trim();

            switch (rule.operator) {
                case "==":
                    if (val === expected) return { status: "COMPLIANT", reason: `Value matches expected '${rule.expectedValue}'.` };
                    return { status: "NON_COMPLIANT", reason: `Value '${evidenceStringValue}' does not match expected '${rule.expectedValue}'.` };
                case "!=":
                    if (val !== expected) return { status: "COMPLIANT", reason: `Value does not match prohibited '${rule.expectedValue}'.` };
                    return { status: "NON_COMPLIANT", reason: `Value matches prohibited '${rule.expectedValue}'.` };
            }
        }

        return { status: "REQUIRES_OFFICER_REVIEW", reason: "Rule could not be evaluated definitively." };
    }
}
