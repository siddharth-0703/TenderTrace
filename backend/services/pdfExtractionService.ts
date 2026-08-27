import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const PYTHON_SCRIPT_PATH = path.join(process.cwd(), 'services', 'pdf-extractor', 'extractor.py');
const MAX_CONCURRENT_EXTRACTIONS = parseInt(process.env.PDF_MAX_CONCURRENT_EXTRACTIONS || '5');

let currentExtractions = 0;

export class PdfExtractionService {
    
    static async processDocument(documentId: string, documentType: 'TENDER' | 'BID', associatedId: string) {
        if (currentExtractions >= MAX_CONCURRENT_EXTRACTIONS) {
            // In a real system, you'd queue this. For now, we reject.
            throw new Error('Too many concurrent extractions');
        }

        currentExtractions++;
        try {
            const doc = await prisma.document.findUnique({ where: { id: documentId } });
            if (!doc) throw new Error("Document not found");

            await prisma.document.update({
                where: { id: documentId },
                data: { 
                    processingStatus: 'EXTRACTING',
                    extractionStartedAt: new Date()
                }
            });

            // Invoke Python
            const pythonExecutable = process.env.PYTHON_EXECUTABLE || (process.platform === 'win32' ? 'python' : 'python3');
            
            const result = await new Promise<{status: string, pages: any[], pageCount: number, error?: string}>((resolve, reject) => {
                execFile(pythonExecutable, [PYTHON_SCRIPT_PATH, doc.storageReference], (error, stdout, stderr) => {
                    if (error && !stdout) {
                        return reject(new Error(`Process execution failed: ${error.message}`));
                    }
                    try {
                        const parsed = JSON.parse(stdout);
                        resolve(parsed);
                    } catch (parseError) {
                        reject(new Error(`Failed to parse Python output. Error: ${error?.message || ''}. Stdout: ${stdout}. Stderr: ${stderr}`));
                    }
                });
            });

            if (result.status === 'FAILED') {
                await this._markFailed(documentId, result.error || 'Unknown extraction error');
                return;
            }

            // Append to log
            const logEntry = {
                documentId: doc.id,
                documentType,
                filename: doc.filename,
                [documentType === 'TENDER' ? 'tenderId' : 'bidId']: associatedId,
                sha256: doc.hash,
                pageCount: result.pageCount,
                extractionStatus: result.status,
                pages: result.pages,
                timestamp: new Date().toISOString()
            };

            const logFile = documentType === 'TENDER' ? 'tender.log' : 'bid.log';
            const logDir = process.env.PDF_LOG_DIRECTORY || path.join(process.cwd(), 'logs');
            try {
                await fs.mkdir(logDir, { recursive: true });
            } catch (e) {
                // Ignore if it exists
            }
            const logPath = path.join(logDir, logFile);
            await fs.appendFile(logPath, JSON.stringify(logEntry) + '\n', 'utf8');

            // Update database
            await prisma.document.update({
                where: { id: documentId },
                data: {
                    processingStatus: result.status, // SUCCESS, PARTIAL, OCR_REQUIRED
                    pageCount: result.pageCount,
                    extractionCompletedAt: new Date(),
                    extractedText: result.pages.map(p => p.text).join('\n\n') // Optional convenience cache
                }
            });

        } catch (error: any) {
            await this._markFailed(documentId, error.message);
        } finally {
            currentExtractions--;
        }
    }

    private static async _markFailed(documentId: string, errorMsg: string) {
        await prisma.document.update({
            where: { id: documentId },
            data: {
                processingStatus: 'FAILED',
                extractionError: errorMsg,
                extractionCompletedAt: new Date()
            }
        });
    }
}
