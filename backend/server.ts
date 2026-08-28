import "dotenv/config";
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

export class ActivityLogger {
    static async log(data: {
        tenderId?: string | null;
        bidId?: string | null;
        documentId?: string | null;
        type: string;
        message: string;
        metadata?: any;
    }) {
        try {
            await prisma.activityLog.create({
                data: {
                    tenderId: data.tenderId,
                    bidId: data.bidId,
                    documentId: data.documentId,
                    type: data.type,
                    message: data.message,
                    metadata: data.metadata ? JSON.stringify(data.metadata) : null,
                }
            });
        } catch (error) {
            console.error("Failed to log activity:", error);
        }
    }
}
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

// --- Helper: Compute dynamic tender status ---
function computeTenderStatus(tender: any): string {
    const bids = tender.bids || [];
    const reqCount = tender.requirements?.length ?? tender._count?.requirements ?? 0;
    const docCount = tender.documents?.length ?? tender._count?.documents ?? 0;

    if (bids.length > 0) {
        const allDecided = bids.every((b: any) => b.status === 'APPROVED' || b.status === 'REJECTED' || b.status === 'UNDER_REVIEW');
        const anyApproved = bids.some((b: any) => b.status === 'APPROVED');
        const allRejected = bids.every((b: any) => b.status === 'REJECTED');

        if (allRejected) return "EVALUATED";
        if (anyApproved) return "AWARD_PENDING";
        if (allDecided) return "EVALUATED";
        return "UNDER_EVALUATION";
    }

    if (reqCount > 0) {
        return "READY";
    }

    if (docCount > 0) {
        return "UNDER_EVALUATION";
    }

    return tender.status || "DRAFT";
}

