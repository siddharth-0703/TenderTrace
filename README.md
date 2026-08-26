# AI-Powered Integrated Bid Compliance Verification Platform

**Problem Statement ID:** 26100  
**Organization:** Ministry of Petroleum & Natural Gas (CPCL)  

This platform automates the verification of bidder compliance and detects potential fraud/anomalies in GeM procurement processes. It maintains a **human-in-the-loop** architecture where AI provides recommendations and evidence, while the final decision rests with the Procurement Officer.

## Team & Ownership
- **Developer 1 (Siddharth):** Compliance Engine (Rules, Verification, OCR, Extraction)
- **Developer 2 (Team Member):** Fraud/Anomaly Engine (Risk indicators, Cross-bid analysis)

## Repository Structure
- `/docs`: Technical architecture, API contracts, schema, and workflow rules.
- `/frontend`: Web application for Procurement Officers.
- `/backend`: Main API, orchestration, and shared services.
- `/services/compliance-engine`: Document processing, extraction, and rule evaluation.
- `/services/fraud-engine`: Anomaly detection and risk scoring.
- `/tests`: Integration and synthetic data testing.

## Getting Started
1. Read the documentation in `/docs` to understand system architecture and data contracts.
2. Follow the Git workflow specified in `docs/git-workflow.md`.
3. Copy `.env.example` to `.env` and fill in local development values.
