# Synthetic Test Data Scenarios

Since this is an SIH prototype, we will rely on synthetic data and mock API responses to demonstrate capabilities.

## Scenario A: Fully Compliant Bidder
- All required documents are present (GST, PAN, Udyam, etc.).
- Extracted data perfectly matches tender requirements.
- No cross-document mismatches.
- **Expected Outcome:** High Compliance Score, Low Risk Score.

## Scenario B: Missing Mandatory Document
- Tender requires an OEM authorization certificate.
- Bidder fails to upload it.
- **Expected Outcome:** Compliance Score drops significantly; flagged as NON-COMPLIANT for that requirement.

## Scenario C: Compliance Threshold Mismatch
- Tender requires average annual turnover of ₹5 crore.
- Extracted data from bidder's financials shows ₹3 crore.
- **Expected Outcome:** Deterministic compliance failure.

## Scenario D: Identity Anomaly
- GST Certificate entity name: "ABC Technologies"
- Udyam Registration entity name: "XYZ Technologies"
- **Expected Outcome:** Fraud Engine flags `IDENTITY_MISMATCH` with MEDIUM/HIGH severity.

## Scenario E: Duplicate Document (Collusion)
- Bidder A and Bidder B upload the exact same OEM certificate (identical SHA-256 hash).
- **Expected Outcome:** Fraud Engine flags `DOCUMENT_DUPLICATION` and cross-bid collusion risk.

## Scenario F: Multiple Anomalies (Final SIH Demo)
- A bidder with missing documents, manipulated dates (metadata anomalies), and failing turnover requirements.
- **Expected Outcome:** Low Compliance Score, High Risk Score. Perfect scenario for Officer rejection.
