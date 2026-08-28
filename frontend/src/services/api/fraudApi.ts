import client from './client';
import type { FraudAnalysis } from '../../types/fraud';

/** SQLite stores JSON as text — normalise indicators to always be an array */
function normalise(fa: any): FraudAnalysis {
  if (typeof fa.indicators === 'string') {
    try { fa.indicators = JSON.parse(fa.indicators); } catch { fa.indicators = []; }
  }
  if (!Array.isArray(fa.indicators)) fa.indicators = [];
  return fa as FraudAnalysis;
}

/** Fetch the most recent FraudAnalysis for a specific bid */
export async function fetchFraudAnalysis(bidId: string): Promise<FraudAnalysis | null> {
  try {
    const { data } = await client.get<FraudAnalysis>(`/bids/${bidId}/fraud-analysis`);
    return normalise(data);
  } catch (err: any) {
    if (err.response?.status === 404 || err.message?.includes('404')) return null;
    throw err;
  }
}

/** Trigger a fraud analysis run on a bid (uses existing POST /api/bids/:id/analyze) */
export async function runAnalysis(bidId: string): Promise<{ fraud: FraudAnalysis }> {
  const { data } = await client.post(`/bids/${bidId}/analyze`);
  return data;
}

/** Fetch all fraud analyses (for overview) */
export async function fetchAllFraudAnalyses(): Promise<FraudAnalysis[]> {
  const { data } = await client.get<FraudAnalysis[]>('/fraud-analyses');
  return data.map(normalise);
}

