export interface Tender {
  id: string;
  title: string;
  tenderNumber: string;
  organization: string;
  estimatedValue: number | null;
  status: string;
  processingStatus?: string;
  createdAt: string;
  updatedAt: string;
  requirements?: TenderRequirement[];
  documents?: Document[];
  bids?: Bid[];
  _count?: {
    documents: number;
    requirements: number;
    bids: number;
  };
}

export interface Document {
  id: string;
  tenderId?: string | null;
  bidId?: string | null;
  filename: string;
  documentClass: string;
  fileSize: number;
  mimeType: string;
  s3Key: string;
  processingStatus: string;
  pageCount: number;
  uploadTimestamp: string;
}

export interface TenderRequirement {
  id: string;
  tenderId: string;
  category: string;
  type: string;
  description: string;
  mandatory: boolean;
  operator: string;
  threshold: number | null;
  expectedValue: string | null;
  unit: string | null;
  rules: string | null; // JSON string
  sourceDocumentId: string | null;
  confidence: string | null;
  sourceProvenance: string | null; // JSON string
  aiMetadata: string | null;
  reviewStatus: string;
  version: number;
  status: string;
  supersededById: string | null;
  createdAt: string;
}

export interface Evidence {
  id: string;
  bidId: string;
  sourceDocumentId: string;
  type: string;
  value: string | null;
  numericValue: number | null;
  confidence: number;
  sourceText: string;
  pageNumber: number;
  extractionMethod: string;
  createdAt: string;
}

export interface Bid {
  id: string;
  tenderId: string;
  bidderId: string;
  status: string;
  submittedAt?: string;
  submissionDate?: string;
  createdAt: string;
  updatedAt: string;
  documents?: Document[];
  tender?: Tender;
  complianceResults?: any[];
  _count?: {
    documents: number;
  };
  bidder?: Bidder;
}

export interface Bidder {
  id: string;
  name?: string;
  legalName?: string;
  contactEmail?: string;
  contactInformation?: string | null;
  registrationInfo?: string | null;
  businessInformation?: string | null;
  gstin?: string | null;
  createdAt: string;
}

export interface RequirementEvidenceMatch {
  id: string;
  bidId: string;
  requirementId: string;
  evidenceId: string | null;
  matchScore: number;
  matchReasons: string | null; // JSON string array
  matchingTrace: string | null; // JSON object
  isCompliant: boolean;
  status: string; // e.g. COMPLIANT, NON_COMPLIANT, CONFLICTING_EVIDENCE, INSUFFICIENT_EVIDENCE
  createdAt: string;
  requirement?: TenderRequirement;
  evidence?: Evidence; 
}

export interface DashboardStats {
  tenders: number;
  documents: number;
  requirements: number;
  bids: number;
  reviewRequired: number;
  conflicting: number;
}
