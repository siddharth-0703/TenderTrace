export interface OrganizationPreferences {
  organizationName: string;
  departmentCode: string;
  tenderPortalId: string;
  currency: string;
  currencySymbol: string;
  timezone: string;
  defaultTenderValidityDays: number;
  bidSubmissionGraceMinutes: number;
  publicContactEmail: string;
}

export interface NotificationSettings {
  emailNotificationsEnabled: boolean;
  alertOnHighRisk: boolean;
  alertOnCriticalRisk: boolean;
  alertOnComplianceFailure: boolean;
  dailyDigestEnabled: boolean;
  recipients: string[];
  webhookUrl: string;
  webhookEnabled: boolean;
}

export interface SystemPreferences {
  themeDensity: 'compact' | 'comfortable';
  autoAnalyzeOnBidUpload: boolean;
  auditLogLevel: 'MINIMAL' | 'STANDARD' | 'VERBOSE';
  dataRetentionYears: number;
  language: string;
  allowDevMockData: boolean;
}

export interface GeneralSettings {
  organization: OrganizationPreferences;
  notifications: NotificationSettings;
  system: SystemPreferences;
}

export interface RequiredDocumentRule {
  id: string;
  name: string;
  code: string;
  category: 'LEGAL' | 'TECHNICAL' | 'FINANCIAL' | 'STATUTORY';
  isMandatory: boolean;
  minOcrConfidence: number; // e.g. 75 (%)
  validityBufferDays: number; // e.g. 60 days
  allowedFileTypes: string[];
  description: string;
}

export interface ComplianceThresholds {
  minOverallPassScore: number; // e.g. 75 (%)
  zeroToleranceMandatory: boolean;
  financialTurnoverTolerancePercent: number; // e.g. 5 (%)
  experienceCriteriaMultiplier: number; // e.g. 1.0
  msmeExemptionEnabled: boolean;
  startupExemptionEnabled: boolean;
  blacklistedDebarmentAutoReject: boolean;
}

export interface VerificationPreferences {
  verifyGstnLive: boolean;
  verifyPanLive: boolean;
  verifyMca21Registry: boolean;
  gemSellerMinRating: number; // e.g. 3.5
  enableDocumentTamperCheck: boolean;
  requireDualSignoffForOverride: boolean;
}

export interface CompliancePillarWeights {
  eligibilityWeight: number; // e.g. 30 (%)
  technicalWeight: number;   // e.g. 40 (%)
  financialWeight: number;   // e.g. 30 (%)
  executionMode: 'SYNCHRONOUS' | 'BACKGROUND_QUEUE';
  bidderFeedbackDetailLevel: 'STANDARD' | 'DETAILED_BREAKDOWN';
}

export interface ComplianceSettings {
  thresholds: ComplianceThresholds;
  requiredDocuments: RequiredDocumentRule[];
  verification: VerificationPreferences;
  configuration: CompliancePillarWeights;
}

export interface RiskThresholds {
  criticalScoreCutoff: number; // e.g. 75 (75-100)
  highScoreCutoff: number;     // e.g. 50 (50-74)
  mediumScoreCutoff: number;   // e.g. 25 (25-49)
  lowScoreCutoff: number;      // e.g. 0  (0-24)
  autoFlagVigilanceScore: number; // e.g. 70
}

export interface DetectionSensitivity {
  preset: 'CONSERVATIVE' | 'STANDARD' | 'AGGRESSIVE';
  textSimilarityThresholdPercent: number; // e.g. 85 (%)
  priceCollusionDeltaPercent: number;     // e.g. 0.5 (%)
  sharedInfrastructureSensitivity: 'LOW' | 'MEDIUM' | 'HIGH';
  fuzzyMatchingTolerancePercent: number;  // e.g. 80 (%)
}

export interface IndicatorConfigItem {
  id: string;
  type: string;
  label: string;
  description: string;
  category: 'IDENTITY' | 'DOCUMENT' | 'COLLUSION' | 'METADATA' | 'ANOMALY';
  enabled: boolean;
  baseSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  penaltyPoints: number; // Weight contributed to total risk score
}

export interface InvestigationPrioritySettings {
  p1ImmediateSlaHours: number;  // e.g. 24
  p2HighSlaHours: number;       // e.g. 48
  p3MediumSlaDays: number;      // e.g. 5
  p4RoutineSlaDays: number;     // e.g. 14
  autoAssignVigilanceOnCritical: boolean;
  autoFreezeBidOnCritical: boolean;
  notifyNodalOfficerOnHighRisk: boolean;
}

export interface FraudDetectionSettings {
  riskThresholds: RiskThresholds;
  sensitivity: DetectionSensitivity;
  indicators: IndicatorConfigItem[];
  investigationPriority: InvestigationPrioritySettings;
}

