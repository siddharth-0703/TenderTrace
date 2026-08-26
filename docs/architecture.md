# System Architecture

## High-Level Architecture

```text
                    PROCUREMENT OFFICER
                            |
                            v
                    WEB APPLICATION
                            |
                            v
                     API / BACKEND (Orchestrator)
                            |
                +-----------+-----------+
                |                       |
                v                       v
        TENDER/BID SYSTEM       AUTHENTICATION/RBAC
                |
                v
        COMPLIANCE ORCHESTRATOR
                |
       +--------+---------+
       |                  |
       v                  v
COMPLIANCE ENGINE   FRAUD/ANOMALY ENGINE
       |                  |
       |                  |
       +--------+---------+
                |
                v
          RISK AGGREGATION
                |
                v
        COMPLIANCE DASHBOARD
                |
                v
        PROCUREMENT OFFICER
                |
                v
        FINAL DECISION
```

## Government Verification Adapters
The platform uses an adapter pattern to interact with external verification services. This ensures the core engine is decoupled from specific APIs and allows easy swapping between mock and real implementations.

```text
VerificationProvider (Interface)
       |
       +-- GSTProvider
       +-- UdyamProvider
       +-- PANProvider
       +-- MCAProvider
       +-- MockProvider (For SIH Prototype)
```

## AI Architecture Boundaries
**AI is used for:**
- OCR assistance and text extraction
- Document classification
- Semantic matching of requirements
- Inconsistency detection
- Generating natural-language explanations

**AI is NOT used for:**
- Final qualification/disqualification decisions
- Overriding deterministic compliance rules (e.g., if a tender requires 5Cr turnover, and extracted is 3Cr, it's deterministically non-compliant).
