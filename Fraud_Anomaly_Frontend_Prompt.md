# Fraud & Anomaly Risk Frontend — Implementation Prompt

## Project Context

We are building **ONE integrated web platform** for the Smart India Hackathon 2026 problem:

**AI-Powered Integrated Bid Compliance Verification Platform for GeM Procurement**

Problem Statement ID: **26100**

The platform has two major backend intelligence engines:

1. **Tender & Document Compliance Verification Engine** — owned by the other team member.
2. **Fraud & Anomaly Risk Engine** — owned by me.

My responsibility is **ONLY the Fraud & Anomaly Risk Engine frontend**.

The Fraud Engine backend is already implemented and tested. Do not rewrite or interfere with the compliance engine.

Current Fraud Engine backend components:

- `detectors/FraudIndicator.ts`
  - Shared types: `FraudIndicator`, `IndicatorSeverity`, `IndicatorType`
- `detectors/IdentityMismatchDetector.ts`
  - Levenshtein-based identity/name comparison across documents
- `detectors/DocumentDuplicationDetector.ts`
  - Cross-bid SHA-256 hash collision detection
- `detectors/MetadataAnomalyDetector.ts`
  - Post-deadline uploads, impossible certificate dates, bulk upload anomalies
- `scoring/RiskScorer.ts`
  - Aggregates indicators into a 0–100 risk score and risk level
- `FraudEngine.ts`
  - Orchestrates database queries, runs detectors, and persists `FraudAnalysis`

Existing backend test scenarios:

| Scenario | Expected Result |
|---|---|
| Clean bidder | 0/100 — LOW |
| Identity mismatch | 50/100 — MEDIUM |
| Document duplication | 40/100 — MEDIUM with CRITICAL indicator |
| Multiple anomalies | 80/100 — CRITICAL |

---

# 1. PRIMARY GOAL

Build the **Fraud & Anomaly Risk frontend** inside the EXISTING React application.

The frontend must:

- Use the existing project's design system.
- Look like a natural part of the same GeM procurement platform.
- Display real Fraud Engine backend results.
- Clearly show risk score, risk level, indicators, evidence, explanations and recommendations.
- Never claim that fraud is definitively proven.
- Keep the Procurement Officer as the final decision-maker.
- Be professional enough for an SIH government/enterprise demonstration.

DO NOT create a separate website.

DO NOT create a separate frontend application.

DO NOT redesign the existing application theme.

DO NOT modify the Compliance Engine's business logic or UI unnecessarily.

---

# 2. IMPORTANT FIRST STEP — INSPECT THE EXISTING REPOSITORY

Before writing code, inspect the repository.

Look at:

- `frontend/`
- `src/`
- existing routes
- existing layout
- sidebar
- topbar
- CSS/design system
- CSS variables
- reusable Card components
- Button components
- Badge components
- Table components
- modal/drawer components
- existing API service layer
- existing TypeScript types
- existing bidder/tender pages
- `package.json`
- existing routing
- existing backend API routes

DO NOT assume that files or endpoints mentioned in this prompt already exist.

Reuse existing components wherever possible.

Do not duplicate components that already exist.

Do not overwrite working code.

---

# 3. EXISTING VISUAL DESIGN — MUST REMAIN CONSISTENT

The application is intended to look like:

**Government Procurement Platform + Enterprise Compliance Software**

Visual principles:

- Professional
- Clean
- Information-dense
- Readable
- Restrained
- Accessible
- Responsive
- Desktop-first

Use the EXISTING project's visual design.

The established visual direction is:

- Navy
- Slate
- White
- Neutral gray
- Success
- Warning
- Danger

Do not introduce a new color palette.

Do not introduce a separate "Fraud" theme.

Do not use:

- Excessive gradients
- Glassmorphism
- Neon colors
- Futuristic AI effects
- Huge decorative elements
- Excessive animations
- Chatbot-style layouts
- Excessive rounded cards
- Decorative graphics that reduce information density

This is a government procurement/risk-analysis application, not a gaming or consumer AI application.

---

# 4. TECHNOLOGY

Use the technologies already established by the project.

Preferred stack:

