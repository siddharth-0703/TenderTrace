import { PrismaClient } from "@prisma/client";
import { TenderBidMatchingProcessor } from "../../services/compliance-engine/matching/TenderBidMatchingProcessor";

const prisma = new PrismaClient();

async function main() {
    console.log("========================================");
    console.log("REAL DOCUMENT MATCHING");
    console.log("========================================\n");

    // Fetch the most recently uploaded Tender and Bid from DB
    const latestTenderDoc = await prisma.document.findFirst({
        where: { tenderId: { not: null }, processingStatus: "SUCCESS" },
        orderBy: { uploadTimestamp: "desc" }
    });

    const latestBidDoc = await prisma.document.findFirst({
        where: { bidId: { not: null }, processingStatus: "SUCCESS" },
        orderBy: { uploadTimestamp: "desc" }
    });

    if (!latestTenderDoc || !latestBidDoc || !latestTenderDoc.tenderId || !latestBidDoc.bidId) {
        console.error("Could not find a processed TENDER and BID in the DB.");
        console.error("Make sure you ran Phase 8 verification first.");
        return;
    }

    const tenderId = latestTenderDoc.tenderId;
    const bidId = latestBidDoc.bidId;

    console.log(`Using TenderId: ${tenderId}`);
    console.log(`Using BidId:    ${bidId}\n`);

    try {
        const result = await TenderBidMatchingProcessor.processMatch(tenderId, bidId);

        console.log(`Requirements detected: ${result.requirementsProcessed}`);
        console.log(`Evidence detected:     ${result.evidenceFound}\n`);
        
        console.log(`Potential matches:      ${result.matched}`);
        console.log(`Unmatched requirements: ${result.unmatched}`);
        console.log(`Conflicts:              ${result.conflicts}\n`);

        console.log("Compliance:");
        console.log(`  Compliant:             ${result.complianceSummary.compliant}`);
        console.log(`  Non-compliant:         ${result.complianceSummary.nonCompliant}`);
        console.log(`  Insufficient evidence: ${result.complianceSummary.insufficientEvidence}`);
        console.log(`  Conflicting:           ${result.complianceSummary.conflictingEvidence}\n`);
    } catch (err: any) {
        console.error("Execution failed:", err);
    }
}

main();
