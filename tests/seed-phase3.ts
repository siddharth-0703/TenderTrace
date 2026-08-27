import { PrismaClient } from "@prisma/client";
import { RequirementProcessor } from "../services/compliance-engine/engine/RequirementProcessor";
import { ComplianceEngine } from "../services/compliance-engine/engine/ComplianceEngine";

const prisma = new PrismaClient();
const processor = new RequirementProcessor();
const complianceEngine = new ComplianceEngine();

async function run() {
    console.log("Cleaning database...");
    await prisma.complianceResult.deleteMany();
    await prisma.evidence.deleteMany();
    await prisma.document.deleteMany();
    await prisma.bid.deleteMany();
    await prisma.bidder.deleteMany();
    await prisma.tenderRequirement.deleteMany();
    await prisma.tender.deleteMany();

    console.log("1. Creating Synthetic Phase 3 Tender...");
    const tender = await prisma.tender.create({
        data: {
            tenderNumber: "TND-PHASE3-001",
            title: "AI Requirement Processing Test",
            organization: "CPCL",
            status: "READY"
        }
    });

    console.log("\n2. Processing Synthetic Tender Documents through AI Pipeline...");
    
    // Process multiple synthetic documents mimicking the Golden Test Cases
    const docReferences = [
        "turnover_5cr_requirement.pdf", // Golden Case 1
        "experience_requirement.pdf",   // Golden Case 2
        "alternative_requirement.pdf",  // Golden Case 3
        "ambiguous_requirement.pdf",    // Golden Case 5
        "conflict_requirement.pdf"      // Golden Case 6
    ];

    for (let i = 0; i < docReferences.length; i++) {
        const fileRef = docReferences[i];
        
        // Mock a Document record for the tender
        const doc = await prisma.document.create({
            data: {
                tenderId: tender.id,
                filename: fileRef,
                fileType: "application/pdf",
                fileSize: 1024,
                hash: `hash_${i}`,
                storageReference: `s3://bucket/${fileRef}`,
                processingStatus: "PROCESSED"
            }
        });

        // Run processor
        console.log(` -> Processing ${fileRef}...`);
        await processor.processTenderDocument(tender.id, doc.id, fileRef);
    }

    console.log("\n3. Retrieving Processed Requirements & Review Queue...");
    
    const requirements = await prisma.tenderRequirement.findMany({
        where: { tenderId: tender.id }
    });

    for (const req of requirements) {
        console.log(`\n[${req.reviewStatus}] ${req.category} / ${req.type}`);
        console.log(`  Description: ${req.description}`);
        
        // Output rules or conflicts
        if (req.reviewStatus === "CONFLICTING") {
            console.log(`  >>> CONFLICT DETECTED. Officer review required.`);
        } else if (req.reviewStatus === "REVIEW_REQUIRED") {
            console.log(`  >>> LOW CONFIDENCE OR AMBIGUOUS. Officer review required.`);
        } else {
            console.log(`  >>> RULE READY FOR EVALUATION.`);
        }
    }

    console.log("\n4. Simulating Officer Approval for valid requirements...");
    await prisma.tenderRequirement.updateMany({
        where: { tenderId: tender.id, reviewStatus: "EXTRACTED" },
        data: { reviewStatus: "APPROVED" }
    });

    console.log("\n5. Demonstrating Phase 2 Engine integration on an APPROVED requirement...");
    const approvedReq = await prisma.tenderRequirement.findFirst({
        where: { tenderId: tender.id, reviewStatus: "APPROVED", type: "TURNOVER" }
    });

    if (approvedReq) {
        // Create a Bidder that satisfies the extracted requirement
        const bidder = await prisma.bidder.create({ data: { legalName: "AI Compliant Corp" }});
        const bid = await prisma.bid.create({ data: { tenderId: tender.id, bidderId: bidder.id }});
        await prisma.document.create({
            data: {
                bidId: bid.id, filename: "financials.pdf", hash: "hashX",
                fileType: "application/pdf", fileSize: 1024, storageReference: "local/financials.pdf",
                evidence: {
                    create: { type: "minimumTurnover", value: "7.2 Cr", numericValue: 72000000, confidence: 0.99 }
                }
            }
        });

        await complianceEngine.evaluateBid(bid.id);
        const results = await prisma.complianceResult.findMany({ where: { requirementId: approvedReq.id } });
        
        console.log(`\nBid Evaluation against AI-extracted rule [${approvedReq.id}]:`);
        console.log(`Status: ${results[0]?.status}`);
    }

    console.log("\n✅ PHASE 3 INTEGRATION SUCCESS.");
}

run()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