- React
- TypeScript
- Vite
- React Router
- Axios
- Zod
- Lucide React
- Vanilla CSS

Do NOT introduce Tailwind CSS if the existing project uses Vanilla CSS.

Use reusable CSS variables and existing design tokens.

Use Lucide React for icons if it is already installed.

---

# 5. MODULE LOCATION

The Fraud & Risk module should appear inside the existing application shell.

Existing navigation concept:

- Dashboard
- Tenders
- Requirements
- Documents
- Compliance
- Bids
- Fraud & Risk
- Reports
- Settings

Add/activate the **Fraud & Risk** navigation item only if it is not already present.

Do not create fake functionality for unrelated future modules.

The Fraud & Risk section should use the same:

- Sidebar
- Topbar
- Breadcrumbs
- Page container
- Typography
- Buttons
- Tables
- Cards
- Badges
- Spacing
- Loading states
- Empty states
- Error states

as the rest of the application.

---

# 6. FRAUD & RISK PAGES

Implement the following pages/views.

## A. Fraud & Risk Overview

Suggested route:

`/fraud-risk`

Purpose:

Provide an overview of fraud/anomaly risk across bids.

Display:

### Summary metrics

- Bids Analyzed
- Anomalies Detected
- High/Critical Risk Bids
- Bids Requiring Review

Do NOT hardcode production-looking numbers.

Use the backend API if these metrics exist.

If the backend does not currently expose aggregate statistics, keep the page focused on available real data rather than inventing numbers.

### Risk assessment table

Columns:

- Bidder
- Bid/Tender
- Risk Score
- Risk Level
- Indicators
- Last Analyzed
- Action

Actions:

- View Analysis

Use search/filter/sorting where appropriate.

---

# 7. BID FRAUD & ANOMALY ANALYSIS PAGE

Suggested route:

`/bids/:bidId/fraud-risk`

This is the most important page in the module.

Header:

- Bidder name
- Bid ID
- Tender name/ID
- Analysis status
- Last analyzed timestamp

Example visual structure:

Fraud & Anomaly Assessment

Risk Score:
`80 / 100`

Risk Level:
`CRITICAL`

Then show:

- Critical indicators
- High indicators
- Medium indicators
- Low indicators

Do not use color alone to communicate severity.

Always display text such as:

- LOW
- MEDIUM
- HIGH
- CRITICAL

---

# 8. RISK SCORE DISPLAY

Create a reusable `RiskScoreCard`.

It should show:

- Numeric score
- `/100`
- Risk level
- Short interpretation

Example:

`80 / 100`

`CRITICAL`

Possible interpretation:

> Multiple suspicious indicators require manual investigation.

Do not describe the score as proof of fraud.

Do not say:

> "This bidder is fraudulent."

Use language such as:

> "High anomaly risk detected."

> "Potentially suspicious indicators identified."

> "Manual investigation recommended."

---

# 9. RISK SCORE BREAKDOWN

Create a clear explanation of how the score was produced.

Example:

Risk Score Breakdown

- Document Duplication: +40
- Identity Mismatch: +20
- Metadata Anomaly: +20
- Total: 80/100

Use the actual backend result where available.

Do not invent score contributions on the frontend.

If the backend only returns the final score, display the score without fabricating a mathematical breakdown.

The frontend must not implement a second risk-scoring algorithm.

The backend `RiskScorer` is authoritative.

---

# 10. FRAUD INDICATOR LIST

Create a reusable `IndicatorCard` or equivalent component.

Each indicator should show:

- Indicator type
- Severity
- Short title
- Description
- Evidence summary
- Detector/source if available
- Recommendation
- Timestamp if available

Examples:

### DOCUMENT DUPLICATION

Severity:
`CRITICAL`

Description:

> Same document hash detected across bidder submissions.

Evidence:

- Document name
- Current bidder
- Matching bidder
- SHA-256 hash

Recommendation:

> Review whether the document was legitimately reused or submitted in error.

---

### IDENTITY MISMATCH

Severity:
`HIGH` or backend-provided severity

Description:

> Potential inconsistency detected between bidder identity information in submitted documents.

Evidence:

