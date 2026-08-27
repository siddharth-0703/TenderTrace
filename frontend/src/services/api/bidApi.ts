import apiClient from './apiClient';

export interface Bid {
  id: string;
  bidderId: string;
  tenderId: string;
  status: string;
  bidder: {
    id: string;
    name: string;
    organization: string;
  };
  documents: {
    id: string;
    filename: string;
    documentClass: string;
    processingStatus: string;
    evidence: any[];
  }[];
  tender: {
    id: string;
    title: string;
    requirements: any[];
  };
  complianceResults?: any[];
}

export const bidApi = {
  getBids: async (): Promise<Bid[]> => {
    // Actually the backend doesn't have a GET /api/bids yet, I'll add one if needed, or just fetch via tender.
    // Let's create a minimal GET /api/bids in server.ts later if needed. For now I'll mock it if it's missing,
    // or we can just access it via the Tender details. Wait, I will just add GET /api/bids to server.ts.
    const { data } = await apiClient.get('/bids');
    return data;
  },
  getBidDetails: async (id: string): Promise<Bid> => {
    const { data } = await apiClient.get(`/bids/${id}`);
    return data;
  },
  processEvidence: async (id: string): Promise<any> => {
    const { data } = await apiClient.post(`/bids/${id}/process-evidence`);
    return data;
  }
};
