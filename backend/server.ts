import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { ComplianceEngine } from "../services/compliance-engine/engine/ComplianceEngine";
import { FraudEngine } from "../services/fraud-engine/FraudEngine";

const app = express();
app.use(cors());
app.use(express.json());

const prisma = new PrismaClient();
const complianceEngine = new ComplianceEngine();
const fraudEngine = new FraudEngine();

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

// --- GET ALL BIDS (with bidder, tender, fraudAnalyses for the frontend overview table) ---
app.get("/api/bids", async (req, res) => {
    try {
        const bids = await prisma.bid.findMany({
            include: {
                bidder: true,
                tender: true,
                fraudAnalyses: {
                    orderBy: { createdAt: "desc" },
                    take: 1
                }
            },
            orderBy: { submittedAt: "desc" }
        });
        res.json(bids);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// --- GET LATEST FRAUD ANALYSIS FOR A BID ---
app.get("/api/bids/:id/fraud-analysis", async (req, res) => {
    try {
        const analysis = await prisma.fraudAnalysis.findFirst({
            where: { bidId: req.params.id },
            orderBy: { createdAt: "desc" }
        });
        if (!analysis) return res.status(404).json({ error: "No fraud analysis found for this bid." });
        res.json(analysis);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// --- GET ALL FRAUD ANALYSES ---
app.get("/api/fraud-analyses", async (req, res) => {
    try {
        const analyses = await prisma.fraudAnalysis.findMany({
            include: {
                bid: {
                    include: { bidder: true, tender: true }
                }
            },
            orderBy: { createdAt: "desc" }
        });
        res.json(analyses);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
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
        const fraudResult = await fraudEngine.analyze({ bidId, tenderId: bidId }); // tenderId resolved inside FraudEngine via DB

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
