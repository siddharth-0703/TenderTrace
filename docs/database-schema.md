# Database Schema Design

*Note: Represented conceptually. Can be implemented in PostgreSQL, MongoDB, etc.*

## Entities

**User (Procurement Officer)**
- id, username, passwordHash, role, createdAt

**Tender**
- id, title, referenceNo, description, status, createdAt

**TenderRequirement**
- id, tenderId, type (GST, PAN, Turnover), name, mandatory (boolean), ruleSchema, evidenceRequired

**Bid**
- id, tenderId, bidderId, status, submittedAt

**Bidder**
- id, name, pan, gstin, profileData

**Document**
- id, bidId, type, fileReference, fileHash, mimeType, uploadTimestamp, ocrStatus, extractionStatus, verificationStatus, extractedData (JSON)

**ComplianceResult**
- id, bidId, score, status, explanation, requirementResults (JSON array)

**FraudAnalysis**
- id, bidId, riskScore, riskLevel, indicators (JSON array)

**AuditLog**
- id, actorId, actionType, entityId, entityType, timestamp, details (JSON)

**OfficerDecision**
- id, bidId, officerId, decision (QUALIFIED/REJECTED), justification, timestamp

## Relationship Diagram (Conceptual)
```text
User
 |
 +---- Tender
        |
        +---- TenderRequirement
        |
        +---- Bid
               |
               +---- Bidder
               |
               +---- Document
               |
               +---- ComplianceResult
               |
               +---- FraudAnalysis
               |
               +---- OfficerDecision
               |
               +---- AuditLog (Tracks actions on all entities)
```
