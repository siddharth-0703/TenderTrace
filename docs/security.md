# Security Foundation

1. **Authentication & Authorization**
   - Use robust password hashing (e.g., bcrypt/Argon2).
   - Implement JWT or secure session cookies.
   - Enforce Role-Based Access Control (RBAC): Ensure only authorized Procurement Officers can view specific tenders/bids.

2. **Data & File Protection**
   - Strictly validate file uploads (allowed MIME types, size restrictions).
   - Run virus/malware scans on uploaded documents (if applicable).
   - Secure document storage references (do not expose direct public URLs to sensitive documents).
   - Generate SHA-256 hashes of files upon upload to detect tampering/duplicates.

3. **Configuration & Secrets**
   - Never commit `.env` files, API keys, private keys, or passwords to Git.
   - Use `.env.example` to document required environment variables.

4. **Audit Trail**
   - Implement an append-only (immutable-style) audit log.
   - Track: Who, What, When, Which Tender/Bid/Document, Result, and Evidence.
   - Ensure Officer decisions are securely tied to the exact state of compliance and fraud scores at the time of decision.
