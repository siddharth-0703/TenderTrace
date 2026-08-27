import { FraudIndicator } from "./FraudIndicator";

export interface DocumentRecord {
    documentId: string;
    bidId: string;
    hash: string;
}

export interface DuplicationInput {
    /** The bid being analysed */
    currentBidId: string;
    /** All documents across ALL bids for this tender (fetched by engine) */
    allTenderDocuments: DocumentRecord[];
}

/**
 * DOCUMENT_DUPLICATION detector
 *
 * Checks whether any document uploaded by this bid shares an identical
 * SHA-256 hash with a document from a DIFFERENT bid in the same tender.
 * This is the canonical signal for bid collusion or recycled documents.
 *
 * Severity: CRITICAL — identical hash across bidders is unambiguous.
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

                indicators.push({
                    type: "DOCUMENT_DUPLICATION",
                    severity: "CRITICAL",
                    description: `Document "${doc.documentId}" (hash: ${doc.hash}) is identical to document(s) [${duplicateDocIds.join(", ")}] submitted by bid(s) [${duplicateBidIds.join(", ")}]. Possible collusion or recycled document.`,
                    evidence: [doc.documentId, ...duplicateDocIds]
                });
            }
        }

        return indicators;
    }
}