- Document A
- Extracted name
- Document B
- Extracted name
- Similarity score if available

Recommendation:

> Verify bidder identity against authoritative records.

---

### METADATA ANOMALY

Severity:
backend-provided severity

Description:

> Suspicious document timing or metadata pattern detected.

Evidence:

- Relevant date
- Bid deadline
- Upload timestamp
- Other available evidence

Recommendation:

> Manually review the document timeline.

---

# 11. EVIDENCE-FIRST DESIGN

Evidence is more important than decorative AI visuals.

Every significant indicator should allow the officer to inspect supporting evidence.

Implement an `EvidenceDrawer`, modal, or detail panel.

When the user clicks:

`View Details`

show:

- Indicator name
- Severity
- Detector
- Explanation
- Evidence
- Relevant document names
- Relevant bidder/bid references
- Values being compared
- Recommendation

Example:

Identity Mismatch

Document A:
`GST_Certificate.pdf`

Extracted name:
`ABC Technologies Pvt Ltd`

Document B:
`PAN.pdf`

Extracted name:
`ABC Technology Pvt Ltd`

Similarity:
`72%`

Explanation:

> The bidder name differs across submitted documents. This may be a legitimate naming variation, but manual verification is recommended.

Recommendation:

> Verify the legal entity name using an authoritative source.

---

# 12. DOCUMENT DUPLICATION VISUALIZATION

Because the Fraud Engine uses SHA-256 cross-bid collision detection, provide a useful UI for duplicate documents.

Example:

Document:
`OEM_Authorization.pdf`

Current bidder:
`ABC Technologies Pvt Ltd`

Matching bidder:
`XYZ Industries Pvt Ltd`

SHA-256:
`8f4a...91bc`

Status:

`DUPLICATE HASH DETECTED`

Severity:

`CRITICAL`

Provide:

`Compare Evidence`

if enough backend information exists.

Do not claim that identical hashes automatically prove fraud.

Explain:

> Identical file hashes indicate that the same digital file content was submitted. Manual review is required to determine whether the reuse is legitimate.

---

# 13. RECOMMENDATION SECTION

At the bottom of an analysis, display a clear recommendation.

Example:

### Recommended Action

> Potential anomalies detected. Manual investigation is recommended before making a procurement decision.

Use wording such as:

- Manual review recommended
- Verify supporting documents
- Review identity discrepancy
- Review duplicate document evidence
- Confirm document chronology

Do NOT automatically recommend:

- "Reject bidder"
- "Disqualify bidder"
- "Fraud confirmed"

The Procurement Officer remains the final decision-maker.

---

# 14. HUMAN-IN-THE-LOOP

The frontend must make this explicit.

Add a subtle information note:

> **Officer Review Required**
>
> Fraud & Anomaly Risk is a decision-support assessment. The system identifies suspicious indicators but does not determine fraud or make the final procurement decision.

This should appear on the detailed analysis page.

---

# 15. REVIEW ACTIONS

If the backend already supports review status, provide appropriate UI actions such as:

- Mark as Reviewed
- Add Review Note
- Acknowledge Indicator

If these backend capabilities do NOT exist:

DO NOT create fake buttons that appear to work.

Instead, either:

- omit the action, or
- implement the smallest necessary backend endpoint only if it fits the existing architecture.

Do not invent a complete review workflow.

---

# 16. FILTERS

On the Fraud & Risk overview page, support useful filters where backend data allows:

- Risk Level
  - LOW
  - MEDIUM
  - HIGH
  - CRITICAL
- Indicator Type
  - Identity Mismatch
  - Document Duplication
  - Metadata Anomaly
- Review Status
- Tender
- Date

Keep filters simple and professional.

---

# 17. LOADING STATES

Do not show blank pages while analysis loads.

Use:

- Skeletons
- Spinner where appropriate
- "Loading fraud analysis..."
- "Retrieving risk indicators..."

Example:

> Loading Fraud & Anomaly Analysis  
> Retrieving indicators and evidence...

Avoid excessive animation.

---

# 18. EMPTY STATES

Implement meaningful empty states.

Example:

### No analysis available

> No Fraud & Anomaly analysis has been generated for this bid yet.

