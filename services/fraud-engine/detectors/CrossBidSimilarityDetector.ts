import { FraudIndicator, IndicatorSeverity, StructuredEvidenceItem } from "./FraudIndicator";

export interface CrossBidDocRecord {
    documentId: string;
    bidId: string;
    bidderId: string;
    bidderName: string;
    filename: string;
    fileType: string;
    fileSize: number;
    hash: string;
    extractedText?: string | null;
    docCategory?: string; // "OEM_AUTHORIZATION", "FINANCIAL_STATEMENT", "TECHNICAL_PROPOSAL", "GST_CERTIFICATE", etc.
}

export interface CrossBidSimilarityInput {
    currentBidId: string;
    currentBidderName: string;
    tenderId: string;
    allTenderDocuments: CrossBidDocRecord[];
}

/**
 * Computes 3-gram Jaccard similarity for textual content comparison
 */
function textNgramSimilarity(textA: string, textB: string): number {
    if (!textA || !textB) return 0;
    const cleanA = textA.toLowerCase().replace(/\s+/g, " ").trim();
    const cleanB = textB.toLowerCase().replace(/\s+/g, " ").trim();

    if (cleanA.length < 50 || cleanB.length < 50) return 0;

    const getNgrams = (str: string, n = 3): Set<string> => {
        const grams = new Set<string>();
        for (let i = 0; i <= str.length - n; i++) {
            grams.add(str.substring(i, i + n));
        }
        return grams;
    };

    const ngramsA = getNgrams(cleanA, 3);
    const ngramsB = getNgrams(cleanB, 3);

    let intersection = 0;
    for (const g of ngramsA) {
        if (ngramsB.has(g)) intersection++;
    }

    const union = ngramsA.size + ngramsB.size - intersection;
    return union === 0 ? 0 : intersection / union;
}

export class CrossBidSimilarityDetector {
    detect(input: CrossBidSimilarityInput): FraudIndicator[] {
        const indicators: FraudIndicator[] = [];

        const currentBidDocs = input.allTenderDocuments.filter(
            d => d.bidId === input.currentBidId
        );
        const otherBidDocs = input.allTenderDocuments.filter(
            d => d.bidId !== input.currentBidId
        );

        for (const doc of currentBidDocs) {
            // Check cross-bid text content similarity (if extracted text is available)
            if (doc.extractedText && doc.extractedText.length > 80) {
                for (const otherDoc of otherBidDocs) {
                    if (otherDoc.extractedText && otherDoc.extractedText.length > 80) {
                        // Skip if already exact duplicate hash (handled by duplication detector)
                        if (otherDoc.hash === doc.hash) continue;

                        const similarity = textNgramSimilarity(doc.extractedText, otherDoc.extractedText);

                        if (similarity > 0.85) {
                            const isOem = doc.filename.toLowerCase().includes("oem") || otherDoc.filename.toLowerCase().includes("oem");
                            const severity: IndicatorSeverity = isOem ? "LOW" : "HIGH";

                            indicators.push({
                                type: "CROSS_BID_SIMILARITY",
                                severity,
                                title: isOem ? "Shared OEM Technical Documentation" : "Substantial Textual Content Overlap Across Bidders",
                                description: `Document "${doc.filename}" shares ${(similarity * 100).toFixed(0)}% textual similarity with "${otherDoc.filename}" submitted by competing bidder "${otherDoc.bidderName}".`,
                                evidence: [doc.documentId, otherDoc.documentId],
                                structuredEvidence: [
                                    {
                                        documentId: doc.documentId,
                                        field: "text_content",
                                        value: doc.filename,
                                        matchedBidId: otherDoc.bidId,
                                        matchedDocId: otherDoc.documentId,
                                        score: Math.round(similarity * 100),
                                        details: `Matched with bidder "${otherDoc.bidderName}"`
                                    }
                                ],
                                detector: "CrossBidSimilarityDetector",
                                recommendation: isOem
                                    ? "Verify if multiple authorized channel partners are referencing standard manufacturer boilerplate."
                                    : "Investigate possible collaborative proposal drafting or bid templating between competing bidders."
                            });
                        }
                    }
                }
            }
        }

        return indicators;
    }
}
