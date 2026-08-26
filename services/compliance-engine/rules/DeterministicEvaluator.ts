import { Rule, ConditionRule, LogicalRule, EvaluationNode } from "./RuleSchema";

export type ComplianceStatus = 
    | "COMPLIANT" 
    | "NON_COMPLIANT" 
    | "PARTIALLY_COMPLIANT" 
    | "INSUFFICIENT_EVIDENCE" 
    | "CONFLICTING_EVIDENCE"
    | "REQUIRES_OFFICER_REVIEW";

export class DeterministicEvaluator {
    evaluate(rule: Rule, evidenceList: any[]): { status: ComplianceStatus, trace: EvaluationNode } {
        const trace = this.evaluateNode(rule, evidenceList);
        
        let status: ComplianceStatus = "REQUIRES_OFFICER_REVIEW";
        if (trace.result === true) {
            status = "COMPLIANT";
        } else if (trace.result === false) {
            status = "NON_COMPLIANT";
        }

        return { status, trace };
    }

    private evaluateNode(rule: Rule, evidenceList: any[]): EvaluationNode {
        if (rule.type === "AND" || rule.type === "OR" || rule.type === "NOT") {
            return this.evaluateLogical(rule as LogicalRule, evidenceList);
        } else {
            return this.evaluateCondition(rule as ConditionRule, evidenceList);
        }
    }

    private evaluateLogical(rule: LogicalRule, evidenceList: any[]): EvaluationNode {
        const children = rule.conditions.map(cond => this.evaluateNode(cond, evidenceList));
        let result = false;

        if (rule.type === "AND") {
            result = children.every(c => c.result === true);
        } else if (rule.type === "OR") {
            result = children.some(c => c.result === true);
        } else if (rule.type === "NOT") {
            result = !children[0].result;
        }

        return {
            type: rule.type,
            result,
            children
        };
    }

    private evaluateCondition(rule: ConditionRule, evidenceList: any[]): EvaluationNode {
        // Find evidence matching the field requested
        const evidence = evidenceList.find(e => e.type === rule.field || (e.normalizedValue && e.normalizedValue.field === rule.field));
        
        const evidenceNumericValue = evidence?.numericValue ?? evidence?.normalizedValue?.amount;
        const evidenceStringValue = evidence?.value;

        if (rule.operator === "EXISTS") {
            const exists = !!evidence;
            return { type: "condition", field: rule.field, operator: rule.operator, result: exists, reason: exists ? "Evidence found" : "Evidence missing" };
        }

        if (rule.operator === "NOT_EXISTS") {
            const exists = !!evidence;
            return { type: "condition", field: rule.field, operator: rule.operator, result: !exists, reason: !exists ? "Evidence not found as required" : "Prohibited evidence found" };
        }

        if (!evidence) {
            return { type: "condition", field: rule.field, operator: rule.operator, result: false, reason: "Insufficient evidence to evaluate condition" };
        }

        if (rule.operator === "IN" && rule.expectedList) {
            const match = evidenceStringValue && rule.expectedList.includes(evidenceStringValue);
            return { type: "condition", field: rule.field, operator: rule.operator, result: !!match, actual: evidenceStringValue, required: rule.expectedList };
        }

        // Numeric comparisons
        if (rule.value !== undefined && rule.value !== null && typeof rule.value === "number") {
            if (evidenceNumericValue === undefined || evidenceNumericValue === null) {
                return { type: "condition", field: rule.field, operator: rule.operator, result: false, reason: "Numeric evidence missing" };
            }

            const val = evidenceNumericValue;
            const threshold = rule.value;
            let res = false;

            switch (rule.operator) {
                case ">=": res = val >= threshold; break;
                case ">": res = val > threshold; break;
                case "<=": res = val <= threshold; break;
                case "<": res = val < threshold; break;
                case "==": res = val === threshold; break;
                case "!=": res = val !== threshold; break;
            }

            return { type: "condition", field: rule.field, operator: rule.operator, result: res, actual: val, required: threshold };
        }

        return { type: "condition", field: rule.field, operator: rule.operator, result: false, reason: "Rule could not be definitively evaluated" };
    }
}


