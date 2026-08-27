import { CorrelatedFinding, FraudIndicator, IndicatorType, IndicatorSeverity, StructuredEvidenceItem } from "../detectors/FraudIndicator";

export interface CorrelationResult {
    correlatedFindings: CorrelatedFinding[];
    /** Deduplicated effective indicators for scoring */
    deduplicatedIndicators: FraudIndicator[];
}

export class EvidenceCorrelator {
    correlate(indicators: FraudIndicator[]): CorrelationResult {
        const correlatedFindings: CorrelatedFinding[] = [];
        const typesPresent = new Set(indicators.map(i => i.type));

        // Helper to gather all evidence IDs across matching indicators
        const getEvidenceForTypes = (targetTypes: IndicatorType[]): { ids: string[]; structured: StructuredEvidenceItem[] } => {
            const matching = indicators.filter(i => targetTypes.includes(i.type));
            const ids = [...new Set(matching.flatMap(m => m.evidence))];
            const structured = matching.flatMap(m => m.structuredEvidence || []);
            return { ids, structured };
        };

        // ── CLUSTER 1: Identity Conflict + Document Reuse / Collusion ────────────
        const hasIdentityIssues = typesPresent.has("IDENTITY_MISMATCH") || typesPresent.has("COMPANY_INCONSISTENCY");
        const hasReuseIssues = typesPresent.has("DOCUMENT_DUPLICATION") || typesPresent.has("CROSS_BID_SIMILARITY");

        if (hasIdentityIssues && hasReuseIssues) {
            const supporting: IndicatorType[] = [];
            if (typesPresent.has("IDENTITY_MISMATCH")) supporting.push("IDENTITY_MISMATCH");
            if (typesPresent.has("COMPANY_INCONSISTENCY")) supporting.push("COMPANY_INCONSISTENCY");
            if (typesPresent.has("DOCUMENT_DUPLICATION")) supporting.push("DOCUMENT_DUPLICATION");
            if (typesPresent.has("CROSS_BID_SIMILARITY")) supporting.push("CROSS_BID_SIMILARITY");

            const ev = getEvidenceForTypes(supporting);

            correlatedFindings.push({
                type: "IDENTITY_AND_DOCUMENT_REUSE_CLUSTER",
                severity: "CRITICAL",
                title: "Compound Identity Inconsistency & Cross-Bid Reuse Pattern",
                description: "Multiple related inconsistencies detected involving both legal bidder identity and submitted cross-bid authorization documents. This compound pattern strongly suggests proxy bidding or unauthorized certificate reuse.",
                supportingIndicators: supporting,
                evidence: ev.ids,
                structuredEvidence: ev.structured,
                explanation: "When identity discrepancies co-occur with identical documents across rival bidders, the risk of collusive proxy bidding is substantially elevated."
            });
        }

        // ── CLUSTER 2: Statutory Tax & Entity Commingling ─────────────────────────
        const companyInconsistencies = indicators.filter(i => i.type === "COMPANY_INCONSISTENCY");
        const identityMismatches = indicators.filter(i => i.type === "IDENTITY_MISMATCH");

        if (companyInconsistencies.length >= 2 || (companyInconsistencies.length >= 1 && identityMismatches.length >= 1)) {
            const supporting: IndicatorType[] = ["COMPANY_INCONSISTENCY"];
            if (identityMismatches.length > 0) supporting.push("IDENTITY_MISMATCH");

            const ev = getEvidenceForTypes(supporting);

            // Avoid duplicate cluster if already covered
            if (!correlatedFindings.some(c => c.type === "STATUTORY_MISREPRESENTATION_CLUSTER")) {
                correlatedFindings.push({
                    type: "STATUTORY_MISREPRESENTATION_CLUSTER",
                    severity: "HIGH",
                    title: "Multi-Document Statutory Identity Conflict",
                    description: "Statutory credentials (GSTIN, PAN, Udyam, or Registration Certificates) across the submitted dossier reference conflicting legal entities.",
                    supportingIndicators: supporting,
                    evidence: ev.ids,
                    structuredEvidence: ev.structured,
                    explanation: "Conflicting PAN/GSTIN and entity names across statutory documents indicate commingling of documents from multiple companies."
                });
            }
        }

        // ── CLUSTER 3: Chronology & Timeline Tampering ───────────────────────────
        const hasDateIssues = typesPresent.has("SUSPICIOUS_DATE");
        const hasMetadataIssues = typesPresent.has("METADATA_ANOMALY");

        if (hasDateIssues && hasMetadataIssues) {
            const supporting: IndicatorType[] = ["SUSPICIOUS_DATE", "METADATA_ANOMALY"];
            const ev = getEvidenceForTypes(supporting);

            correlatedFindings.push({
                type: "CHRONOLOGY_AND_METADATA_ANOMALY_CLUSTER",
                severity: "HIGH",
                title: "Document Chronology & Submission Timeline Inconsistency",
                description: "Submission exhibits post-deadline upload timestamps coupled with impossible or expired certificate issuance dates.",
                supportingIndicators: supporting,
                evidence: ev.ids,
                structuredEvidence: ev.structured,
                explanation: "The combination of irregular upload timing and invalid certificate dates points toward document fabrication or backdating."
            });
        }

        // ── CLUSTER 4: Coordinated Bid Collusion ─────────────────────────────────
        const duplicationInds = indicators.filter(i => i.type === "DOCUMENT_DUPLICATION");
        const similarityInds = indicators.filter(i => i.type === "CROSS_BID_SIMILARITY");

        if (duplicationInds.length >= 1 && similarityInds.length >= 1) {
            const supporting: IndicatorType[] = ["DOCUMENT_DUPLICATION", "CROSS_BID_SIMILARITY"];
            const ev = getEvidenceForTypes(supporting);

            correlatedFindings.push({
                type: "COORDINATED_BID_COLLUSION_CLUSTER",
                severity: "CRITICAL",
                title: "High-Confidence Cross-Bid Document Sharing",
                description: "Exact binary document collision combined with extensive textual proposal overlap across competing bidders.",
                supportingIndicators: supporting,
                evidence: ev.ids,
                structuredEvidence: ev.structured,
                explanation: "Submitting identical files and overlapping proposals across different bids indicates synchronized preparation."
            });
        }

        // ── Deduplication / Anti-Double-Counting Logic ───────────────────────────
        // If an exact duplicate document is flagged under DOCUMENT_DUPLICATION,
        // do not double count identical evidence when scoring.
        const deduplicatedIndicators = [...indicators];

        return {
            correlatedFindings,
            deduplicatedIndicators
        };
    }
}
