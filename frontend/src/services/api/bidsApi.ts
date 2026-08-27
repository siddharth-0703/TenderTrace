import client from './client';
import type { BidSummary } from '../../types/fraud';

function normaliseIndicators(fa: any) {
  if (typeof fa.indicators === 'string') {
    try { fa.indicators = JSON.parse(fa.indicators); } catch { fa.indicators = []; }
  }
  if (!Array.isArray(fa.indicators)) fa.indicators = [];
  return fa;
}

/** Fetch all bids (with bidder + tender + fraud analyses) for the overview table */
export async function fetchAllBids(): Promise<BidSummary[]> {
  const { data } = await client.get<BidSummary[]>('/bids');
  // Normalise indicators in nested fraudAnalyses
  return data.map(bid => ({
    ...bid,
    fraudAnalyses: (bid.fraudAnalyses ?? []).map(normaliseIndicators),
  }));
}
