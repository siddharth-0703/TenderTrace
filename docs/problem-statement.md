# Problem Statement: 26100

**Title:** AI-Powered Integrated Bid Compliance Verification Platform for GeM Procurement  
**Organization:** Ministry of Petroleum & Natural Gas (CPCL)  
**Theme:** Smart Automation  

## Objective
To develop an automated platform that processes bidder documents, extracts relevant information, verifies statutory and tender-specific compliance, and flags potential fraud or anomalies.

## Key Requirements
1. **Tender Management:** Ingestion of tenders and extraction of compliance requirements.
2. **Document Processing:** OCR, classification, and structured data extraction from bidder documents (GST, PAN, Udyam, MCA, etc.).
3. **Verification:** Cross-document and third-party verification (via APIs or mock adapters).
4. **Compliance Checking:** Deterministic rules engine to match extracted data against tender requirements.
5. **Fraud & Anomaly Detection:** Identification of tampered documents, identity mismatches, duplicate documents, and cross-bid collusion.
6. **Scoring & Explanation:** Transparent calculation of Compliance Score and Fraud Risk, backed by clear evidence.
7. **Human-in-the-Loop:** Presentation of aggregated insights to the Procurement Officer for the final decision.
8. **Audit Trail:** Immutable-style logging of all system actions, verifications, and officer decisions.

## AI Boundaries
AI is strictly an enabler. It must **NOT** independently determine if a bidder is qualified or disqualified, nor declare definitive legal guilt. AI is utilized for document understanding, anomaly detection, semantic matching, and providing explainable recommendations.
