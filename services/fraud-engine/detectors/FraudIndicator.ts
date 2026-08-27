/**
 * Fraud Engine — Core Shared Types
 * All fraud detectors produce FraudIndicator objects.
 */

export type IndicatorType =
    | "IDENTITY_MISMATCH"
    | "DOCUMENT_DUPLICATION"
    | "METADATA_ANOMALY";

export type IndicatorSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface FraudIndicator {
    type: IndicatorType;
    severity: IndicatorSeverity;
    description: string;
    /** IDs of the documents/bids that are evidence for this indicator */
    evidence: string[];
}
