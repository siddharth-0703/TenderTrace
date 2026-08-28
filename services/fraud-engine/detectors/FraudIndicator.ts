/**
 * Fraud Engine — Core Shared Types
 * All fraud detectors produce FraudIndicator objects.
 */

export type IndicatorType =
    | "IDENTITY_MISMATCH"
    | "DOCUMENT_DUPLICATION"
    | "METADATA_ANOMALY"
    | "COMPANY_INCONSISTENCY"
    | "CROSS_BID_SIMILARITY"
    | "SUSPICIOUS_DATE"
    | "STRUCTURAL_ANOMALY";

export type IndicatorSeverity = "INFORMATIONAL" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type InvestigationPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface StructuredEvidenceItem {
    documentId?: string;
    field?: string;
    value?: string;
    expectedValue?: string;
    details?: string;
    score?: number;
    matchedBidId?: string;
    matchedDocId?: string;
    timestamp?: string;
}

export interface FraudIndicator {
    type: IndicatorType;
    severity: IndicatorSeverity;
    title?: string;
    description: string;
    /** IDs of the documents/bids that are evidence for this indicator (for backwards-compatibility & easy referencing) */
    evidence: string[];
    /** Rich structured comparison points for deep inspection */
    structuredEvidence?: StructuredEvidenceItem[];
    detector?: string;
    recommendation?: string;
}

export interface CorrelatedFinding {
    type: string;
    severity: IndicatorSeverity;
    title: string;
    description: string;
    supportingIndicators: IndicatorType[];
    evidence: string[];
    structuredEvidence?: StructuredEvidenceItem[];
    explanation?: string;
}

export interface FullFraudAssessment {
    riskScore: number;                 // 0 – 100
    riskLevel: RiskLevel;              // LOW, MEDIUM, HIGH, CRITICAL
    confidence: number;                // 0 – 100% evidence-based signal confidence
    investigationPriority: InvestigationPriority; // LOW, MEDIUM, HIGH, CRITICAL
    indicators: FraudIndicator[];
    correlatedFindings: CorrelatedFinding[];
    summaryRecommendation: string;
}

