import { PrismaClient } from "@prisma/client";
import { TenderPackageProcessor } from "../services/compliance-engine/engine/TenderPackageProcessor";
import { BidComplianceProcessor } from "../services/compliance-engine/evidence/BidComplianceProcessor";

const prisma = new PrismaClient();
const packageProcessor = new TenderPackageProcessor();
const bidProcessor = new BidComplianceProcessor();

async function run() {
    console.log("Cleaning database...");
    await prisma.complianceResult.deleteMany();
    await prisma.evidence.deleteMany();
    await prisma.document.deleteMany();
    await prisma.bid.deleteMany();
    await prisma.bidder.deleteMany();
    await prisma.tenderRequirement.updateMany({ data: { supersededById: null, supersedesId: null }});
    await prisma.tenderRequirement.deleteMany();
    await prisma.tender.deleteMany();

    // ==========================================
    // PHASE 4: TENDER PACKAGE PROCESSING
    // ==========================================
    console.log("\n[PHASE 4] Creating Tender Package...");
    const tender = await prisma.tender.create({
        data: {
            tenderNumber: "TND-E2E-001",
            title: "Multi-Document & Evidence Test",
            organization: "CPCL",
            status: "READY"
        }
    });

    const docIds = [];
    const tenderDocs = [
        "main-tender.pdf",            // Generates 5Cr rule
        "corrigendum.pdf",            // Generates 10Cr rule (modifies turnover)
    ];

    for (const filename of tenderDocs) {
        const doc = await prisma.document.create({
            data: {
                tenderId: tender.id, filename, fileType: "application/pdf",
                fileSize: 1024, hash: filename, storageReference: filename
            }
        });
        docIds.push(doc.id);
    }

    await packageProcessor.processPackage(tender.id, docIds);

    // Approve the extracted rules so they can be evaluated
    console.log("\n[PHASE 4] Approving Extracted Active Requirements...");
    await prisma.tenderRequirement.updateMany({
        where: { tenderId: tender.id, status: "ACTIVE" },
        data: { reviewStatus: "APPROVED" }
    });

    // ==========================================
    // PHASE 5: BIDDER EVIDENCE PROCESSING
    // ==========================================
    console.log("\n[PHASE 5] Simulating Bidder Submission...");
    const bidder = await prisma.bidder.create({ data: { legalName: "Synthetic Bidder Corp" }});
    const bid = await prisma.bid.create({ data: { tenderId: tender.id, bidderId: bidder.id }});

    const bidDocs = [
        "ca-turnover-certificate.pdf", // Evidence: 6.2 Cr
        "gst-certificate.pdf"          // Evidence: ACTIVE
    ];

    for (const filename of bidDocs) {
        await prisma.document.create({
            data: {
                bidId: bid.id, filename, fileType: "application/pdf",
                fileSize: 1024, hash: filename, storageReference: filename
            }
        });
    }

    await bidProcessor.processBid(bid.id);
    
    console.log("\n✅ E2E PHASE 4 & 5 COMPLETE.");
}

run()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
