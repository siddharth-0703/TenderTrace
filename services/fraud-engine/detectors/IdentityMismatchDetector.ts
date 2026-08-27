import { FraudIndicator } from "./FraudIndicator";

/**
 * Levenshtein distance — pure TS, no external dependency.
 * Used to detect minor name variations (typos, abbreviations).
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
 * - strips common legal suffixes (pvt ltd, limited, llp, etc.)
 * - collapses whitespace
 */
function normaliseName(name: string): string {
    return name
        .toLowerCase()
        .replace(/\b(pvt|private|ltd|limited|llp|inc|incorporated|co|corp|corporation)\b/g, "")
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

export interface BidderDoc {
    documentId: string;
    entityName: string; // value from Evidence record of type ENTITY_NAME / LEGAL_NAME
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
 * extracted from each document. Flags a mismatch when the normalised
 * Levenshtein distance exceeds the threshold OR when names differ
 * significantly after normalisation.
 *
 * Severity:
 *   - distance > 10  → HIGH
 *   - distance 4–10  → MEDIUM
 *   - distance 1–3   → LOW  (minor typo/abbreviation, still flagged)
 */
const MISMATCH_THRESHOLD = 1; // flag anything with distance > 0 after normalisation

export class IdentityMismatchDetector {
    detect(input: IdentityMismatchInput): FraudIndicator[] {
        const indicators: FraudIndicator[] = [];
        const normRegistered = normaliseName(input.registeredName);

        for (const doc of input.documentNames) {
            const normDoc = normaliseName(doc.entityName);

            // Skip if identical after normalisation
            if (normRegistered === normDoc) continue;

            const dist = levenshtein(normRegistered, normDoc);

            if (dist > MISMATCH_THRESHOLD) {
                let severity: FraudIndicator["severity"];
                if (dist > 10) {
                    severity = "HIGH";
                } else if (dist > 3) {
                    severity = "MEDIUM";
                } else {
                    severity = "LOW";
                }

                indicators.push({
                    type: "IDENTITY_MISMATCH",
                    severity,
                    description: `Entity name in document "${doc.documentId}" is "${doc.entityName}" but registered name is "${input.registeredName}" (edit distance: ${dist}).`,
                    evidence: [doc.documentId]
                });
            }
        }

        return indicators;
    }
}
