import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface BidTextPage {
  bidId: string;
  documentId: string;
  pageNumber: number;
  text: string;
  characterCount: number;
  wordCount: number;
  filename?: string;
}

export class BidTextLoader {
    static async loadBidText(bidId: string, logDirectory: string = 'logs'): Promise<BidTextPage[]> {
        const pages: BidTextPage[] = [];
        const logPath = path.join(process.cwd(), logDirectory, 'bid.log');
        
        if (fs.existsSync(logPath)) {
            const fileStream = fs.createReadStream(logPath);
            const rl = readline.createInterface({
                input: fileStream,
                crlfDelay: Infinity
            });

            for await (const line of rl) {
                if (!line.trim()) continue;
                try {
                    const record = JSON.parse(line);
                    if (record.bidId === bidId && (record.extractionStatus === 'SUCCESS' || record.extractionStatus === 'PARTIAL') && Array.isArray(record.pages)) {
                        for (const p of record.pages) {
                            if (p.text && p.text.trim().length > 0) {
                                pages.push({
                                    bidId,
                                    documentId: record.documentId,
                                    pageNumber: p.pageNumber,
                                    text: p.text,
                                    characterCount: p.characterCount || 0,
                                    wordCount: p.wordCount || 0,
                                    filename: record.filename
                                });
                            }
                        }
                    }
                } catch (err) {
                    continue;
                }
            }
        }

        // Fallback: If no pages found from log file, load from SQLite Document table
        if (pages.length === 0) {
            const docs = await prisma.document.findMany({
                where: { bidId, extractedText: { not: null } }
            });
            for (const doc of docs) {
                if (doc.extractedText && doc.extractedText.trim().length > 0) {
                    const textChunks = doc.extractedText.split('\n\n--- Page ');
                    textChunks.forEach((chunk, idx) => {
                        const cleanText = chunk.replace(/^\d+ ---\n/, '').trim();
                        if (cleanText) {
                            pages.push({
                                bidId,
                                documentId: doc.id,
                                pageNumber: idx + 1,
                                text: cleanText,
                                characterCount: cleanText.length,
                                wordCount: cleanText.split(/\s+/).length,
                                filename: doc.filename
                            });
                        }
                    });
                }
            }
        }

        return pages;
    }
}
