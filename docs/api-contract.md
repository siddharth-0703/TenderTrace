# API Architecture Contract

*Note: This is a proposed Phase 0 contract. Details may evolve.*

## Authentication
- `POST /api/auth/login`: Authenticate Officer.
- `POST /api/auth/logout`: Invalidate session.

## Tenders
- `POST /api/tenders`: Upload/create a new tender.
- `GET /api/tenders`: List all tenders.
- `GET /api/tenders/:id`: Get tender details.
- `GET /api/tenders/:id/requirements`: List extracted compliance requirements.

## Bids & Documents
- `GET /api/tenders/:id/bids`: List bids for a tender.
- `POST /api/bids/:id/documents`: Upload bidder document.
- `GET /api/bids/:id/documents`: List uploaded documents for a bid.

## Verification & Analysis
- `POST /api/bids/:id/analyze`: Trigger parallel execution of Compliance and Fraud engines.
- `GET /api/bids/:id/compliance`: Fetch latest Compliance Engine results.
- `GET /api/bids/:id/fraud-analysis`: Fetch latest Fraud Engine results.
- `GET /api/bids/:id/risk`: Fetch aggregated overall risk.

## Audit & Reports
- `GET /api/audit`: Retrieve immutable audit logs (filterable by tender/bid).
- `POST /api/bids/:id/decision`: Submit final Procurement Officer decision.
