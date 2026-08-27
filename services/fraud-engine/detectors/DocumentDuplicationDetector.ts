import { FraudIndicator, IndicatorSeverity, StructuredEvidenceItem } from "./FraudIndicator";

export interface DocumentRecord {
    documentId: string;
    bidId: string;
    bidderId?: string;
    bidderName?: string;
    filename?: string;
    hash: string;
}

export interface DuplicationInput {
    /** The bid being analysed */
    currentBidId: string;
    currentBidderName?: string;
    /** All documents across ALL bids for this tender (fetched by engine) */
    allTenderDocuments: DocumentRecord[];
}

/**
 * DOCUMENT_DUPLICATION detector
 *
 * Checks whether any document uploaded by this bid shares an identical
 * SHA-256 hash with a document from a DIFFERENT bid in the same tender.
 *
 * Distinguishes between:
 * - Common OEM authorization letters (re-sellers legitimately representing same manufacturer) -> MEDIUM/LOW severity with clear nuance
 * - Proprietary bidder documents (GST, Financials, Declarations, Technical bids) -> CRITICAL severity collusion indicator
 */
export class DocumentDuplicationDetector {
    detect(input: DuplicationInput): FraudIndicator[] {
        const indicators: FraudIndicator[] = [];

        // Documents belonging to the current bid
        const currentBidDocs = input.allTenderDocuments.filter(
            d => d.bidId === input.currentBidId
        );

        // Documents from OTHER bids
        const otherBidDocs = input.allTenderDocuments.filter(
            d => d.bidId !== input.currentBidId
        );

        for (const doc of currentBidDocs) {
            const duplicates = otherBidDocs.filter(o => o.hash === doc.hash);

            if (duplicates.length > 0) {
                const duplicateBidIds = [...new Set(duplicates.map(d => d.bidId))];
                const duplicateDocIds = duplicates.map(d => d.documentId);
                const duplicateBidderNames = [...new Set(duplicates.map(d => d.bidderName || d.bidId))];

                const isOem = (doc.filename || "").toLowerCase().includes("oem") ||
                              (doc.filename || "").toLowerCase().includes("auth") ||
                              duplicates.some(d => (d.filename || "").toLowerCase().includes("oem"));

                const severity: IndicatorSeverity = isOem ? "MEDIUM" : "CRITICAL";

                const structured: StructuredEvidenceItem[] = duplicates.map(dup => ({
                    documentId: doc.documentId,
                    field: "sha256_hash",
                    value: doc.hash,
                    matchedBidId: dup.bidId,
                    matchedDocId: dup.documentId,
                    details: `Identical binary file submitted by bidder "${dup.bidderName || dup.bidId}" (file: ${dup.filename || dup.documentId})`
                }));

                const description = isOem
                    ? `OEM authorization document "${doc.filename || doc.documentId}" (SHA-256: ${doc.hash.substring(0, 16)}...) is identical to document(s) submitted by competing bidder(s) [${duplicateBidderNames.join(", ")}]. While legitimate resellers may share OEM certs, cross-bid submission requires verification.`
                    : `Proprietary document "${doc.filename || doc.documentId}" (SHA-256: ${doc.hash.substring(0, 16)}...) is identical to document(s) [${duplicateDocIds.join(", ")}] submitted by competing bidder(s) [${duplicateBidderNames.join(", ")}]. Direct indicator of collusion or recycled bid files.`;

                indicators.push({
                    type: "DOCUMENT_DUPLICATION",
                    severity,
                    title: isOem ? "Shared OEM Authorization Document Detected" : "Identical Cross-Bid Document Collision Detected",
                    description,
                    evidence: [doc.documentId, ...duplicateDocIds],
                    structuredEvidence: structured,
                    detector: "DocumentDuplicationDetector",
                    recommendation: isOem
                        ? "Verify whether both bidders are authorized by the same OEM, and check for bid independence in commercial terms."
                        : "Conduct immediate forensic review to confirm if the competing bidders share common preparation, owners, or coordinators."
                });
            }
        }

        return indicators;
    }
}

