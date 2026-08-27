import { FraudIndicator, IndicatorSeverity, StructuredEvidenceItem } from "./FraudIndicator";

export interface DocumentTimestampRecord {
    documentId: string;
    filename?: string;
    uploadTimestamp: Date;
    /** Issue date extracted from document evidence (e.g., certificate issue date) */
    issuedDate?: Date | null;
    /** Expiry date extracted from document evidence (e.g., certificate validity end date) */
    expiryDate?: Date | null;
    /** Incorporation/registration date if available */
    registrationDate?: Date | null;
    /** Metadata author or tool */
    metadataProducer?: string | null;
}

export interface MetadataAnomalyInput {
    bidId: string;
    tenderClosingDate: Date | null;
    tenderIssueDate?: Date | null;
    documents: DocumentTimestampRecord[];
}

/**
 * METADATA_ANOMALY & SUSPICIOUS_DATE detector
 *
 * Checks for suspicious chronological and forensic metadata patterns:
 *
 * 1. **Certificate expired before tender closing** — Expired statutory/technical credential.
 * 2. **Document issued after tender closing** — Chronologically impossible for valid original submission.
 * 3. **Document uploaded after closing date** — Potential post-deadline tampering.
 * 4. **Issue date precedes incorporation/registration date** — Anachronistic document.
 * 5. **Bulk simultaneous upload** — 3+ documents uploaded in the exact same second (weak automated pattern).
 */
export class MetadataAnomalyDetector {
    detect(input: MetadataAnomalyInput): FraudIndicator[] {
        const indicators: FraudIndicator[] = [];

        // --- Check 1, 2, 3: Date-relative anomalies ---
        if (input.tenderClosingDate) {
            const closing = input.tenderClosingDate;

            for (const doc of input.documents) {
                // Check 1: Document uploaded after closing date
                if (doc.uploadTimestamp > closing) {
                    indicators.push({
                        type: "METADATA_ANOMALY",
                        severity: "HIGH",
                        title: "Post-Deadline Document Upload",
                        description: `Document "${doc.filename || doc.documentId}" was uploaded on ${doc.uploadTimestamp.toISOString()}, which is AFTER the tender closing date (${closing.toISOString()}).`,
                        evidence: [doc.documentId],
                        structuredEvidence: [
                            {
                                documentId: doc.documentId,
                                field: "uploadTimestamp",
                                value: doc.uploadTimestamp.toISOString(),
                                expectedValue: `< ${closing.toISOString()}`,
                                details: "Submission timestamp exceeds official tender cutoff."
                            }
                        ],
                        detector: "MetadataAnomalyDetector",
                        recommendation: "Verify whether a formal deadline extension was granted by the procurement authority."
                    });
                }

                // Check 2: Certificate issued after tender closing date
                if (doc.issuedDate && doc.issuedDate > closing) {
                    indicators.push({
                        type: "SUSPICIOUS_DATE",
                        severity: "CRITICAL",
                        title: "Document Issue Date Post-Dates Tender Closing",
                        description: `Document "${doc.filename || doc.documentId}" has an issue date of ${doc.issuedDate.toISOString().split("T")[0]}, which is AFTER the tender closing date (${closing.toISOString().split("T")[0]}). A valid submission cannot contain certificates issued post-closing.`,
                        evidence: [doc.documentId],
                        structuredEvidence: [
                            {
                                documentId: doc.documentId,
                                field: "issuedDate",
                                value: doc.issuedDate.toISOString().split("T")[0],
                                expectedValue: `<= ${closing.toISOString().split("T")[0]}`,
                                details: "Chronologically invalid certificate issuance date."
                            }
                        ],
                        detector: "MetadataAnomalyDetector",
                        recommendation: "Inspect the physical certificate seal and issuance authority to verify document authenticity."
                    });
                }

                // Check 3: Certificate expired before tender closing date
                if (doc.expiryDate && doc.expiryDate < closing) {
                    indicators.push({
                        type: "SUSPICIOUS_DATE",
                        severity: "HIGH",
                        title: "Expired Certificate Submitted",
                        description: `Document "${doc.filename || doc.documentId}" expired on ${doc.expiryDate.toISOString().split("T")[0]}, prior to the tender closing date (${closing.toISOString().split("T")[0]}).`,
                        evidence: [doc.documentId],
                        structuredEvidence: [
                            {
                                documentId: doc.documentId,
                                field: "expiryDate",
                                value: doc.expiryDate.toISOString().split("T")[0],
                                expectedValue: `>= ${closing.toISOString().split("T")[0]}`,
                                details: "Certificate expired before bid deadline."
                            }
                        ],
                        detector: "MetadataAnomalyDetector",
                        recommendation: "Request an active, renewed certificate or verify compliance validity criteria."
                    });
                }

                // Check 4: Issue date precedes bidder incorporation/registration date
                if (doc.issuedDate && doc.registrationDate && doc.issuedDate < doc.registrationDate) {
                    indicators.push({
                        type: "SUSPICIOUS_DATE",
                        severity: "HIGH",
                        title: "Document Issue Date Precedes Bidder Registration",
                        description: `Document "${doc.filename || doc.documentId}" claims issue date ${doc.issuedDate.toISOString().split("T")[0]}, which precedes the bidder's incorporation date (${doc.registrationDate.toISOString().split("T")[0]}).`,
                        evidence: [doc.documentId],
                        structuredEvidence: [
                            {
                                documentId: doc.documentId,
                                field: "issuedDate",
                                value: doc.issuedDate.toISOString().split("T")[0],
                                expectedValue: `>= ${doc.registrationDate.toISOString().split("T")[0]}`,
                                details: "Anachronistic issuance before legal company existence."
                            }
                        ],
                        detector: "MetadataAnomalyDetector",
                        recommendation: "Verify whether document was issued to a predecessor entity or is fabricated."
                    });
                }
            }
        }

        // --- Check 5: Bulk simultaneous upload (Weak signal) ---
        const timestampGroups = new Map<string, string[]>();
        for (const doc of input.documents) {
            const key = Math.floor(doc.uploadTimestamp.getTime() / 1000).toString();
            if (!timestampGroups.has(key)) timestampGroups.set(key, []);
            timestampGroups.get(key)!.push(doc.documentId);
        }

        for (const [, docIds] of timestampGroups) {
            if (docIds.length >= 4) {
                indicators.push({
                    type: "METADATA_ANOMALY",
                    severity: "LOW",
                    title: "Automated Batch Upload Signature",
                    description: `${docIds.length} documents were uploaded at the exact same second. This is an automated batch pattern (weak indicator).`,
                    evidence: docIds,
                    detector: "MetadataAnomalyDetector",
                    recommendation: "Informational note: Automated upload detected; no standalone fraud action required unless corroborated."
                });
            }
        }

        return indicators;
    }
}

