/**
 * Fraud Engine — End-to-End Seed & Test Script
 *
 * Seeds the DB with all fraud test scenarios from docs/test-scenarios.md
 * and runs the FraudEngine against each, printing results.
 *
 * Run with: npm run test-fraud
 */

import { PrismaClient } from "@prisma/client";
import { FraudEngine } from "../services/fraud-engine/FraudEngine";

const prisma = new PrismaClient();
const fraudEngine = new FraudEngine();

// Helper to print a result summary
function printResult(label: string, result: Awaited<ReturnType<FraudEngine["analyze"]>>) {
    console.log(`\n── ${label} ──────────────────────────────`);
    console.log(`  Status    : ${result.status}`);
    console.log(`  Risk Score: ${result.riskScore}/100`);
    console.log(`  Risk Level: ${result.riskLevel}`);
    if (result.indicators.length === 0) {
        console.log("  Indicators: none");
    } else {
        result.indicators.forEach((ind: any, i: number) => {
            console.log(`  [${i + 1}] ${ind.type} (${ind.severity})`);
            console.log(`      ${ind.description}`);
        });
    }
}

async function run() {
    // ── Clean previous fraud data ────────────────────────────────────────────
    console.log("Cleaning previous fraud test data...");
    await prisma.fraudAnalysis.deleteMany();
    await prisma.evidence.deleteMany();
    await prisma.document.deleteMany();
    await prisma.bid.deleteMany();
    await prisma.bidder.deleteMany();
    await prisma.tenderRequirement.deleteMany();
    await prisma.tender.deleteMany();

    // ── Create a shared tender with a closing date in the past ───────────────
    const tender = await prisma.tender.create({
        data: {
            tenderNumber: "TND-FRAUD-001",
            title: "Fraud Engine Test Tender",
            organization: "CPCL",
            status: "CLOSED",
            closingDate: new Date("2025-01-01T00:00:00.000Z") // past date
        }
    });

    console.log("\nTender created:", tender.tenderNumber);

    // ────────────────────────────────────────────────────────────────────────
    // SCENARIO A — Fully clean bidder (expected: LOW risk)
    // ────────────────────────────────────────────────────────────────────────
    const bidderA = await prisma.bidder.create({ data: { legalName: "Alpha Systems Pvt Ltd" } });
    const bidA = await prisma.bid.create({ data: { tenderId: tender.id, bidderId: bidderA.id } });
    await prisma.document.create({
        data: {
            bidId: bidA.id,
            filename: "gst_cert.pdf",
            hash: "sha256-alpha-gst-unique-001",
            fileType: "application/pdf",
            fileSize: 102400,
            storageReference: "local/alpha/gst_cert.pdf",
            // uploadTimestamp defaults to now() — before 2025 cutoff means we override manually
            uploadTimestamp: new Date("2024-12-01T10:00:00.000Z"),
            evidence: {
                createMany: {
                    data: [
                        // Name matches registered name exactly → no identity mismatch
                        { type: "ENTITY_NAME", value: "Alpha Systems Pvt Ltd", confidence: 0.99 },
                        { type: "GSTIN", value: "27ABCDE1234F1Z5", confidence: 0.99 }
                    ]
                }
            }
        }
    });

    // ────────────────────────────────────────────────────────────────────────
    // SCENARIO D — Identity mismatch (expected: MEDIUM+ risk)
    // GST says "ABC Technologies", registered as "XYZ Technologies"
    // ────────────────────────────────────────────────────────────────────────
    const bidderD = await prisma.bidder.create({ data: { legalName: "Vertex Constructions Ltd" } });
    const bidD = await prisma.bid.create({ data: { tenderId: tender.id, bidderId: bidderD.id } });
    const docD_gst = await prisma.document.create({
        data: {
            bidId: bidD.id,
            filename: "gst_cert.pdf",
            hash: "sha256-d-gst-unique-abc",
            fileType: "application/pdf",
            fileSize: 102400,
            storageReference: "local/d/gst_cert.pdf",
            uploadTimestamp: new Date("2024-12-10T09:00:00.000Z"),
            evidence: {
                createMany: {
                    data: [
                        // Mismatched name — document says "Omega Fabricators" vs registered "Vertex Constructions"
                        { type: "ENTITY_NAME", value: "Omega Fabricators Pvt Ltd", confidence: 0.95 },
                        { type: "GSTIN", value: "27XYZDE5678G1Z9", confidence: 0.95 }
                    ]
                }
            }
        }
    });
    const docD_udyam = await prisma.document.create({
        data: {
            bidId: bidD.id,
            filename: "udyam_cert.pdf",
            hash: "sha256-d-udyam-unique",
            fileType: "application/pdf",
            fileSize: 51200,
            storageReference: "local/d/udyam_cert.pdf",
            uploadTimestamp: new Date("2024-12-10T09:05:00.000Z"),
            evidence: {
                create: {
                    // Same wrong name in Udyam cert too
                    type: "ENTITY_NAME", value: "Omega Fabricators", confidence: 0.92
                }
            }
        }
    });

    // ────────────────────────────────────────────────────────────────────────
    // SCENARIO E — Document duplication / collusion
    // Bidder E1 and Bidder E2 submit the exact same OEM cert (same hash)
    // ────────────────────────────────────────────────────────────────────────
    const SHARED_HASH = "sha256-oem-cert-shared-collusion-hash-001";

    const bidderE1 = await prisma.bidder.create({ data: { legalName: "Delta Supplies Ltd" } });
    const bidE1 = await prisma.bid.create({ data: { tenderId: tender.id, bidderId: bidderE1.id } });
    await prisma.document.create({
        data: {
            bidId: bidE1.id,
            filename: "oem_cert.pdf",
            hash: SHARED_HASH, // <── same hash
            fileType: "application/pdf",
            fileSize: 204800,
            storageReference: "local/e1/oem_cert.pdf",
            uploadTimestamp: new Date("2024-12-15T14:00:00.000Z"),
            evidence: {
                create: { type: "ENTITY_NAME", value: "Delta Supplies Ltd", confidence: 0.98 }
            }
        }
    });

    const bidderE2 = await prisma.bidder.create({ data: { legalName: "Echo Ventures Pvt Ltd" } });
    const bidE2 = await prisma.bid.create({ data: { tenderId: tender.id, bidderId: bidderE2.id } });
    await prisma.document.create({
        data: {
            bidId: bidE2.id,
            filename: "oem_cert.pdf",
            hash: SHARED_HASH, // <── same hash (duplicate!)
            fileType: "application/pdf",
            fileSize: 204800,
            storageReference: "local/e2/oem_cert.pdf",
            uploadTimestamp: new Date("2024-12-15T14:30:00.000Z"),
            evidence: {
                create: { type: "ENTITY_NAME", value: "Echo Ventures Pvt Ltd", confidence: 0.98 }
            }
        }
    });

    // ────────────────────────────────────────────────────────────────────────
    // SCENARIO F — Multiple anomalies (identity mismatch + metadata anomaly)
    // Expected: HIGH or CRITICAL risk
    // ────────────────────────────────────────────────────────────────────────
    const bidderF = await prisma.bidder.create({ data: { legalName: "Genuine Works Pvt Ltd" } });
    const bidF = await prisma.bid.create({ data: { tenderId: tender.id, bidderId: bidderF.id } });

    // Doc 1: uploaded AFTER closing date (metadata anomaly)
    await prisma.document.create({
        data: {
            bidId: bidF.id,
            filename: "financial_statement.pdf",
            hash: "sha256-f-financial-unique",
            fileType: "application/pdf",
            fileSize: 153600,
            storageReference: "local/f/financial_statement.pdf",
            uploadTimestamp: new Date("2025-03-15T10:00:00.000Z"), // AFTER closing date (Jan 1 2025)
            evidence: {
                create: { type: "ENTITY_NAME", value: "Genuine Works Pvt Ltd", confidence: 0.99 }
            }
        }
    });

    // Doc 2: name mismatch + certificate issued after closing date
    await prisma.document.create({
        data: {
            bidId: bidF.id,
            filename: "gst_cert.pdf",
            hash: "sha256-f-gst-unique",
            fileType: "application/pdf",
            fileSize: 102400,
            storageReference: "local/f/gst_cert.pdf",
            uploadTimestamp: new Date("2024-12-20T08:00:00.000Z"),
            evidence: {
                createMany: {
                    data: [
                        // Wrong name
                        { type: "ENTITY_NAME", value: "Counterfeit Works Ltd", confidence: 0.88 },
                        // Certificate issued after tender closed
                        { type: "ISSUE_DATE", value: "2025-02-10T00:00:00.000Z", confidence: 0.95 }
                    ]
                }
            }
        }
    });

    // ── Run fraud analysis for each bid ──────────────────────────────────────
    console.log("\n\n╔══════════════════════════════════════════════╗");
    console.log("║       FRAUD ENGINE — TEST RUN RESULTS        ║");
    console.log("╚══════════════════════════════════════════════╝");

    console.log("\n[Expected: LOW risk — clean bidder]");
    const resultA = await fraudEngine.analyze({ bidId: bidA.id, tenderId: tender.id });
    printResult("Scenario A: Clean Bidder", resultA);

    console.log("\n[Expected: MEDIUM/HIGH risk — identity mismatch]");
    const resultD = await fraudEngine.analyze({ bidId: bidD.id, tenderId: tender.id });
    printResult("Scenario D: Identity Mismatch", resultD);

    console.log("\n[Expected: CRITICAL risk — document duplication in Bidder E1]");
    const resultE1 = await fraudEngine.analyze({ bidId: bidE1.id, tenderId: tender.id });
    printResult("Scenario E: Document Duplication (Bidder E1)", resultE1);

    console.log("\n[Expected: CRITICAL risk — document duplication in Bidder E2]");
    const resultE2 = await fraudEngine.analyze({ bidId: bidE2.id, tenderId: tender.id });
    printResult("Scenario E: Document Duplication (Bidder E2)", resultE2);

    console.log("\n[Expected: HIGH/CRITICAL risk — multiple anomalies]");
    const resultF = await fraudEngine.analyze({ bidId: bidF.id, tenderId: tender.id });
    printResult("Scenario F: Multiple Anomalies", resultF);

    console.log("\n\n✅ Fraud engine test run complete.");
}

run()
    .catch(e => {
        console.error("\n❌ Test run failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