// --- TENDER APIs ---
app.get("/api/tenders", async (req, res) => {
    try {
        const tenders = await prisma.tender.findMany({
            include: {
                _count: {
                    select: { documents: true, requirements: true, bids: true }
                },
                bids: {
                    select: { id: true, status: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const formatted = tenders.map(t => ({
            ...t,
            processingStatus: computeTenderStatus(t),
            status: computeTenderStatus(t)
        }));

        res.json(formatted);
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

        const dynamicStatus = computeTenderStatus(tender);
        res.json({
            ...tender,
            processingStatus: dynamicStatus,
            status: dynamicStatus
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/tenders", async (req, res) => {
    try {
        const tender = await prisma.tender.create({
            data: req.body
        });
        
        await ActivityLogger.log({
            tenderId: tender.id,
            type: "TENDER_CREATED",
            message: `Tender created: ${tender.title}`
        });

        res.status(201).json(tender);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

app.delete("/api/tenders/:id", async (req, res) => {
    try {
        const tenderId = req.params.id;
        const tender = await prisma.tender.findUnique({
            where: { id: tenderId },
            include: {
                documents: true,
                requirements: true,
                bids: { include: { bidder: true, documents: true } }
            }
        });

        if (!tender) {
            return res.status(404).json({ error: "Tender not found" });
        }

        // 1. Record immutable audit log entry BEFORE deletion
        await ActivityLogger.log({
            tenderId: null,
            type: "TENDER_DELETED",
            message: `Tender deleted: "${tender.title}" (${tender.tenderNumber || tender.id.substring(0, 8)}) [Dept: ${tender.organization}]`,
            metadata: {
                tenderId: tender.id,
                title: tender.title,
                tenderNumber: tender.tenderNumber,
                organization: tender.organization,
                description: tender.description,
                deletedAt: new Date().toISOString(),
                stats: {
                    documentsCount: tender.documents.length,
                    requirementsCount: tender.requirements.length,
                    bidsCount: tender.bids.length,
                    bidders: tender.bids.map(b => b.bidder?.legalName || b.bidderId)
                }
            }
        });

        // 2. Unlink existing activity logs so previous history is preserved without FK violations
        await prisma.activityLog.updateMany({
            where: { tenderId: tenderId },
            data: { tenderId: null }
        });

        const reqIds = tender.requirements.map(r => r.id);
        const bidIds = tender.bids.map(b => b.id);
        const tenderDocIds = tender.documents.map(d => d.id);
        const bidDocIds = tender.bids.flatMap(b => b.documents.map(d => d.id));
        const allDocIds = [...tenderDocIds, ...bidDocIds];

        if (reqIds.length > 0) {
            await prisma.requirementEvidenceMatch.deleteMany({
                where: { requirementId: { in: reqIds } }
            });
            await prisma.complianceResult.deleteMany({
                where: { requirementId: { in: reqIds } }
            });
        }

        if (allDocIds.length > 0) {
            await prisma.evidence.deleteMany({
                where: { documentId: { in: allDocIds } }
            });
        }

        if (reqIds.length > 0) {
            await prisma.tenderRequirement.deleteMany({
                where: { id: { in: reqIds } }
            });
        }

        if (allDocIds.length > 0) {
            await prisma.document.deleteMany({
                where: { id: { in: allDocIds } }
            });
        }

        if (bidIds.length > 0) {
            await prisma.activityLog.updateMany({
                where: { bidId: { in: bidIds } },
                data: { bidId: null }
            });
            await prisma.bid.deleteMany({
                where: { id: { in: bidIds } }
            });
        }

        await prisma.tender.delete({
            where: { id: tenderId }
        });

        res.json({ success: true, message: "Tender deleted successfully and recorded in audit trail." });
    } catch (err: any) {
        console.error("Failed to delete tender:", err);
        res.status(500).json({ error: err.message });
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
            
            await ActivityLogger.log({
                tenderId,
                documentId: doc.id,
                type: "DOCUMENT_UPLOADED",
                message: `Tender document uploaded: ${file.originalname}`
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
            
            await ActivityLogger.log({
                bidId,
                documentId: doc.id,
                type: "BID_DOCUMENT_UPLOADED",
                message: `Bid document uploaded: ${file.originalname}`
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
        // Fetch all documents for this tender
        const docs = await prisma.document.findMany({
            where: { tenderId }
        });
        
        if (docs.length === 0) {
            return res.status(400).json({ error: "No documents found for this tender package." });
        }

        // 1. Ensure any document still in UPLOADED or EXTRACTING is fully processed first
        for (const doc of docs) {
            if (doc.processingStatus !== "SUCCESS" && doc.processingStatus !== "PROCESSED") {
                try {
                    await PdfExtractionService.processDocument(doc.id, 'TENDER', tenderId);
                } catch (e) {
                    console.error(`Document extraction error for ${doc.id}:`, e);
                }
            }
        }

        const docIds = docs.map(d => d.id);

        await ActivityLogger.log({
            tenderId,
            type: "TENDER_PACKAGE_PROCESSING_STARTED",
            message: `Started processing package with ${docIds.length} documents`
        });

        // Trigger Phase 4 Package Processor
        await packageProcessor.processPackage(tenderId, docIds);

        // Update tender status
        await prisma.tender.update({
            where: { id: tenderId },
            data: { status: "READY" }
        });
        
        await ActivityLogger.log({
            tenderId,
            type: "TENDER_PACKAGE_PROCESSED",
            message: `Tender package processed successfully`
        });

        const requirements = await prisma.tenderRequirement.findMany({
            where: { tenderId },
            orderBy: { createdAt: 'asc' }
        });

        res.json({ message: "Package processing completed successfully.", count: requirements.length, requirements });
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
        
        await ActivityLogger.log({
            tenderId: requirement.tenderId,
            type: "REQUIREMENT_APPROVED",
            message: `Requirement approved: ${requirement.type}`
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
        const { name, legalName, email, phone, contactInformation, registrationInfo, businessInformation } = req.body;
        const contact = contactInformation || (email || phone ? JSON.stringify({ email, phone }) : null);
        const bidder = await prisma.bidder.create({
            data: {
                legalName: legalName || name || "Bidder " + Date.now().toString().slice(-4),
                contactInformation: contact,
                registrationInfo: registrationInfo || null,
                businessInformation: businessInformation || null
            }
        });
        res.status(201).json({ ...bidder, name: bidder.legalName });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

app.post("/api/bids", async (req, res) => {
    try {
        const bid = await prisma.bid.create({
            data: req.body
        });

        await ActivityLogger.log({
            bidId: bid.id,
            tenderId: bid.tenderId,
            type: "BID_CREATED",
            message: `Bid created for tender`
        });

        res.status(201).json(bid);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

app.post("/api/bids/:id/decision", async (req, res) => {
    try {
        const { decision, comment } = req.body;
        const bidId = req.params.id;

        const statusMap: Record<string, string> = {
            APPROVED: "APPROVED",
            REJECTED: "REJECTED",
            CLARIFICATION_REQUESTED: "UNDER_REVIEW"
        };

        const newStatus = statusMap[decision] || decision || "REVIEWED";

        const bid = await prisma.bid.update({
            where: { id: bidId },
            data: { status: newStatus },
            include: { bidder: true, tender: true }
        });

        await ActivityLogger.log({
            bidId,
            tenderId: bid.tenderId,
            type: `OFFICER_${decision}`,
            message: `Officer recorded decision: ${decision} for bid ${bid.id.substring(0, 8)} (${bid.bidder?.legalName || 'Bidder'})${comment ? ` - "${comment}"` : ''}`,
            metadata: {
                decision,
                comment,
                newStatus,
                decidedAt: new Date().toISOString()
            }
        });

        res.json({ success: true, bid });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// --- BID EVIDENCE & COMPLIANCE ORCHESTRATION ---
app.post("/api/bids/:id/process-evidence", async (req, res) => {
    try {
        const bidId = req.params.id;
        const bid = await prisma.bid.findUnique({
            where: { id: bidId },
            include: { documents: true }
        });
        if (bid) {
            for (const doc of bid.documents) {
                if (doc.processingStatus !== 'SUCCESS' && doc.processingStatus !== 'PROCESSED') {
                    try {
                        await PdfExtractionService.processDocument(doc.id, 'BID', bidId);
                    } catch (e) {
                        console.error(`Bid doc extraction error for ${doc.id}:`, e);
                    }
                }
            }
        }
        await bidProcessor.processBid(bidId);
        res.json({ message: "Evidence processed and compliance evaluated successfully." });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/bids/:id/analyze", async (req, res) => {
    try {
        const bidId = req.params.id;
        
        await ActivityLogger.log({
            bidId,
            type: "COMPLIANCE_ANALYSIS_STARTED",
            message: `Compliance analysis started`
        });

        // 1. Run Compliance
        const complianceResult = await complianceEngine.evaluateBid(bidId);
        
        // 2. Run Fraud
        const fraudResult = await fraudEngine.analyze({ bidId, tenderId: "TBD" });

        await ActivityLogger.log({
            bidId,
            type: "COMPLIANCE_ANALYSIS_COMPLETED",
            message: `Compliance analysis completed`
        });

        res.json({
            message: "Analysis Complete",
            compliance: complianceResult,
            fraud: fraudResult
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// --- PHASE 9: MATCHING APIs ---
import { TenderBidMatchingProcessor } from "../services/compliance-engine/matching/TenderBidMatchingProcessor";

app.post("/api/tenders/:tenderId/match-bid/:bidId", async (req, res) => {
    try {
        const { tenderId, bidId } = req.params;

        await ActivityLogger.log({
            tenderId,
            bidId,
            type: "BID_MATCH_STARTED",
            message: `Bid matching started against tender`
        });

        const result = await TenderBidMatchingProcessor.processMatch(tenderId, bidId);
        
        await ActivityLogger.log({
            tenderId,
            bidId,
            type: "BID_MATCH_COMPLETED",
            message: `Bid matched against tender`
        });

        res.json(result);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/tenders/:tenderId/bids/:bidId/matches", async (req, res) => {
    try {
        // Fetch Tender Requirements
        const requirements = await prisma.tenderRequirement.findMany({
            where: { tenderId: req.params.tenderId },
            include: {
                matches: {
                    include: { evidence: true }
                },
                results: {
                    where: { evidence: { document: { bidId: req.params.bidId } } }
                }
            }
        });
        res.json(requirements);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// --- ACTIVITY APIs ---
app.get("/api/activity", async (req, res) => {
    try {
        const activities = await prisma.activityLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: { tender: true, bid: { include: { bidder: true } } }
        });
        res.json(activities);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/tenders/:tenderId/activity", async (req, res) => {
    try {
        const activities = await prisma.activityLog.findMany({
            where: { tenderId: req.params.tenderId },
            orderBy: { createdAt: 'desc' },
            include: { tender: true, bid: { include: { bidder: true } } }
        });
        res.json(activities);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/bids/:bidId/activity", async (req, res) => {
    try {
        const activities = await prisma.activityLog.findMany({
            where: { bidId: req.params.bidId },
            orderBy: { createdAt: 'desc' },
            include: { tender: true, bid: { include: { bidder: true } } }
        });
        res.json(activities);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
