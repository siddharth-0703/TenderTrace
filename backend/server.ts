import express from "express";
import { PrismaClient } from "@prisma/client";
import { ComplianceEngine } from "../services/compliance-engine/engine/ComplianceEngine";
import { MockFraudAnalysisService } from "../services/fraud-engine/mock/MockFraudAnalysisService";

const app = express();
app.use(express.json());

const prisma = new PrismaClient();
const complianceEngine = new ComplianceEngine();
const fraudEngine = new MockFraudAnalysisService();

// --- TENDER APIs ---
app.post("/api/tenders", async (req, res) => {
    try {
        const tender = await prisma.tender.create({
            data: req.body
        });
        res.status(201).json(tender);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

app.post("/api/tenders/:id/requirements", async (req, res) => {
    try {
        const reqData = req.body;
        const requirement = await prisma.tenderRequirement.create({
            data: {
                ...reqData,
                tenderId: req.params.id
            }
        });
        res.status(201).json(requirement);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

// --- BID APIs ---
app.post("/api/bidders", async (req, res) => {
    try {
        const bidder = await prisma.bidder.create({
            data: req.body
        });
        res.status(201).json(bidder);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

app.post("/api/bids", async (req, res) => {
    try {
        const bid = await prisma.bid.create({
            data: req.body
        });
        res.status(201).json(bid);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

// --- ANALYSIS ORCHESTRATION ---
app.post("/api/bids/:id/analyze", async (req, res) => {
    try {
        const bidId = req.params.id;
        
        // 1. Run Compliance
        const complianceResult = await complianceEngine.evaluateBid(bidId);
        
        // 2. Run Fraud
        const fraudResult = await fraudEngine.analyze({ bidId, tenderId: "TBD" });

        res.json({
            message: "Analysis Complete",
            compliance: complianceResult,
            fraud: fraudResult
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