export interface AppSettings {
  version: string;
  lastUpdated: string;
  general: GeneralSettings;
  compliance: ComplianceSettings;
  fraudDetection: FraudDetectionSettings;
}

export const DEFAULT_REQUIRED_DOCUMENTS: RequiredDocumentRule[] = [
  {
    id: 'doc-gstin',
    name: 'GSTIN Registration Certificate',
    code: 'DOC_GSTIN',
    category: 'STATUTORY',
    isMandatory: true,
    minOcrConfidence: 80,
    validityBufferDays: 60,
    allowedFileTypes: ['pdf', 'png', 'jpg'],
    description: 'Active GST registration certificate issued by the Government of India.'
  },
  {
    id: 'doc-pan',
    name: 'Company PAN Card',
    code: 'DOC_PAN',
    category: 'LEGAL',
    isMandatory: true,
    minOcrConfidence: 85,
    validityBufferDays: 0,
    allowedFileTypes: ['pdf', 'png', 'jpg'],
    description: 'Permanent Account Number of the legal bidding entity.'
  },
  {
    id: 'doc-msme',
    name: 'MSME / Udyam Certificate',
    code: 'DOC_UDYAM',
    category: 'STATUTORY',
    isMandatory: false,
    minOcrConfidence: 75,
    validityBufferDays: 90,
    allowedFileTypes: ['pdf'],
    description: 'Udyam Registration Certificate for claiming MSME preference/exemptions.'
  },
  {
    id: 'doc-itr',
    name: 'ITR Return Acknowledgment (Last 3 Yrs)',
    code: 'DOC_ITR',
    category: 'FINANCIAL',
    isMandatory: true,
    minOcrConfidence: 80,
    validityBufferDays: 30,
    allowedFileTypes: ['pdf'],
    description: 'Income Tax Return receipts certified for the preceding 3 financial years.'
  },
  {
    id: 'doc-turnover',
    name: 'Audited CA Turnover Certificate',
    code: 'DOC_TURNOVER',
    category: 'FINANCIAL',
    isMandatory: true,
    minOcrConfidence: 85,
    validityBufferDays: 60,
    allowedFileTypes: ['pdf'],
    description: 'Turnover certificate certified with unique UDIN by a practicing Chartered Accountant.'
  },
  {
    id: 'doc-oem',
    name: 'OEM Authorization Letter (MAF)',
    code: 'DOC_OEM_AUTH',
    category: 'TECHNICAL',
    isMandatory: true,
    minOcrConfidence: 75,
    validityBufferDays: 120,
    allowedFileTypes: ['pdf'],
    description: 'Manufacturer Authorization Form directly addressed to this tender inquiry.'
  },
  {
    id: 'doc-emd',
    name: 'Earnest Money Deposit (EMD) Proof',
    code: 'DOC_EMD',
    category: 'FINANCIAL',
    isMandatory: true,
    minOcrConfidence: 70,
    validityBufferDays: 90,
    allowedFileTypes: ['pdf'],
    description: 'Bank Guarantee / e-PBG or proof of online EMD remittance.'
  },
  {
    id: 'doc-debarment',
    name: 'Non-Debarment & Integrity Undertaking',
    code: 'DOC_NON_DEBARMENT',
    category: 'LEGAL',
    isMandatory: true,
    minOcrConfidence: 75,
    validityBufferDays: 180,
    allowedFileTypes: ['pdf'],
    description: 'Affidavit affirming non-blacklisting by any central/state government ministry or GeM.'
  }
];

