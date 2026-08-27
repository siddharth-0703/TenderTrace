import { BidComplianceProcessor } from "../services/compliance-engine/evidence/BidComplianceProcessor";

async function run() {
    const args = process.argv.slice(2);
    const bidId = args[0];

    if (!bidId) {
        console.error("Usage: npm run process-bid -- <BID_ID>");
        process.exit(1);
    }

    const processor = new BidComplianceProcessor();
    await processor.processBid(bidId);
}

run().catch(console.error);
