import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BASE_URL = 'http://localhost:3000/api';

async function uploadDocument(endpoint: string, filePath: string) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }
    const form = new FormData();
    form.append('files', fs.createReadStream(filePath));

    const response = await axios.post(`${BASE_URL}${endpoint}`, form, {
        headers: {
            ...form.getHeaders()
        }
    });
    return response.data;
}

async function pollDocumentStatus(documentId: string, maxAttempts = 10) {
    for (let i = 0; i < maxAttempts; i++) {
        const response = await axios.get(`${BASE_URL}/documents/${documentId}/text`);
        const doc = response.data;
        if (doc.status === 'SUCCESS' || doc.status === 'PARTIAL' || doc.status === 'OCR_REQUIRED' || doc.status === 'FAILED') {
            return doc;
        }
        console.log(`Extraction status for ${documentId}: ${doc.status}... waiting.`);
        await new Promise(r => setTimeout(r, 2000));
    }
    throw new Error('Extraction timeout');
}

async function main() {
    const tenderPdf = process.argv[2];
    const bidPdf = process.argv[3];

    if (!tenderPdf || !bidPdf) {
        console.error('Usage: ts-node test-extraction.ts <tender_pdf_path> <bid_pdf_path>');
        process.exit(1);
    }

    try {
        console.log('\n--- SETUP ---');
        // Create dummy tender
        const tender = await prisma.tender.create({
            data: {
                tenderNumber: `TND-VERIFY-${Date.now()}`,
                title: 'Verify Tender',
                organization: 'Verification Org'
            }
        });
        
        // Create dummy bidder and bid
        const bidder = await prisma.bidder.create({
            data: { legalName: 'Verify Bidder' }
        });
        const bid = await prisma.bid.create({
            data: { tenderId: tender.id, bidderId: bidder.id }
        });

        console.log('\n--- TENDER UPLOAD ---');
        const tenderDocs = await uploadDocument(`/tenders/${tender.id}/documents/upload`, tenderPdf);
        const tenderDocId = tenderDocs[0].id;
        console.log(`Uploaded Tender PDF. Document ID: ${tenderDocId}`);
        const tenderResult = await pollDocumentStatus(tenderDocId);
        console.log(`Tender Extraction Status: ${tenderResult.status}`);
        
        console.log('\n--- TENDER DUPLICATE CHECK ---');
        const tenderDuplicateDocs = await uploadDocument(`/tenders/${tender.id}/documents/upload`, tenderPdf);
        if (tenderDuplicateDocs[0].isDuplicate) {
            console.log('✓ Duplicate detection worked for Tender.');
        } else {
            console.error('✗ Duplicate detection failed for Tender.');
        }

        console.log('\n--- BID UPLOAD ---');
        const bidDocs = await uploadDocument(`/bids/${bid.id}/documents/upload`, bidPdf);
        const bidDocId = bidDocs[0].id;
        console.log(`Uploaded Bid PDF. Document ID: ${bidDocId}`);
        const bidResult = await pollDocumentStatus(bidDocId);
        console.log(`Bid Extraction Status: ${bidResult.status}`);

        console.log('\n========================================');
        console.log('API END-TO-END TEST COMPLETE. PLEASE RUN verify-extraction-logs NOW.');
        console.log('========================================');

    } catch (e: any) {
        console.error('Test failed:', e.response?.data || e.message);
        process.exit(1);
    }
}

main();
