import { FraudIndicator, IndicatorSeverity, StructuredEvidenceItem } from "./FraudIndicator";

/**
 * Levenshtein distance — pure TS, no external dependency.
 */
function levenshtein(a: string, b: string): number {
    const m = a.length;
    const n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
        Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (a[i - 1] === b[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
            }
        }
    }
    return dp[m][n];
}

/**
 * Normalises an entity name for comparison:
 * - lowercase
 * - strips punctuation & common legal suffixes
 * - collapses whitespace
 */
export function normaliseEntityName(name: string): string {
    if (!name) return "";
    return name
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()\[\]"']/g, " ")
        .replace(/\b(private\s+limited|pvt\s+ltd|pvt\s+limited|private\s+ltd|p\s+ltd)\b/g, "")
        .replace(/\b(pvt|private|ltd|limited|llp|inc|incorporated|co|corp|corporation)\b/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

export interface BidderDoc {
    documentId: string;
    entityName: string; // value from Evidence record of type ENTITY_NAME / LEGAL_NAME
    documentType?: string;
}

export interface IdentityMismatchInput {
    bidId: string;
    registeredName: string;        // Bidder.legalName from DB
    documentNames: BidderDoc[];    // names extracted from documents
}

/**
 * IDENTITY_MISMATCH detector
 *
 * Compares the bidder's registered legal name against entity names
 * extracted from each document.
 */
const MISMATCH_THRESHOLD = 1;

export class IdentityMismatchDetector {
    detect(input: IdentityMismatchInput): FraudIndicator[] {
        const indicators: FraudIndicator[] = [];
        const normRegistered = normaliseEntityName(input.registeredName);

        for (const doc of input.documentNames) {
            const normDoc = normaliseEntityName(doc.entityName);

            // Skip if identical after normalisation
            if (normRegistered === normDoc) continue;

            const dist = levenshtein(normRegistered, normDoc);

            if (dist > MISMATCH_THRESHOLD) {
                let severity: IndicatorSeverity;
                if (dist > 10) {
                    severity = "HIGH";
                } else if (dist > 3) {
                    severity = "MEDIUM";
                } else {
                    severity = "LOW";
                }

                const structured: StructuredEvidenceItem[] = [
                    {
                        documentId: doc.documentId,
                        field: "entity_name",
                        value: doc.entityName,
                        expectedValue: input.registeredName,
                        details: `Edit distance: ${dist}`
                    }
                ];

                indicators.push({
                    type: "IDENTITY_MISMATCH",
                    severity,
                    title: "Bidder Legal Identity Mismatch",
                    description: `Entity name in document "${doc.documentId}" is "${doc.entityName}" but registered name is "${input.registeredName}" (edit distance: ${dist}).`,
                    evidence: [doc.documentId],
                    structuredEvidence: structured,
                    detector: "IdentityMismatchDetector",
                    recommendation: "Cross-verify bidder identity with official MCA/GeM company master database."
                });
            }
        }

        return indicators;
    }
}

