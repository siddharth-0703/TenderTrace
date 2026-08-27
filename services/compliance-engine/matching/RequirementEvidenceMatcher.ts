import { TenderRequirement, Evidence } from "@prisma/client";
import { getCanonicalField } from "./fieldAliases";

export interface MatchResult {
    requirementId: string;
    evidenceId: string;
    matchScore: number;
    matchReasons: string[];
    matchingTrace: any;
}

export class RequirementEvidenceMatcher {
    private static MATCH_THRESHOLD = 0.70;

    static match(requirements: TenderRequirement[], evidenceList: Evidence[]): MatchResult[] {
        const matches: MatchResult[] = [];

        for (const req of requirements) {
            for (const ev of evidenceList) {
                const matchScoreData = this.calculateMatchScore(req, ev);
                
                if (matchScoreData.score >= this.MATCH_THRESHOLD) {
                    matches.push({
                        requirementId: req.id,
                        evidenceId: ev.id,
                        matchScore: matchScoreData.score,
                        matchReasons: matchScoreData.reasons,
                        matchingTrace: {
                            requirementSource: {
                                type: req.type,
                                // Assuming rules are stored in a Json field that includes the field name
                                field: (req.rules as any)?.field || req.type
                            },
                            evidenceSource: {
                                documentId: ev.documentId,
                                pageNumber: ev.page,
                                type: ev.type,
                                sourceText: ev.sourceText
                            }
                        }
                    });
                }
            }
        }

        return matches;
    }

    private static calculateMatchScore(req: TenderRequirement, ev: Evidence): { score: number, reasons: string[] } {
        let score = 0;
        const reasons: string[] = [];

        // Try to get canonical field for requirement
        let reqField = req.type;
        if (req.rules && typeof req.rules === 'object' && (req.rules as any).field) {
            reqField = (req.rules as any).field;
        }
        const canonicalReqField = getCanonicalField(reqField);
        const canonicalEvField = getCanonicalField(ev.type);

        // Layer 1: Exact Field Match
        if (canonicalReqField === canonicalEvField) {
            score += 0.60;
            reasons.push(`Exact field match: ${canonicalReqField}`);
        } else {
            // Layer 2: Alias/Semantic Field Match
            // Note: getCanonicalField already normalizes aliases, so if they didn't match canonical above, they aren't aliases.
            // But if we want a fuzzy match (e.g. checking source text for keywords), we do it here.
            if (ev.sourceText?.toLowerCase().includes(reqField.toLowerCase()) && reqField.length > 3) {
                score += 0.20;
                reasons.push(`Source text keyword match for requirement type: ${reqField}`);
            }
        }

        // Layer 3: Context / Type compatibility
        const reqIsNumeric = (req.rules as any)?.operator && [">=", "<=", ">", "<"].includes((req.rules as any)?.operator);
        if (reqIsNumeric) {
            if (ev.numericValue !== null && ev.numericValue !== undefined) {
                score += 0.10;
                reasons.push("Valid numeric evidence detected");
            } else {
                // Penalize if it should be numeric but isn't
                score -= 0.30;
                reasons.push("Missing numeric value for numeric requirement");
            }
        } else {
            // For non-numeric requirements (like GST, PAN), if evidence has a value, give it the correct value type bonus
            if (ev.value && ev.value.toString().trim() !== "") {
                score += 0.10;
                reasons.push("Correct value type (string/boolean) provided");
            }
        }

        // Strong evidence pattern
        if (ev.extractionMethod === "HEURISTIC" || ev.extractionMethod === "TEST") {
            // Heuristic detection uses precise regexes (e.g., GSTIN pattern)
            score += 0.10;
            reasons.push("Strong evidence pattern (Regex Match)");
        }

        // False match protection
        if (canonicalReqField === "TURNOVER" && ev.sourceText?.toLowerCase().match(/project cost|contract value|order value|bid value/)) {
            score -= 0.80; // strong penalty
            reasons.push("False match protection: Evidence relates to project cost, not turnover");
        }

        if (canonicalReqField === "GST" && ev.sourceText?.toLowerCase().includes("requires gst")) {
            score -= 0.80;
            reasons.push("False match protection: Evidence is a requirement statement, not actual bidder GSTIN");
        }

        return {
            score: Math.min(Math.max(score, 0), 1.0),
            reasons
        };
    }
}
