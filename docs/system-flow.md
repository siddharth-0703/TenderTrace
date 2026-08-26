# System Flow

## Procurement Lifecycle

1. **Tender Creation**
   - Procurement Officer uploads Tender PDF.
   - Compliance Engine extracts requirements (Statutory, Financial, Technical).
   - Officer reviews and confirms requirements.

2. **Bid Submission**
   - Bidders submit documents against the Tender.
   - Documents are stored securely, and hashes are generated.

3. **Analysis Phase (Automated)**
   - **OCR & Extraction:** Compliance Engine processes documents.
   - **Verification:** Data is verified against Government APIs/Mock Adapters.
   - **Compliance Check:** Compliance Engine evaluates rules and generates Compliance Score.
   - **Risk Check:** Fraud Engine evaluates metadata, cross-bid data, and generates Risk Score.
   - **Aggregation:** Orchestrator combines scores into an Overall Risk profile.

4. **Review Phase (Human-in-the-Loop)**
   - Procurement Officer accesses Dashboard.
   - Views Overall Risk, Compliance Score, and Fraud Risk.
   - Drills down into specific evidence (e.g., mismatched names, unverified GST).
   
5. **Decision & Audit**
   - Officer makes final qualification/disqualification decision.
   - Decision and justifications are logged into the immutable Audit Trail.
