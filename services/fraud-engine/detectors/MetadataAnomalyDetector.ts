import { FraudIndicator } from "./FraudIndicator";

export interface DocumentTimestampRecord {
    documentId: string;
    uploadTimestamp: Date;
    /** Optional: issue date extracted from document evidence (e.g., certificate date) */
    issuedDate?: Date | null;
}

export interface MetadataAnomalyInput {
    bidId: string;
    tenderClosingDate: Date | null;
    documents: DocumentTimestampRecord[];
}

/**
 * METADATA_ANOMALY detector
 *
 * Checks for suspicious timestamp patterns:
 *
 * 1. **Future upload** — document uploaded AFTER the tender's closing date.
 *    Severity: HIGH (document could have been backdated).
 *
 * 2. **Issued after closing** — certificate/document issue date is AFTER the
 *    tender closing date (impossible for a valid submission).
 *    Severity: CRITICAL.
 *
 * 3. **Bulk upload in same second** — 3+ documents uploaded with identical
 *    timestamps (suggests automated/fraudulent batch upload).
 *    Severity: MEDIUM.
 */
export class MetadataAnomalyDetector {
    detect(input: MetadataAnomalyInput): FraudIndicator[] {
        const indicators: FraudIndicator[] = [];

        // --- Check 1 & 2: Date-relative anomalies ---
        if (input.tenderClosingDate) {
            const closing = input.tenderClosingDate;

            for (const doc of input.documents) {
                // Upload after closing date
                if (doc.uploadTimestamp > closing) {
                    indicators.push({
                        type: "METADATA_ANOMALY",
                        severity: "HIGH",
                        description: `Document "${doc.documentId}" was uploaded on ${doc.uploadTimestamp.toISOString()}, which is AFTER the tender closing date (${closing.toISOString()}).`,
                        evidence: [doc.documentId]
                    });
                }

                // Certificate issued after closing date
                if (doc.issuedDate && doc.issuedDate > closing) {
                    indicators.push({
                        type: "METADATA_ANOMALY",
                        severity: "CRITICAL",
                        description: `Document "${doc.documentId}" has an issue date of ${doc.issuedDate.toISOString()}, which is AFTER the tender closing date (${closing.toISOString()}). This is chronologically impossible for a valid submission.`,
                        evidence: [doc.documentId]
                    });
                }
            }
        }

        // --- Check 3: Bulk simultaneous upload ---
        const timestampGroups = new Map<string, string[]>();
        for (const doc of input.documents) {
            // Round to the second for grouping
            const key = Math.floor(doc.uploadTimestamp.getTime() / 1000).toString();
            if (!timestampGroups.has(key)) timestampGroups.set(key, []);
            timestampGroups.get(key)!.push(doc.documentId);
        }

        for (const [, docIds] of timestampGroups) {
            if (docIds.length >= 3) {
                indicators.push({
                    type: "METADATA_ANOMALY",
                    severity: "MEDIUM",
                    description: `${docIds.length} documents (${docIds.join(", ")}) were uploaded at exactly the same timestamp. This may indicate an automated or fraudulent batch upload.`,
                    evidence: docIds
                });
            }
        }

        return indicators;
    }
}
