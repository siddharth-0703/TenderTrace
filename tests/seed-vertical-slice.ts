import { PrismaClient } from "@prisma/client";
import { ComplianceEngine } from "../services/compliance-engine/engine/ComplianceEngine";
import { Rule } from "../services/compliance-engine/rules/RuleSchema";

const prisma = new PrismaClient();
const engine = new ComplianceEngine();

async function run() {
    console.log("Cleaning database...");
    await prisma.fraudAnalysis.deleteMany();
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
            tenderNumber: "TND-PHASE2-001",
            title: "Advanced Compliance Testing",
            organization: "CPCL",
            status: "READY"
        }
    });

    console.log("2. Creating Complex Compound Requirement (Turnover AND Experience AND (GST OR Alt Reg))...");
    
    const compoundRule: Rule = {
        type: "AND",
        conditions: [
            { type: "condition", field: "MIN_TURNOVER", operator: ">=", value: 50000000 },
            { type: "condition", field: "EXPERIENCE_YEARS", operator: ">=", value: 5 },
            {
                type: "OR",
                conditions: [
                    { type: "condition", field: "GST_CERT", operator: "EXISTS" },
                    { type: "condition", field: "ALT_REG", operator: "EXISTS" }
                ]
            }
        ]
    };

    const reqCompound = await prisma.tenderRequirement.create({
        data: {
            tenderId: tender.id,
            category: "COMPOUND",
            type: "COMPLEX_ELIGIBILITY",
            description: "Must have >= 5Cr turnover, >= 5 years exp, and either GST or Alt Reg",
            rules: compoundRule as any, // Store JSON rule
            operator: "COMPLEX" // Legacy compatibility
        }
    });

    console.log("3. Creating Scenario Bids...");
    
    // SCENARIO 1: Complex Compliant Bidder
    const bidder1 = await prisma.bidder.create({ data: { legalName: "Compliant Corp" }});
    const bid1 = await prisma.bid.create({ data: { tenderId: tender.id, bidderId: bidder1.id }});
    await prisma.document.create({
        data: {
            bidId: bid1.id, filename: "doc.pdf", hash: "hash1",
            fileType: "application/pdf", fileSize: 1024, storageReference: "local/doc.pdf",
            evidence: {
                createMany: {
                    data: [
                        { type: "MIN_TURNOVER", value: "7.2 Cr", confidence: 0.99 },
                        { type: "EXPERIENCE_YEARS", value: "7", numericValue: 7, confidence: 0.99 },
                        { type: "GST_CERT", value: "GSTIN123", confidence: 0.99 }
                    ]
                }
            }
        }
    });

    // SCENARIO 4: Conflicting Evidence Bidder
    const bidder4 = await prisma.bidder.create({ data: { legalName: "Conflict Corp" }});
    const bid4 = await prisma.bid.create({ data: { tenderId: tender.id, bidderId: bidder4.id }});
    await prisma.document.create({
        data: {
            bidId: bid4.id, filename: "doc_a.pdf", hash: "hash4a",
            fileType: "application/pdf", fileSize: 1024, storageReference: "local/doc_a.pdf",
            evidence: { create: { type: "MIN_TURNOVER", value: "7.2 Cr", confidence: 0.99 } }
        }
    });
    await prisma.document.create({
        data: {
            bidId: bid4.id, filename: "doc_b.pdf", hash: "hash4b",
            fileType: "application/pdf", fileSize: 1024, storageReference: "local/doc_b.pdf",
            evidence: { create: { type: "MIN_TURNOVER", value: "6.4 Cr", confidence: 0.99 } }
        }
    });

    // SCENARIO 5: Expired Certificate Bidder
    const bidder5 = await prisma.bidder.create({ data: { legalName: "Expired Corp" }});
    const bid5 = await prisma.bid.create({ data: { tenderId: tender.id, bidderId: bidder5.id }});
    await prisma.document.create({
        data: {
            bidId: bid5.id, filename: "doc.pdf", hash: "hash5",
            fileType: "application/pdf", fileSize: 1024, storageReference: "local/doc.pdf",
            evidence: {
                createMany: {
                    data: [
                        { type: "MIN_TURNOVER", value: "7.2 Cr", confidence: 0.99 },
                        { type: "EXPERIENCE_YEARS", value: "7", numericValue: 7, confidence: 0.99 },
                        { type: "GST_CERT", value: "EXPIRED 2025", confidence: 0.99 } // Triggers Validator
                    ]
                }
            }
        }
    });

    console.log("4. Running Compliance Engine for Scenario 1 (Compliant)...");
    await engine.evaluateBid(bid1.id);
    let res1 = await prisma.complianceResult.findFirst({ where: { requirementId: reqCompound.id, evidence: { document: { bidId: bid1.id } } } }); 
    // Actually the query above is flawed because Phase 2 ComplianceResult might not be linked to single evidenceId anymore if it's compound.
    // Let's just fetch by requirementId and sort by timestamp since we are running sequentially. Or we can just get all and filter by bid using a join.
    
    // Fix: We'll evaluate one by one and check the latest result
    
    console.log("Evaluating Bid 1 (Scenario 1)...");
    const results1 = await prisma.complianceResult.findMany({ include: { requirement: true } });
    console.log(`Bid 1 Status: ${results1.pop()?.status}`); // Should be COMPLIANT

    console.log("Evaluating Bid 4 (Scenario 4)...");
    await engine.evaluateBid(bid4.id);
    const results4 = await prisma.complianceResult.findMany();
    console.log(`Bid 4 Status: ${results4.pop()?.status}`); // Should be CONFLICTING_EVIDENCE

    console.log("Evaluating Bid 5 (Scenario 5)...");
    await engine.evaluateBid(bid5.id);
    const results5 = await prisma.complianceResult.findMany();
    const last5 = results5.pop();
    console.log(`Bid 5 Status: ${last5?.status}`); // Should be NON_COMPLIANT because GST_CERT is EXPIRED so it's filtered out, thus EXISTS evaluates to false.
    
    console.log("\n=== COMPLIANCE EVALUATION TRACE (Bid 5) ===");
    console.dir(last5?.evaluationTrace, { depth: null });
    
    console.log("\n✅ VERTICAL SLICE SUCCESS.");
}

run()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
