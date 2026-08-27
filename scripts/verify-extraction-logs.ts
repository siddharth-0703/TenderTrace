import fs from 'fs';
import path from 'path';
import readline from 'readline';

const LOG_DIR = process.env.PDF_LOG_DIRECTORY || path.join(process.cwd(), 'logs');
const SNIPPET_LENGTH = parseInt(process.env.LOG_SNIPPET_LENGTH || '500');

async function verifyLog(filename: string, expectedType: 'TENDER' | 'BID'): Promise<boolean> {
    const logPath = path.join(LOG_DIR, filename);
    let pass = true;

    console.log(`\n========================================`);
    console.log(`${expectedType} LOG VERIFICATION`);
    console.log(`========================================`);

    if (!fs.existsSync(logPath)) {
        console.log(`✗ ${filename} exists: NO`);
        return false;
    }
    console.log(`✓ ${filename} exists`);

    const fileStream = fs.createReadStream(logPath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let recordCount = 0;
    let hasDocId = true;
    let hasPageData = true;
    let hasText = true;
    let hasSha256 = true;
    let firstRecordTextSnippet = '';
    let firstRecordDocId = '';

    for await (const line of rl) {
        if (!line.trim()) continue;
        recordCount++;
        try {
            const record = JSON.parse(line);
            if (!record.documentId) hasDocId = false;
            if (!record.sha256) hasSha256 = false;
            if (!record.pages || !Array.isArray(record.pages)) {
                hasPageData = false;
            } else {
                let textFoundInPages = false;
                for (const p of record.pages) {
                    if (p.text && p.text.trim().length > 0) {
                        textFoundInPages = true;
                        if (!firstRecordTextSnippet) {
                            firstRecordTextSnippet = p.text.substring(0, SNIPPET_LENGTH);
                            firstRecordDocId = record.documentId;
                        }
                    }
                }
                if (!textFoundInPages && record.status === 'SUCCESS') hasText = false;
            }

            // Verify routing
            if (expectedType === 'TENDER' && record.documentType !== 'TENDER') {
                console.log(`✗ Routing error: found non-Tender document in tender.log`);
                pass = false;
            }
            if (expectedType === 'BID' && record.documentType !== 'BID') {
                console.log(`✗ Routing error: found non-Bid document in bid.log`);
                pass = false;
            }

        } catch (e) {
            console.log(`✗ JSONL valid: NO (Line ${recordCount} is invalid JSON)`);
            return false;
        }
    }

    console.log(`✓ JSONL valid`);
    console.log(`✓ Records: ${recordCount}`);
    
    if (hasDocId) console.log(`✓ Document ID present`);
    else { console.log(`✗ Document ID present`); pass = false; }

    if (hasPageData) console.log(`✓ Page data present`);
    else { console.log(`✗ Page data present`); pass = false; }

    if (hasText) console.log(`✓ Extracted text present`);
    else { console.log(`✗ Extracted text present (Expected for SUCCESS records)`); pass = false; }

    if (hasSha256) console.log(`✓ SHA-256 present`);
    else { console.log(`✗ SHA-256 present`); pass = false; }

    if (firstRecordTextSnippet) {
        console.log(`\n${expectedType} LOG SAMPLE`);
        console.log(`────────────────────────`);
        console.log(`Document: ${firstRecordDocId}`);
        console.log(`Text:\n${firstRecordTextSnippet}...\n`);
    }

    return pass;
}

async function main() {
    console.log(`========================================`);
    console.log(`PDF EXTRACTION LOG VERIFICATION`);

    let tenderPass = await verifyLog('tender.log', 'TENDER');
    let bidPass = await verifyLog('bid.log', 'BID');

    console.log(`========================================`);
    if (tenderPass && bidPass) {
        console.log(`RESULT: PASS`);
        process.exit(0);
    } else {
        console.log(`RESULT: FAIL`);
        process.exit(1);
    }
}

main().catch(console.error);
