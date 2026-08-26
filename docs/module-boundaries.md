# Module Boundaries & Developer Ownership

## Compliance Engine (Owner: Siddharth)
Responsible for deterministic requirement verification and information extraction.
- Tender ingestion and requirement extraction
- OCR and document classification
- Structured information extraction from documents
- Matching bid data to tender requirements
- Execution of deterministic compliance rules
- Interfacing with Government Verification Adapters
- Calculating the deterministc **Compliance Score**
- Explaining compliance/non-compliance reasons

## Fraud/Anomaly Engine (Owner: Team Member)
Responsible for probabilistic risk assessment and anomaly detection.
- Detecting document tampering indicators
- Finding duplicate documents or reused hashes
- Cross-bid similarity and collusion detection
- Identifying identity inconsistencies (e.g., mismatched names/addresses)
- Analyzing suspicious metadata and chronology
- Calculating the **Fraud Risk Score**
- Providing evidence-based risk indicators

## Shared Responsibilities
Both developers jointly own:
- Backend architecture & Database
- Authentication/RBAC
- API gateway
- Dashboard integration
- Audit trail & Reports
- Testing & Deployment
- Git/GitHub workflow

## Core Data Contract (Inter-engine Communication)

**Input to both engines from Orchestrator:**
```json
{
  "tenderId": "TENDER-001",
  "bidId": "BID-001",
  "bidder": {
    "name": "ABC Technologies Pvt Ltd",
    "pan": "ABCDE1234F",
    "gstin": "27ABCDE1234F1Z5"
  },
  "documents": [
    {
      "documentId": "DOC-001",
      "type": "GST_CERTIFICATE",
      "hash": "sha256-hash",
      "fileReference": "storage-reference",
      "extractedData": {
        "status": "Active",
        "legalName": "ABC Technologies Pvt Ltd"
      }
    }
  ]
}
```

**Compliance Engine Output:**
```json
{
  "bidId": "BID-001",
  "compliance": {
    "score": 91,
    "status": "REVIEW",
    "requirements": [
      {
        "requirementId": "REQ-001",
        "status": "MET",
        "evidence": "DOC-001",
        "points": 20
      }
    ],
    "explanation": "GST verified (+20). Missing OEM authorization (-5)."
  }
}
```

**Fraud Engine Output:**
```json
{
  "bidId": "BID-001",
  "riskScore": 32,
  "riskLevel": "MEDIUM",
  "indicators": [
    {
      "type": "IDENTITY_MISMATCH",
      "severity": "MEDIUM",
      "description": "Company name differs across documents",
      "evidence": ["DOC-001", "DOC-004"]
    }
  ]
}
```
