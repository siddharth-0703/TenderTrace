import express from "express";
import cors from "cors";
import crypto from "crypto";
import multer from "multer";
import path from "path";
import fs from "fs";
import { PrismaClient } from "@prisma/client";
import { PdfExtractionService } from "./services/pdfExtractionService";
import { ComplianceEngine } from "../services/compliance-engine/engine/ComplianceEngine";
import { MockFraudAnalysisService } from "../services/fraud-engine/mock/MockFraudAnalysisService";
import { TenderPackageProcessor } from "../services/compliance-engine/engine/TenderPackageProcessor";
import { BidComplianceProcessor } from "../services/compliance-engine/evidence/BidComplianceProcessor";

const app = express();
app.use(cors());
app.use(express.json());

// Setup Multer for file uploads
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

const prisma = new PrismaClient();
const complianceEngine = new ComplianceEngine();
const fraudEngine = new MockFraudAnalysisService();
const packageProcessor = new TenderPackageProcessor();
const bidProcessor = new BidComplianceProcessor();

// --- DASHBOARD API ---
app.get("/api/dashboard/stats", async (req, res) => {
    try {
        const [tenders, documents, requirements, bids] = await Promise.all([
            prisma.tender.count(),
            prisma.document.count(),
            prisma.tenderRequirement.count(),
            prisma.bid.count()
        ]);
        
        const reviewRequired = await prisma.tenderRequirement.count({
            where: { reviewStatus: "REVIEW_REQUIRED" }
        });

        const conflicting = await prisma.tenderRequirement.count({
            where: { reviewStatus: "CONFLICTING" }
        });

        res.json({
            tenders,
            documents,
            requirements,
            bids,
            reviewRequired,
            conflicting
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// --- TENDER APIs ---
app.get("/api/tenders", async (req, res) => {
    try {
        const tenders = await prisma.tender.findMany({
            include: {
                _count: {
                    select: { documents: true, requirements: true, bids: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(tenders);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/tenders/:id", async (req, res) => {
    try {
        const tender = await prisma.tender.findUnique({
            where: { id: req.params.id },
            include: {
                documents: true,
                requirements: {
                    orderBy: { createdAt: 'asc' }
                },
                bids: {
                    include: { bidder: true }
                }
            }
        });
        if (!tender) return res.status(404).json({ error: "Not found" });
        res.json(tender);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

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

// --- DOCUMENT UPLOAD & PROCESSING ---
app.post("/api/tenders/:id/documents/upload", upload.array('files'), async (req, res) => {
    try {
        const tenderId = req.params.id as string;
        const files = req.files as Express.Multer.File[];
        
        const createdDocs = [];
        for (const file of files) {
            // Generate SHA-256 Hash
            const fileBuffer = require('fs').readFileSync(file.path);
            const hashSum = crypto.createHash('sha256');
            hashSum.update(fileBuffer);
            const sha256 = hashSum.digest('hex');

            // Duplicate detection
            const existingDoc = await prisma.document.findFirst({ where: { hash: sha256, tenderId } });
            if (existingDoc) {
                createdDocs.push({ ...existingDoc, isDuplicate: true });
                continue;
            }

            const doc = await prisma.document.create({
                data: {
                    tenderId,
                    filename: file.originalname,
                    fileType: file.mimetype,
                    fileSize: file.size,
                    hash: sha256,
                    storageReference: file.path,
                    processingStatus: "UPLOADED"
                }
            });
            
            // Start background extraction
            PdfExtractionService.processDocument(doc.id, 'TENDER', tenderId).catch(console.error);
            
            createdDocs.push(doc);
        }
        
        res.status(201).json(createdDocs);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/bids/:id/documents/upload", upload.array('files'), async (req, res) => {
    try {
        const bidId = req.params.id as string;
        const files = req.files as Express.Multer.File[];
        
        const createdDocs = [];
        for (const file of files) {
            const fileBuffer = require('fs').readFileSync(file.path);
            const hashSum = crypto.createHash('sha256');
            hashSum.update(fileBuffer);
            const sha256 = hashSum.digest('hex');

            const existingDoc = await prisma.document.findFirst({ where: { hash: sha256, bidId } });
            if (existingDoc) {
                createdDocs.push({ ...existingDoc, isDuplicate: true });
                continue;
            }

            const doc = await prisma.document.create({
                data: {
                    bidId,
                    filename: file.originalname,
                    fileType: file.mimetype,
                    fileSize: file.size,
                    hash: sha256,
                    storageReference: file.path,
                    processingStatus: "UPLOADED"
                }
            });
            
            // Start background extraction
            PdfExtractionService.processDocument(doc.id, 'BID', bidId).catch(console.error);
            
            createdDocs.push(doc);
        }
        
        res.status(201).json(createdDocs);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/documents/:documentId/text", async (req, res) => {
    try {
        const doc = await prisma.document.findUnique({ where: { id: req.params.documentId } });
        if (!doc) return res.status(404).json({ error: "Not found" });
        
        // This relies on the convenience cache in SQLite. If omitted, we'd read from .log files.
        res.json({
            documentId: doc.id,
            pageCount: doc.pageCount,
            status: doc.processingStatus,
            extractedText: doc.extractedText
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});


app.post("/api/tenders/:id/process-package", async (req, res) => {
    try {
        const tenderId = req.params.id;
        // Fetch all documents for this tender that haven't been fully processed
        const docs = await prisma.document.findMany({
            where: { tenderId, processingStatus: "UPLOADED" }
        });
        
        const docIds = docs.map(d => d.id);
        if (docIds.length === 0) {
            return res.status(400).json({ error: "No documents to process" });
        }

        // Trigger Phase 4 Package Processor
        await packageProcessor.processPackage(tenderId, docIds);
        
        res.json({ message: "Package processing completed successfully." });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// --- REQUIREMENT APIs ---
app.get("/api/tenders/:id/requirements", async (req, res) => {
    try {
        const reqs = await prisma.tenderRequirement.findMany({
            where: { tenderId: req.params.id },
            orderBy: { createdAt: 'asc' }
        });
        res.json(reqs);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.put("/api/requirements/:id/approve", async (req, res) => {
    try {
        const requirement = await prisma.tenderRequirement.update({
            where: { id: req.params.id },
            data: { reviewStatus: "APPROVED" }
        });
        res.json(requirement);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// --- BID APIs ---
app.get("/api/bids", async (req, res) => {
    try {
        const bids = await prisma.bid.findMany({
            include: { bidder: true, tender: true }
        });
        res.json(bids);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/bids/:id", async (req, res) => {
    try {
        const bid = await prisma.bid.findUnique({
            where: { id: req.params.id },
            include: {
                bidder: true,
                documents: {
                    include: { evidence: true }
                },
                tender: {
                    include: { requirements: true }
                }
            }
        });
        if (!bid) return res.status(404).json({ error: "Not found" });
        
        // Also fetch compliance results
        const complianceResults = await prisma.complianceResult.findMany({
            where: { requirement: { tenderId: bid.tenderId } },
            include: { requirement: true, evidence: true }
        });

        res.json({ ...bid, complianceResults });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

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

// --- BID EVIDENCE & COMPLIANCE ORCHESTRATION ---
app.post("/api/bids/:id/process-evidence", async (req, res) => {
    try {
        const bidId = req.params.id;
        await bidProcessor.processBid(bidId);
        res.json({ message: "Evidence processed and compliance evaluated successfully." });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

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