Button:

`Run Analysis`

Only show the button if the backend actually supports running analysis.

Another:

### No anomalies detected

> No suspicious indicators were identified for this bid.

Risk:

`LOW`

Do not say:

> "This bidder is completely safe."

---

# 19. ERROR STATES

Show useful user-facing errors.

Example:

> Unable to retrieve fraud analysis.

> The Fraud & Anomaly Engine could not be reached. Please try again.

Button:

`Retry`

Never show raw stack traces, database errors, API secrets or internal implementation details.

---

# 20. API INTEGRATION

First inspect the existing backend.

Do NOT invent endpoint names if existing endpoints are available.

Create/use a dedicated API service such as:

`src/services/api/fraudApi.ts`

Keep API calls out of presentation components.

The API layer should handle:

- Fetch fraud analysis
- Run analysis if supported
- Fetch indicators
- Fetch evidence if supported

Use TypeScript types for responses.

Use Zod validation if the project already uses Zod for API response validation.

The frontend must display REAL backend data.

Do not use fake hardcoded risk scores in the final implementation.

---

# 21. FRONTEND TYPES

Create/reuse types such as:

```ts
type IndicatorSeverity =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

interface FraudIndicator {
  id: string;
  type: string;
  severity: IndicatorSeverity;
  title?: string;
  description: string;
  evidence?: unknown;
  recommendation?: string;
}

interface FraudAnalysis {
  id: string;
  bidId: string;
  riskScore: number;
  riskLevel: string;
  indicators: FraudIndicator[];
  createdAt?: string;
}
```

IMPORTANT:

Do not duplicate existing backend/shared types if they are already available to the frontend.

Reuse the project's existing contracts.

Adapt the exact structure to the real API.

---

# 22. COMPONENT STRUCTURE

Prefer reusable components.

Possible structure:

```text
frontend/src/
├── pages/
│   └── FraudRisk/
│       ├── FraudRiskDashboard.tsx
│       └── FraudRiskAnalysis.tsx
│
├── components/
│   └── fraud/
│       ├── RiskScoreCard.tsx
│       ├── RiskLevelBadge.tsx
│       ├── RiskSummary.tsx
│       ├── FraudIndicatorCard.tsx
│       ├── FraudIndicatorList.tsx
│       ├── RiskBreakdown.tsx
│       ├── EvidenceDrawer.tsx
│       └── ReviewNotice.tsx
│
├── services/
│   └── api/
│       └── fraudApi.ts
│
└── types/
    └── fraud.ts
```

Use different filenames if the existing repository has a different convention.

---

# 23. ROUTING

Add routes using the existing React Router setup.

Suggested:

```text
/fraud-risk
/bids/:bidId/fraud-risk
```

If the application already has a bid details route, integrate the Fraud & Risk page into that structure instead of creating duplicate bid pages.

---

# 24. INTEGRATION WITH THE OTHER TEAM MEMBER'S MODULE

Do NOT modify the Compliance Engine.

Your frontend should consume its own Fraud Engine data.

The overall application can eventually show:

```text
Compliance Result
+
Fraud & Anomaly Risk
```

But keep these concepts separate.

Example:

Compliance:

`92% — COMPLIANT`

Fraud/Anomaly:

`48/100 — MEDIUM RISK`

Do not combine them into one unexplained score.

If the overall application later requires an overall risk, it should be a separate, explainable orchestration layer.

---

# 25. IMPORTANT — DO NOT IMPLEMENT COMPLIANCE LOGIC

Do NOT add:

- GST compliance rules
- PAN compliance rules
- Udyam compliance rules
- Tender requirement evaluation
- PASS/FAIL compliance calculations
- Compliance scoring
- Compliance requirement extraction

Those belong to the other team member's module.

Your frontend should only consume/display compliance information where the existing shared application already provides it.

---

# 26. RESPONSIVE DESIGN

Primary target:

- Desktop
- Laptop
- Tablet

Desktop is the main target because the system is designed for Procurement Officers.

Mobile should remain usable but does not need to be the primary experience.

Tables should handle smaller widths gracefully.

---

