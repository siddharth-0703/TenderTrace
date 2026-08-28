import { CorrelatedFinding, FraudIndicator, IndicatorSeverity, InvestigationPriority, RiskLevel } from "../detectors/FraudIndicator";

export interface RiskScoreResult {
    riskScore: number;                 // 0 – 100
    riskLevel: RiskLevel;              // LOW, MEDIUM, HIGH, CRITICAL
    confidence: number;                // 0 – 100% evidence-based confidence
    investigationPriority: InvestigationPriority; // LOW, MEDIUM, HIGH, CRITICAL
    summaryRecommendation: string;
}

const SEVERITY_POINTS: Record<IndicatorSeverity, number> = {
    INFORMATIONAL: 0,
    LOW: 5,
    MEDIUM: 15,
    HIGH: 25,
    CRITICAL: 40
};

/**
 * RiskScorer
 *
 * Deterministically aggregates indicators and correlated findings into:
 * 1. riskScore (0–100) — Severity impact
 * 2. riskLevel (LOW / MEDIUM / HIGH / CRITICAL)
 * 3. confidence (0–100%) — Strength and corroboration of underlying evidence
 * 4. investigationPriority (LOW / MEDIUM / HIGH / CRITICAL) — Procurement Officer triage priority
 */
export class RiskScorer {
    score(indicators: FraudIndicator[], correlatedFindings: CorrelatedFinding[] = []): RiskScoreResult {
        if (indicators.length === 0) {
            return {
                riskScore: 0,
                riskLevel: "LOW",
                confidence: 95, // High confidence that submission is clean
                investigationPriority: "LOW",
                summaryRecommendation: "No significant anomalies detected. Standard procurement due diligence is recommended."
            };
        }

        // 1. Calculate Base Risk Points
        let totalPoints = indicators.reduce(
            (acc, ind) => acc + (SEVERITY_POINTS[ind.severity] || 0),
            0
        );

        // 2. Multi-Signal Compound Synergy Bonus
        // When correlated clusters exist, compound risk is higher than isolated sum
        if (correlatedFindings.length > 0) {
            const hasCriticalCluster = correlatedFindings.some(c => c.severity === "CRITICAL");
            const hasHighCluster = correlatedFindings.some(c => c.severity === "HIGH");
            if (hasCriticalCluster) {
                totalPoints += 15;
            } else if (hasHighCluster) {
                totalPoints += 10;
            }
        }

        const riskScore = Math.min(100, Math.max(0, totalPoints));

        // 3. Determine Risk Level
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

        // 4. Determine Evidence-Based Confidence (0–100%)
        // Confidence measures how strongly the available facts & data corroborate the finding.
        let confidenceScore = 60; // baseline heuristic

        const hasHashCollisions = indicators.some(i => i.type === "DOCUMENT_DUPLICATION");
        const hasStructuredEvidence = indicators.some(i => (i.structuredEvidence?.length || 0) > 0);
        const hasCriticalIndicators = indicators.some(i => i.severity === "CRITICAL");
        const hasMultipleIndicators = indicators.length >= 3;

        if (hasHashCollisions) {
            // Cryptographic binary hash match is mathematically unambiguous
            confidenceScore += 30;
        }
        if (hasStructuredEvidence) {
            confidenceScore += 10;
        }
        if (correlatedFindings.length > 0) {
            confidenceScore += 15;
        }
        if (hasCriticalIndicators && hasMultipleIndicators) {
            confidenceScore += 10;
        }

        // If only a single weak/low indicator is present, lower confidence
        if (indicators.length === 1 && indicators[0].severity === "LOW") {
            confidenceScore = 45;
        }

        const confidence = Math.min(98, Math.max(35, confidenceScore));

        // 5. Determine Investigation Priority
        let investigationPriority: InvestigationPriority;
        if (riskLevel === "CRITICAL" || correlatedFindings.some(c => c.severity === "CRITICAL")) {
            investigationPriority = "CRITICAL";
        } else if (riskLevel === "HIGH" || correlatedFindings.length > 0 || indicators.some(i => i.severity === "HIGH")) {
            investigationPriority = "HIGH";
        } else if (riskLevel === "MEDIUM" || indicators.some(i => i.severity === "MEDIUM")) {
            investigationPriority = "MEDIUM";
        } else {
            investigationPriority = "LOW";
        }

        // 6. Generate Summary Recommendation
        let summaryRecommendation = "";
        switch (investigationPriority) {
            case "CRITICAL":
                summaryRecommendation = "Immediate manual investigation required. Multiple severe or cross-bid collusive indicators detected before proceeding with tender evaluation.";
                break;
            case "HIGH":
                summaryRecommendation = "High anomaly risk identified. Manual verification of statutory documents, entity identities, and credentials is strongly recommended.";
                break;
            case "MEDIUM":
                summaryRecommendation = "Moderate inconsistencies detected. Officer verification of specific flagged documents is recommended.";
                break;
            case "LOW":
                summaryRecommendation = "Low risk profile. Proceed with standard due diligence verification.";
                break;
        }

        return {
            riskScore,
            riskLevel,
            confidence,
            investigationPriority,
            summaryRecommendation
        };
    }
}

