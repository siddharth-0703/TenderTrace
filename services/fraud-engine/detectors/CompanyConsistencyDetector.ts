import { FraudIndicator, StructuredEvidenceItem } from "./FraudIndicator";

export interface ExtractedEntityDoc {
    documentId: string;
    documentType?: string; // e.g. "GST_CERTIFICATE", "PAN_CARD", "UDYAM_CERTIFICATE", "INCORPORATION_CERT"
    companyName?: string;
    pan?: string;
    gstin?: string;
    udyamNumber?: string;
    address?: string;
}

export interface CompanyConsistencyInput {
    bidId: string;
    registeredLegalName: string;
    registeredAddress?: string;
    registeredPan?: string;
    registeredGstin?: string;
    documents: ExtractedEntityDoc[];
}

/**
 * Normalizes company names to detect genuine identity discrepancies
 * while ignoring harmless legal suffix variations, capitalization, and punctuation.
 */
export function normalizeCompanyName(name: string): string {
    if (!name) return "";
    return name
        .toLowerCase()
        // Replace punctuation and symbols with space
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()\[\]"']/g, " ")
        // Normalize legal entity words
        .replace(/\b(private\s+limited|pvt\s+ltd|pvt\s+limited|private\s+ltd|p\s+ltd)\b/g, "")
        .replace(/\b(limited|ltd|llp|inc|incorporated|corporation|corp|co)\b/g, "")
        .replace(/\b(proprietorship|enterprises|enterprise|technologies|technology|tech|solutions|services|systems|works)\b/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Calculate Levenshtein distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
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
 * Normalizes address for token overlap comparison
 */
export function normalizeAddress(addr: string): Set<string> {
    if (!addr) return new Set();
    const clean = addr.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
    // Filter out common stopwords
    const stopwords = new Set(["road", "rd", "street", "st", "lane", "floor", "plot", "no", "near", "opp", "opposite", "nagar", "city", "state", "india", "dist", "district"]);
    const tokens = clean.split(" ").filter(t => t.length > 2 && !stopwords.has(t));
    return new Set(tokens);
}

/**
 * Jaccard similarity for address token sets
 */
export function addressTokenSimilarity(setA: Set<string>, setB: Set<string>): number {
    if (setA.size === 0 || setB.size === 0) return 1.0; // If one is missing, don't penalize as hard conflict
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return intersection.size / union.size;
}

export class CompanyConsistencyDetector {
    detect(input: CompanyConsistencyInput): FraudIndicator[] {
        const indicators: FraudIndicator[] = [];
        const normRegisteredName = normalizeCompanyName(input.registeredLegalName);

        // 1. Cross-Document Company Name Consistency vs Registered Name
        for (const doc of input.documents) {
            if (!doc.companyName) continue;
            const normDocName = normalizeCompanyName(doc.companyName);

            // Skip if normalized names are identical or one contains the other cleanly
            if (normRegisteredName === normDocName || (normRegisteredName.length > 3 && normDocName.includes(normRegisteredName)) || (normDocName.length > 3 && normRegisteredName.includes(normDocName))) {
                continue;
            }

            const dist = levenshteinDistance(normRegisteredName, normDocName);
            const maxLen = Math.max(normRegisteredName.length, normDocName.length, 1);
            const similarity = 1 - (dist / maxLen);

            // If similarity is very high (> 0.85), it's likely a minor typo or harmless variation
            if (similarity < 0.70 && dist > 3) {
                const structured: StructuredEvidenceItem[] = [
                    {
                        documentId: doc.documentId,
                        field: "company_name",
                        value: doc.companyName,
                        expectedValue: input.registeredLegalName,
                        details: `Normalized distance: ${dist} (similarity ${(similarity * 100).toFixed(0)}%)`
                    }
                ];

                indicators.push({
                    type: "COMPANY_INCONSISTENCY",
                    severity: dist > 8 ? "HIGH" : "MEDIUM",
                    title: "Company Name Inconsistency with Registration",
                    description: `Company name in document "${doc.documentId}" (${doc.documentType || "Document"}) is "${doc.companyName}", differing from registered bidder name "${input.registeredLegalName}".`,
                    evidence: [doc.documentId],
                    structuredEvidence: structured,
                    detector: "CompanyConsistencyDetector",
                    recommendation: "Verify legal entity registration on MCA21 / GeM portal to ensure no shell or mismatched entity is represented."
                });
            }
        }

        // 2. Cross-Document Pairwise Name Consistency (e.g. GST vs Udyam, GST vs PAN)
        const nameDocs = input.documents.filter(d => !!d.companyName);
        for (let i = 0; i < nameDocs.length; i++) {
            for (let j = i + 1; j < nameDocs.length; j++) {
                const docA = nameDocs[i];
                const docB = nameDocs[j];
                const normA = normalizeCompanyName(docA.companyName!);
                const normB = normalizeCompanyName(docB.companyName!);

                if (normA === normB) continue;

                const dist = levenshteinDistance(normA, normB);
                const maxLen = Math.max(normA.length, normB.length, 1);
                const similarity = 1 - (dist / maxLen);

                if (similarity < 0.70 && dist > 3) {
                    // Check if we haven't already reported these exact two documents
                    const alreadyFlagged = indicators.some(ind =>
                        ind.evidence.includes(docA.documentId) && ind.evidence.includes(docB.documentId)
                    );
                    if (!alreadyFlagged) {
                        indicators.push({
                            type: "COMPANY_INCONSISTENCY",
                            severity: "HIGH",
                            title: "Discrepancy Between Submitted Statutory Documents",
                            description: `Document "${docA.documentId}" (${docA.documentType || "Doc 1"}) states "${docA.companyName}", but Document "${docB.documentId}" (${docB.documentType || "Doc 2"}) states "${docB.companyName}".`,
                            evidence: [docA.documentId, docB.documentId],
                            structuredEvidence: [
                                {
                                    documentId: docA.documentId,
                                    field: "company_name",
                                    value: docA.companyName,
                                    expectedValue: docB.companyName,
                                    details: `Discrepancy between ${docA.documentType || "Doc A"} and ${docB.documentType || "Doc B"}`
                                },
                                {
                                    documentId: docB.documentId,
                                    field: "company_name",
                                    value: docB.companyName,
                                    expectedValue: docA.companyName
                                }
                            ],
                            detector: "CompanyConsistencyDetector",
                            recommendation: "Cross-examine statutory filings to confirm if multiple distinct entities are sharing credentials."
                        });
                    }
                }
            }
        }

        // 3. Statutory Identifier Consistency (GSTIN contains PAN)
        // Indian GSTIN format: 2-digit state code + 10-digit PAN + 1 entity num + 1 'Z' + 1 checksum
        const allGstins = input.documents.map(d => ({ docId: d.documentId, gstin: d.gstin?.trim().toUpperCase() })).filter(d => !!d.gstin);
        const allPans = input.documents.map(d => ({ docId: d.documentId, pan: d.pan?.trim().toUpperCase() })).filter(d => !!d.pan);

        for (const g of allGstins) {
            const gstinStr = g.gstin!;
            if (gstinStr.length === 15) {
                const embeddedPan = gstinStr.substring(2, 12);

                // Check vs submitted PANs
                for (const p of allPans) {
                    if (p.pan && p.pan.length === 10 && p.pan !== embeddedPan) {
                        indicators.push({
                            type: "COMPANY_INCONSISTENCY",
                            severity: "CRITICAL",
                            title: "GSTIN and PAN Mismatch Conflict",
                            description: `GSTIN "${gstinStr}" in document "${g.docId}" embeds PAN "${embeddedPan}", which does NOT match submitted PAN "${p.pan}" in document "${p.docId}".`,
                            evidence: [g.docId, p.docId],
                            structuredEvidence: [
                                {
                                    documentId: g.docId,
                                    field: "gstin_embedded_pan",
                                    value: embeddedPan,
                                    expectedValue: p.pan,
                                    details: `Derived from GSTIN ${gstinStr}`
                                },
                                {
                                    documentId: p.docId,
                                    field: "pan",
                                    value: p.pan,
                                    expectedValue: embeddedPan
                                }
                            ],
                            detector: "CompanyConsistencyDetector",
                            recommendation: "Investigate whether GSTIN or PAN certificate belongs to an unauthorized third-party entity."
                        });
                    }
                }

                // Check vs registered PAN if available
                if (input.registeredPan && input.registeredPan.trim().toUpperCase() !== embeddedPan) {
                    indicators.push({
                        type: "COMPANY_INCONSISTENCY",
                        severity: "HIGH",
                        title: "Submitted GSTIN Conflicts with Registered PAN",
                        description: `Submitted GSTIN "${gstinStr}" embeds PAN "${embeddedPan}", which differs from bidder registered PAN "${input.registeredPan}".`,
                        evidence: [g.docId],
                        structuredEvidence: [
                            {
                                documentId: g.docId,
                                field: "gstin_embedded_pan",
                                value: embeddedPan,
                                expectedValue: input.registeredPan
                            }
                        ],
                        detector: "CompanyConsistencyDetector",
                        recommendation: "Verify company tax registration credentials with the bidder profile."
                    });
                }
            }
        }

        // 4. Address Inconsistency Check
        const addressDocs = input.documents.filter(d => !!d.address);
        if (input.registeredAddress) {
            const regAddrTokens = normalizeAddress(input.registeredAddress);
            for (const doc of addressDocs) {
                const docAddrTokens = normalizeAddress(doc.address!);
                if (regAddrTokens.size > 2 && docAddrTokens.size > 2) {
                    const sim = addressTokenSimilarity(regAddrTokens, docAddrTokens);
                    if (sim < 0.15) { // very low overlap in distinct address tokens
                        indicators.push({
                            type: "COMPANY_INCONSISTENCY",
                            severity: "MEDIUM",
                            title: "Operational Address Discrepancy",
                            description: `Address in document "${doc.documentId}" ("${doc.address}") significantly diverges from registered business address ("${input.registeredAddress}").`,
                            evidence: [doc.documentId],
                            structuredEvidence: [
                                {
                                    documentId: doc.documentId,
                                    field: "address",
                                    value: doc.address,
                                    expectedValue: input.registeredAddress,
                                    details: `Token overlap similarity: ${(sim * 100).toFixed(0)}%`
                                }
                            ],
                            detector: "CompanyConsistencyDetector",
                            recommendation: "Verify if bidder operates from a branch office, subsidiary, or if the document originates from an unrelated location."
                        });
                    }
                }
            }
        }

        return indicators;
    }
}
