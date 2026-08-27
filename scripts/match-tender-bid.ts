import { TenderBidMatchingProcessor } from "../backend/services/compliance-engine/matching/TenderBidMatchingProcessor";

const tenderId = process.argv[2];
const bidId = process.argv[3];

if (!tenderId || !bidId) {
    console.error("Usage: npm run match-tender-bid -- <tenderId> <bidId>");
    process.exit(1);
}

async function main() {
    console.log("========================================");
    console.log("TENDER → BID MATCHING");
    console.log("========================================\n");

    try {
        const result = await TenderBidMatchingProcessor.processMatch(tenderId, bidId);

        console.log(`\nTender: ${result.tenderId}`);
        console.log(`Bid:    ${result.bidId}\n`);
        
        console.log(`Requirements detected: ${result.requirementsProcessed}`);
        console.log(`Evidence detected:     ${result.evidenceFound}\n`);
        
        console.log(`Matched:               ${result.matched}`);
        console.log(`Unmatched:             ${result.unmatched}`);
        console.log(`Conflicts:             ${result.conflicts}\n`);

        console.log("----------------------------------------");
        console.log(JSON.stringify(result.complianceSummary, null, 2));

    } catch (err: any) {
        console.error("Error executing match:", err.message);
    }
}

main();
