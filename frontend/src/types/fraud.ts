// ─────────────────────────────────────────────────────────────────────────────
// Frontend types — mirrors backend FraudAnalysis Prisma model + FraudIndicator
// ─────────────────────────────────────────────────────────────────────────────

export type IndicatorSeverity = 'INFORMATIONAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type InvestigationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IndicatorType =
  | 'IDENTITY_MISMATCH'
  | 'DOCUMENT_DUPLICATION'
  | 'METADATA_ANOMALY'
  | 'COMPANY_INCONSISTENCY'
  | 'CROSS_BID_SIMILARITY'
  | 'SUSPICIOUS_DATE'
  | 'STRUCTURAL_ANOMALY';

export interface StructuredEvidenceItem {
  documentId?: string;
  field?: string;
  value?: string;
  expectedValue?: string;
  details?: string;
  score?: number;
  matchedBidId?: string;
  matchedDocId?: string;
  timestamp?: string;
}

export interface FraudIndicator {
  type: IndicatorType;
  severity: IndicatorSeverity;
  title?: string;
  description: string;
  evidence: string[]; // document IDs / bid IDs / hash values cited
  structuredEvidence?: StructuredEvidenceItem[];
  detector?: string;
  recommendation?: string;
}

export interface CorrelatedFinding {
  type: string;
  severity: IndicatorSeverity;
  title: string;
  description: string;
  supportingIndicators: IndicatorType[];
  evidence: string[];
  structuredEvidence?: StructuredEvidenceItem[];
  explanation?: string;
}

export interface FraudAnalysis {
  id: string;
  bidId: string;
  riskScore: number;                  // 0 – 100
  riskLevel: RiskLevel;
  confidence?: number | null;         // 0 – 100% evidence-backed confidence
  investigationPriority?: InvestigationPriority | null; // LOW, MEDIUM, HIGH, CRITICAL
  indicators: FraudIndicator[];
  correlatedFindings?: CorrelatedFinding[] | null;
  createdAt: string;                  // ISO date string
}

// ── Extended views (with joins from backend) ──────────────────────────────────

export interface BidderInfo {
  id: string;
  legalName: string;
}

export interface TenderInfo {
  id: string;
  tenderNumber: string;
  title: string;
  closingDate?: string | null;
}

export interface BidSummary {
  id: string;
  status: string;
  submittedAt: string;
  tenderId: string;
  tender: TenderInfo;
  bidder: BidderInfo;
  fraudAnalyses: FraudAnalysis[];
}

/** Used on the overview table */
export interface FraudAnalysisRow {
  analysis: FraudAnalysis;
  bid: BidSummary;
}

// ── Indicator metadata (used for UI labels / recommendations) ─────────────────

export interface IndicatorMeta {
  label: string;
  recommendation: string;
}

export const INDICATOR_META: Record<IndicatorType, IndicatorMeta> = {
  IDENTITY_MISMATCH: {
    label: 'Identity Mismatch',
    recommendation:
      "Verify the bidder's legal entity name against an authoritative source such as MCA21 or GeM registration records.",
  },
  DOCUMENT_DUPLICATION: {
    label: 'Document Duplication',
    recommendation:
      "Review whether the document was legitimately reused or submitted in error. Identical file hashes indicate the same digital file was submitted by multiple bidders.",
  },
  METADATA_ANOMALY: {
    label: 'Metadata Anomaly',
    recommendation:
      'Manually review the document timeline and verify submission chronology against the official tender closing date.',
  },
  COMPANY_INCONSISTENCY: {
    label: 'Company Consistency Conflict',
    recommendation:
      'Cross-verify statutory credentials (GSTIN, PAN, Udyam) to ensure documents originate from the authorized legal entity and not a shell or distinct organization.',
  },
  CROSS_BID_SIMILARITY: {
    label: 'Cross-Bid Similarity',
    recommendation:
      'Inspect proposal content and OEM authorization arrangements across matching bids to assess independent preparation and pricing validity.',
  },
  SUSPICIOUS_DATE: {
    label: 'Suspicious Date / Chronology',
    recommendation:
      'Check certificate issue and validity expiry dates against tender closing milestones to detect expired or backdated submissions.',
  },
  STRUCTURAL_ANOMALY: {
    label: 'Structural Document Anomaly',
    recommendation:
      'Perform forensic inspection of the document layout, page sequencing, and font layers to ensure no tampering has occurred.',
  },
};

export const SEVERITY_SCORE: Record<IndicatorSeverity, number> = {
  INFORMATIONAL: 0,
  LOW: 5,
  MEDIUM: 15,
  HIGH: 25,
  CRITICAL: 40,
};

export function getRiskInterpretation(level: RiskLevel): string {
  switch (level) {
    case 'LOW':      return 'No significant anomalies detected. Standard due diligence is recommended.';
    case 'MEDIUM':   return 'Potentially suspicious indicators identified. Manual verification is recommended before proceeding.';
    case 'HIGH':     return 'High anomaly risk detected. Manual investigation is recommended before making a procurement decision.';
    case 'CRITICAL': return 'Multiple critical indicators require immediate manual investigation before any procurement action.';
  }
}

