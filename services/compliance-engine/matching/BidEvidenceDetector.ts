import { BidTextPage } from "../text/BidTextLoader";
import { Normalizer } from "../normalization/Normalizer";

export interface EvidenceCandidate {
    evidenceId: string;
    type: string;
    field: string;
    value?: string | number;
    numericValue?: number;
    currency?: string;
    sourceText: string;
    documentId: string;
    pageNumber: number;
    section?: string;
}

export class BidEvidenceDetector {
    private static EVIDENCE_PATTERNS: Record<string, { regex: RegExp, field: string }> = {
        GST: { regex: /\b(GSTIN|GST Registration)[:\s]+([0-9A-Z]{15})\b/i, field: "GST" },
        PAN: { regex: /\b(PAN)[:\s]+([A-Z]{5}[0-9]{4}[A-Z]{1})\b/i, field: "PAN" },
        UDYAM: { regex: /\b(UDYAM Registration No|UDYAM)[:\s]+(UDYAM-[A-Z]{2}-\d{2}-\d{7})\b/i, field: "UDYAM" },
        TURNOVER: { regex: /\b(turnover|annual turnover|average annual turnover|financial turnover)[:\s]+(.*?)(?=\n|$)/i, field: "TURNOVER" },
        EXPERIENCE: { regex: /\b(experience|similar projects|similar contracts)[:\s]+(.*?)(?=\n|$)/i, field: "EXPERIENCE" }
    };

    static detectEvidence(pages: BidTextPage[]): EvidenceCandidate[] {
        const candidates: EvidenceCandidate[] = [];
        let evidenceIdCounter = 1;

        for (const page of pages) {
            const sentences = page.text.split(/[\.\n]/).map(s => s.trim()).filter(s => s.length > 5);

            for (const sentence of sentences) {
                for (const [type, pattern] of Object.entries(this.EVIDENCE_PATTERNS)) {
                    const match = sentence.match(pattern.regex);
                    if (match) {
                        const extractedValueStr = match[2]?.trim();
                        let numericValue: number | undefined = undefined;
                        let currency: string | undefined = undefined;

                        // Only normalize numeric for fields that expect numbers
                        if (type === "TURNOVER" || type === "EXPERIENCE") {
                            const normalized = Normalizer.normalizeNumeric(extractedValueStr);
                            if (normalized) {
                                numericValue = normalized.amount;
                                currency = normalized.currency;
                            }
                        }

                        candidates.push({
                            evidenceId: `EVD-CAND-${Date.now()}-${evidenceIdCounter++}`,
                            type: type,
                            field: pattern.field,
                            value: extractedValueStr,
                            numericValue: numericValue,
                            currency: currency,
                            sourceText: sentence,
                            documentId: page.documentId,
                            pageNumber: page.pageNumber
                        });
                    }
                }
            }
        }

        return candidates;
    }
}