# 27. ACCESSIBILITY

Implement:

- Semantic HTML
- Keyboard navigation
- Accessible buttons
- Accessible form labels
- Good contrast
- Tooltips only where useful
- Text labels alongside icons
- Status text alongside colors

Do not communicate severity using color alone.

Example:

Correct:

`CRITICAL`

with danger styling.

Incorrect:

only a red circle with no label.

---

# 28. SECURITY

Never place secrets in frontend code.

Do NOT expose:

- API keys
- AI provider keys
- Database credentials
- JWT signing secrets
- Internal service credentials

The frontend should communicate through the existing backend API.

Backend authorization remains authoritative.

---

# 29. PERFORMANCE

Avoid unnecessary API requests.

Use:

- Proper loading states
- Request cancellation where useful
- Reasonable caching if the existing project uses it
- Pagination for large lists
- Lazy loading for heavy views if appropriate

Do not over-engineer.

---

# 30. VISUAL PRIORITY

The page hierarchy should be:

1. Risk level
2. Risk score
3. Number/severity of indicators
4. Indicator details
5. Evidence
6. Explanation
7. Recommendation
8. Review context

The officer should understand the situation within a few seconds.

---

# 31. DO NOT MAKE IT LOOK LIKE A GENERIC AI DASHBOARD

Avoid:

- Brain graphics
- Robot illustrations
- "AI POWERED!!!" banners
- Glowing neural-network backgrounds
- Animated scanning effects
- Neon red/blue cyber-security themes
- Giant circular gauges taking most of the screen
- Excessive charts with no decision value

This is an **enterprise procurement risk-analysis system**.

Evidence and clarity are the priority.

---

# 32. TEST WITH THE EXISTING FOUR FRAUD SCENARIOS

After implementation, verify the frontend using the backend's existing test scenarios.

### Scenario A — Clean Bidder

Expected:

`0/100`

`LOW`

No suspicious indicators.

### Scenario D — Identity Mismatch

Expected:

`50/100`

`MEDIUM`

Identity mismatch indicator displayed.

### Scenario E — Document Duplication

Expected:

`40/100`

`MEDIUM`

Critical duplication indicator displayed.

### Scenario F — Multiple Anomalies

Expected:

`80/100`

`CRITICAL`

Multiple indicators displayed with correct severity.

The frontend must not change these backend results.

---

# 33. ACCEPTANCE CRITERIA

The implementation is complete when:

- [ ] Fraud & Risk appears inside the existing application.
- [ ] Existing theme remains unchanged.
- [ ] Existing sidebar/topbar remain consistent.
- [ ] Fraud Risk overview page works.
- [ ] Bid-level Fraud Risk Analysis page works.
- [ ] Real backend risk score is displayed.
- [ ] Real backend risk level is displayed.
- [ ] Real fraud indicators are displayed.
- [ ] Severity is displayed as text.
- [ ] Evidence can be inspected where backend data allows.
- [ ] Document duplication evidence is understandable.
- [ ] Identity mismatch evidence is understandable.
- [ ] Metadata anomaly evidence is understandable.
- [ ] Recommendations are displayed appropriately.
- [ ] Human-in-the-loop notice is present.
- [ ] No definitive "fraud confirmed" language is used.
- [ ] No compliance logic is duplicated.
- [ ] No fake hardcoded production data is used.
- [ ] Loading states work.
- [ ] Empty states work.
- [ ] Error states work.
- [ ] Existing frontend functionality still works.
- [ ] TypeScript build succeeds.
- [ ] No secrets are exposed.
- [ ] The four existing fraud scenarios can be demonstrated through the UI.

---

# 34. FINAL DEVELOPMENT RULE

Before making architectural changes, inspect the existing code.

Prefer:

**Reuse > Extend > Add small missing pieces > Rewrite**

Do not rewrite working backend logic.

Do not rewrite the existing frontend theme.

Do not create a second application.

Do not create fake APIs.

Do not fabricate government verification.

Do not fabricate fraud evidence.

Do not make automatic procurement decisions.

The goal is to make the Fraud & Anomaly Risk Engine feel like a **native module of the existing GeM procurement platform**.
