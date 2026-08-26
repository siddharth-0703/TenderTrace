import { PrismaClient } from "@prisma/client";
import { ComplianceEngine } from "../services/compliance-engine/engine/ComplianceEngine";

const prisma = new PrismaClient();
const engine = new ComplianceEngine();

async function run() {
    console.log("Cleaning database...");
    await prisma.complianceResult.deleteMany();
    await prisma.evidence.deleteMany();
    await prisma.document.deleteMany();
    await prisma.bid.deleteMany();
    await prisma.bidder.deleteMany();
    await prisma.tenderRequirement.deleteMany();
    await prisma.tender.deleteMany();

    console.log("1. Creating Synthetic Tender...");
    const tender = await prisma.tender.create({
        data: {
            tenderNumber: "TND-2026-001",
            title: "Supply of Industrial Equipment",
            organization: "CPCL",
            status: "READY"
        }
    });

    console.log("2. Creating Tender Requirement (Min Turnover >= 5Cr)...");
    const requirement = await prisma.tenderRequirement.create({
        data: {
            tenderId: tender.id,
            category: "FINANCIAL",
            type: "MIN_TURNOVER",
            description: "Minimum average annual turnover of ₹5 crore",
            operator: ">=",
            threshold: 50000000,
            unit: "INR"
        }
    });

    console.log("3. Creating Bidder...");
    const bidder = await prisma.bidder.create({
        data: {
            legalName: "ABC Technologies Pvt Ltd",
        }
    });

    console.log("4. Creating Bid Submission...");
    const bid = await prisma.bid.create({
        data: {
            tenderId: tender.id,
            bidderId: bidder.id,
        }
    });

    console.log("5. Uploading Bid Document & Extracting Evidence...");
    const document = await prisma.document.create({
        data: {
            bidId: bid.id,
            filename: "financial_statement_2025.pdf",
            fileType: "application/pdf",
            fileSize: 102400,
            hash: "abcd1234efgh5678",
            storageReference: "s3://bucket/doc1.pdf",
            processingStatus: "PROCESSED",
            evidence: {
                create: {
                    type: "MIN_TURNOVER",
                    value: "72000000",
                    numericValue: 72000000,
                    unit: "INR",
                    page: 8,
                    sourceText: "Average annual turnover is 7.2 Cr",
                    confidence: 0.95
                }
            }
        }
    });

    console.log("6. Running Deterministic Compliance Engine...");
    await engine.evaluateBid(bid.id);

    console.log("7. Retrieving Results...");
    const results = await prisma.complianceResult.findMany({
        where: { requirementId: requirement.id },
        include: { requirement: true, evidence: true }
    });

    console.log("=== COMPLIANCE RESULTS ===");
    console.dir(results, { depth: null });
    
    if (results[0]?.status === "COMPLIANT") {
        console.log("✅ VERTICAL SLICE SUCCESS: Bidder correctly evaluated as COMPLIANT based on evidence.");
    } else {
        console.log("❌ VERTICAL SLICE FAILED: Unexpected status.");
    }
}

run()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