export const DEFAULT_FRAUD_INDICATORS: IndicatorConfigItem[] = [
  {
    id: 'ind-identity-mismatch',
    type: 'IDENTITY_MISMATCH',
    label: 'Identity / PAN / Legal Name Mismatch',
    category: 'IDENTITY',
    description: 'Discrepancy between registered vendor credentials and entity extracted from submitted documents.',
    enabled: true,
    baseSeverity: 'CRITICAL',
    penaltyPoints: 35
  },
  {
    id: 'ind-doc-duplication',
    type: 'DOCUMENT_DUPLICATION',
    label: 'Document Cryptographic Duplication',
    category: 'DOCUMENT',
    description: 'Identical document SHA256 hashes or direct byte copies shared across competing bids in the same tender.',
    enabled: true,
    baseSeverity: 'CRITICAL',
    penaltyPoints: 40
  },
  {
    id: 'ind-company-consistency',
    type: 'COMPANY_CONSISTENCY',
    label: 'Company Information Inconsistency',
    category: 'IDENTITY',
    description: 'Conflicting business addresses, GSTIN numbers, or UDYAM identifiers between different tender exhibits.',
    enabled: true,
    baseSeverity: 'HIGH',
    penaltyPoints: 25
  },
  {
    id: 'ind-cross-bid-similarity',
    type: 'CROSS_BID_SIMILARITY',
    label: 'Cross-Bid Text Cosine Similarity',
    category: 'COLLUSION',
    description: 'High semantic text or structural layout overlap indicating coordinated drafting between rival bidders.',
    enabled: true,
    baseSeverity: 'HIGH',
    penaltyPoints: 30
  },
  {
    id: 'ind-metadata-anomaly',
    type: 'METADATA_ANOMALY',
    label: 'PDF Metadata & Author Anomaly',
    category: 'METADATA',
    description: 'Shared PDF creator software, identical author GUIDs, or single-machine export timestamps.',
    enabled: true,
    baseSeverity: 'HIGH',
    penaltyPoints: 20
  },
  {
    id: 'ind-suspicious-timestamp',
    type: 'SUSPICIOUS_TIMESTAMP',
    label: 'Suspicious Creation Timestamp Sequence',
    category: 'METADATA',
    description: 'Documents generated back-to-back within seconds across separate legal bidding accounts.',
    enabled: true,
    baseSeverity: 'MEDIUM',
    penaltyPoints: 15
  },
  {
    id: 'ind-collusion-pattern',
    type: 'COLLUSION_PATTERN',
    label: 'Price Clustering & Bid Rotational Pattern',
    category: 'COLLUSION',
    description: 'Suspicious price spreads (<0.5% margin) or coordinated bid withdrawal/cover-bidding history.',
    enabled: true,
    baseSeverity: 'CRITICAL',
    penaltyPoints: 35
  }
];

export const DEFAULT_APP_SETTINGS: AppSettings = {
  version: '2.4.0',
  lastUpdated: '2026-08-28T00:00:00.000Z',
  general: {
    organization: {
      organizationName: 'Ministry of Electronics and Information Technology (MeitY)',
      departmentCode: 'GEM-PROC-2026-MEITY',
      tenderPortalId: 'GEM/GOV/IN/DELHI/2026',
      currency: 'INR',
      currencySymbol: '₹',
      timezone: 'Asia/Kolkata (IST +05:30)',
      defaultTenderValidityDays: 90,
      bidSubmissionGraceMinutes: 15,
      publicContactEmail: 'procurement-support@gem.gov.in'
    },
    notifications: {
      emailNotificationsEnabled: true,
      alertOnHighRisk: true,
      alertOnCriticalRisk: true,
      alertOnComplianceFailure: true,
      dailyDigestEnabled: true,
      recipients: ['vigilance-officer@meity.gov.in', 'procurement-desk@gem.gov.in'],
      webhookUrl: 'https://gem.gov.in/api/v2/webhooks/tender-alerts',
      webhookEnabled: false
    },
    system: {
      themeDensity: 'comfortable',
      autoAnalyzeOnBidUpload: true,
      auditLogLevel: 'VERBOSE',
      dataRetentionYears: 5,
      language: 'English (India)',
      allowDevMockData: true
    }
  },
  compliance: {
    thresholds: {
      minOverallPassScore: 75,
      zeroToleranceMandatory: true,
      financialTurnoverTolerancePercent: 0,
      experienceCriteriaMultiplier: 1.0,
      msmeExemptionEnabled: true,
      startupExemptionEnabled: true,
      blacklistedDebarmentAutoReject: true
    },
    requiredDocuments: DEFAULT_REQUIRED_DOCUMENTS,
    verification: {
      verifyGstnLive: true,
      verifyPanLive: true,
      verifyMca21Registry: true,
      gemSellerMinRating: 3.5,
      enableDocumentTamperCheck: true,
      requireDualSignoffForOverride: true
    },
    configuration: {
      eligibilityWeight: 30,
      technicalWeight: 40,
      financialWeight: 30,
      executionMode: 'SYNCHRONOUS',
      bidderFeedbackDetailLevel: 'DETAILED_BREAKDOWN'
    }
  },
  fraudDetection: {
    riskThresholds: {
      criticalScoreCutoff: 75,
      highScoreCutoff: 50,
      mediumScoreCutoff: 25,
      lowScoreCutoff: 0,
      autoFlagVigilanceScore: 70
    },
    sensitivity: {
      preset: 'STANDARD',
      textSimilarityThresholdPercent: 85,
      priceCollusionDeltaPercent: 0.5,
      sharedInfrastructureSensitivity: 'HIGH',
      fuzzyMatchingTolerancePercent: 80
    },
    indicators: DEFAULT_FRAUD_INDICATORS,
    investigationPriority: {
      p1ImmediateSlaHours: 24,
      p2HighSlaHours: 48,
      p3MediumSlaDays: 5,
      p4RoutineSlaDays: 14,
      autoAssignVigilanceOnCritical: true,
      autoFreezeBidOnCritical: true,
      notifyNodalOfficerOnHighRisk: true
    }
  }
};
