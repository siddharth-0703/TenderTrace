import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';

const BASE_URL = 'http://localhost:3000/api';

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runE2E() {
    console.log('==============================================');
    console.log('🚀 END-TO-END TENDER & BID WORKSPACE TEST');
    console.log('==============================================\n');

    const tenderPdfPath = 'C:\\Users\\siddh\\Desktop\\HACKATHON\\SIH\\PROJECT\\TENDER.pdf';
    const bidPdfPath = 'C:\\Users\\siddh\\Desktop\\HACKATHON\\SIH\\PROJECT\\BID.pdf';

    if (!fs.existsSync(tenderPdfPath) || !fs.existsSync(bidPdfPath)) {
        console.error('❌ Missing TENDER.pdf or BID.pdf at the specified paths.');
        process.exit(1);
    }

    // Step 1: Create Tender
    console.log('1️⃣ Creating Tender...');
    const tenderRes = await axios.post(`${BASE_URL}/tenders`, {
        title: 'Procurement of High-Grade Reagents & Chemical Solutions',
        tenderNumber: `TND-${Date.now().toString().slice(-6)}`,
        organization: 'Maharashtra Medical Goods Procurement Authority (MMGPA)',
        description: 'Annual rate contract for diagnostic and laboratory chemicals.'
    });
    const tender = tenderRes.data;
    console.log(`✅ Tender Created: ${tender.title} [ID: ${tender.id}, No: ${tender.tenderNumber}]\n`);

    // Step 2: Upload Tender PDF
    console.log('2️⃣ Uploading TENDER.pdf...');
    const tenderForm = new FormData();
    tenderForm.append('files', fs.createReadStream(tenderPdfPath), { filename: 'TENDER.pdf' });
    const tenderUploadRes = await axios.post(
        `${BASE_URL}/tenders/${tender.id}/documents/upload`,
        tenderForm,
        { headers: tenderForm.getHeaders() }
    );
    console.log(`✅ TENDER.pdf Uploaded: ${tenderUploadRes.data.length} document(s) registered.`);
    
    // Wait for text extraction
    console.log('⏳ Waiting 3s for background text extraction...');
    await sleep(3000);

    // Step 3: Process Tender Package (Extract Requirements)
    console.log('\n3️⃣ Processing Tender Package (Requirement Extraction)...');
    try {
        const processRes = await axios.post(`${BASE_URL}/tenders/${tender.id}/process-package`);
        console.log(`✅ Package Processed: ${processRes.data.message}`);
    } catch (err: any) {
        console.error(`❌ Error processing tender package:`, err.response?.data || err.message);
    }

    // Check Extracted Requirements
    const reqsRes = await axios.get(`${BASE_URL}/tenders/${tender.id}/requirements`);
    console.log(`📋 Total Extracted Requirements: ${reqsRes.data.length}`);
    reqsRes.data.slice(0, 5).forEach((r: any, idx: number) => {
        console.log(`   [${idx + 1}] ${r.category} | ${r.type}: ${r.description || r.rules} (${r.reviewStatus})`);
    });

    // Step 4: Create Bidder and Bid
    console.log('\n4️⃣ Registering Bidder and Creating Bid...');
    const bidderRes = await axios.post(`${BASE_URL}/bidders`, {
        name: 'Apex Diagnostic Solutions Pvt Ltd',
        email: 'procurement@apexdiag.in',
        phone: '+91-9876543210'
    });
    const bidder = bidderRes.data;
    console.log(`✅ Bidder Registered: ${bidder.name} [ID: ${bidder.id}]`);

    const bidRes = await axios.post(`${BASE_URL}/bids`, {
        tenderId: tender.id,
        bidderId: bidder.id,
        status: 'SUBMITTED'
    });
    const bid = bidRes.data;
    console.log(`✅ Bid Created: [ID: ${bid.id}]\n`);

    // Step 5: Upload Bid PDF
    console.log('5️⃣ Uploading BID.pdf...');
    const bidForm = new FormData();
    bidForm.append('files', fs.createReadStream(bidPdfPath), { filename: 'BID.pdf' });
    const bidUploadRes = await axios.post(
        `${BASE_URL}/bids/${bid.id}/documents/upload`,
        bidForm,
        { headers: bidForm.getHeaders() }
    );
    console.log(`✅ BID.pdf Uploaded: ${bidUploadRes.data.length} document(s) registered.`);

    // Wait for text extraction
    console.log('⏳ Waiting 3s for background text extraction...');
    await sleep(3000);

    // Step 6: Match Bid Against Tender (Compliance Engine)
    console.log('\n6️⃣ Running Compliance Matching & Evaluation...');
    try {
        const matchRes = await axios.post(`${BASE_URL}/tenders/${tender.id}/match-bid/${bid.id}`);
        console.log(`✅ Compliance Evaluation Complete! Summary:`);
        console.log(`   - Requirements Processed: ${matchRes.data.requirementsProcessed}`);
        console.log(`   - Evidence Items Found:    ${matchRes.data.evidenceFound}`);
        console.log(`   - Direct Matches:          ${matchRes.data.matched}`);
        console.log(`   - Unmatched:               ${matchRes.data.unmatched}`);
        console.log(`   - Conflicts Detected:      ${matchRes.data.conflicts}`);
        console.log(`   - Compliance Breakdown:`, matchRes.data.complianceSummary);
    } catch (err: any) {
        console.error(`❌ Error during compliance match:`, err.response?.data || err.message);
    }

    console.log('\n==============================================');
    console.log('🎉 TEST COMPLETE - Check UI at http://localhost:5173');
    console.log(`Direct Link to Tender: http://localhost:5173/tenders/${tender.id}`);
    console.log(`Direct Link to Bid:    http://localhost:5173/bids/${bid.id}`);
    console.log('==============================================\n');
}

runE2E().catch(console.error);
