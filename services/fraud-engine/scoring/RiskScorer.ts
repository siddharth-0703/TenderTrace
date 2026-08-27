import { FraudIndicator, IndicatorSeverity } from "../detectors/FraudIndicator";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface RiskScore {
    riskScore: number;  // 0 – 100
    riskLevel: RiskLevel;
}

const SEVERITY_POINTS: Record<IndicatorSeverity, number> = {
    LOW: 5,
    MEDIUM: 15,
    HIGH: 25,
    CRITICAL: 40
};

/**
 * RiskScorer
 *
 * Aggregates FraudIndicator severities into a single risk score.
 *
 * Score = sum of per-indicator points, capped at 100.
 *
 * Risk levels:
 *   0  – 20  → LOW
 *   21 – 50  → MEDIUM
 *   51 – 75  → HIGH
 *   76 – 100 → CRITICAL
 */
export class RiskScorer {
    score(indicators: FraudIndicator[]): RiskScore {
        const total = indicators.reduce(
            (acc, ind) => acc + SEVERITY_POINTS[ind.severity],
            0
        );

        const riskScore = Math.min(100, total);

        let riskLevel: RiskLevel;
        if (riskScore >= 76) {
            riskLevel = "CRITICAL";
        } else if (riskScore >= 51) {
            riskLevel = "HIGH";
        } else if (riskScore >= 21) {
            riskLevel = "MEDIUM";
        } else {
            riskLevel = "LOW";
        }

        return { riskScore, riskLevel };
    }
}
