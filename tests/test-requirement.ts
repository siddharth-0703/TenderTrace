import { MockAIProvider } from "../services/ai/providers/MockAIProvider";

async function run() {
    const args = process.argv.slice(2);
    const text = args[0] || "Bidder must have turnover of at least ₹5 crore";

    console.log(`\nAnalyzing Requirement Text: "${text}"\n`);

    const ai = new MockAIProvider();
    const result = await ai.extractRequirements({
        documentId: "TEST-DOC",
        section: "TEST-SECTION",
        pageNumber: 1,
        text: text
    });

    console.log("=== STRUCTURED JSON EXTRACTED ===");
    console.dir(result, { depth: null });
}

run().catch(console.error);
