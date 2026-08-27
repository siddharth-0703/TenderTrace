import fs from 'fs';
import path from 'path';
import readline from 'readline';

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
        const logPath = path.join(process.cwd(), logDirectory, 'bid.log');
        if (!fs.existsSync(logPath)) {
            return [];
        }

        const pages: BidTextPage[] = [];
        const fileStream = fs.createReadStream(logPath);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        for await (const line of rl) {
            if (!line.trim()) continue;
            try {
                const record = JSON.parse(line);
                if (record.bidId === bidId && record.extractionStatus === 'SUCCESS' && Array.isArray(record.pages)) {
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
                // Ignore malformed JSON records
                continue;
            }
        }
        return pages;
    }
}
