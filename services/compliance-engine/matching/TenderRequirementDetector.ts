import { TenderTextPage } from "../text/TenderTextLoader";
import { Normalizer } from "../normalization/Normalizer";

export interface RequirementCandidate {
    candidateId: string;
    type: string;
    field: string;
    operator: string;
    value?: string | number;
    currency?: string;
    sourceText: string;
    documentId: string;
    pageNumber: number;
    section?: string;
    heuristicConfidence: number;
}

export class TenderRequirementDetector {
    private static MANDATORY_KEYWORDS = [
        "must", "shall", "required", "mandatory", "minimum", "at least",
        "eligible", "eligibility", "bidder is required to", "bidder should"
    ];

    private static FIELD_KEYWORDS: Record<string, string[]> = {
        TURNOVER: ["turnover", "average annual turnover", "financial turnover", "sales turnover"],
        EXPERIENCE: ["experience", "similar contracts", "similar projects", "past experience"],
        GST: ["gst", "gstin", "gst registration", "goods and services tax"],
        PAN: ["pan", "permanent account number"],
        UDYAM: ["udyam", "msme"],
        MSME: ["msme", "micro and small enterprises"],
        EPFO: ["epfo", "provident fund"],
        ESIC: ["esic", "employee state insurance"],
        LOCAL_CONTENT: ["local content", "make in india"],
        EMD: ["emd", "earnest money deposit"],
        SECURITY_DEPOSIT: ["security deposit", "epbg", "performance security"],
        CERTIFICATE: ["certificate", "authorization", "oem authorization"]
    };

    static detectRequirements(pages: TenderTextPage[]): RequirementCandidate[] {
        const candidates: RequirementCandidate[] = [];
        let candidateIdCounter = 1;

        for (const page of pages) {
            // Split text into sentences or chunks for analysis
            const sentences = page.text.split(/[\.\n]/).map(s => s.trim()).filter(s => s.length > 10);

            for (const sentence of sentences) {
                const lowerSentence = sentence.toLowerCase();
                
                // Check for mandatory language
                const hasMandatoryKeyword = this.MANDATORY_KEYWORDS.some(kw => lowerSentence.includes(kw));
                
                let detectedType = "OTHER";
                let detectedField = "OTHER";
                let matchedFieldKeyword = false;

                for (const [fieldType, keywords] of Object.entries(this.FIELD_KEYWORDS)) {
                    if (keywords.some(kw => lowerSentence.includes(kw))) {
                        detectedType = fieldType;
                        detectedField = fieldType;
                        matchedFieldKeyword = true;
                        break;
                    }
                }

                // Require both mandatory language AND a recognized field for a strong heuristic match
                if (hasMandatoryKeyword && matchedFieldKeyword) {
                    const normalized = Normalizer.normalizeNumeric(sentence);
                    
                    let operator = "==";
                    if (lowerSentence.includes("minimum") || lowerSentence.includes("at least") || lowerSentence.includes("more than")) {
                        operator = ">=";
                    }

                    candidates.push({
                        candidateId: `REQ-CAND-${Date.now()}-${candidateIdCounter++}`,
                        type: detectedType,
                        field: detectedField,
                        operator,
                        value: normalized ? normalized.amount : undefined,
                        currency: normalized ? normalized.currency : undefined,
                        sourceText: sentence,
                        documentId: page.documentId,
                        pageNumber: page.pageNumber,
                        heuristicConfidence: 0.8
                    });
                }
            }
        }

        return candidates;
    }
}
