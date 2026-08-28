import apiClient from './apiClient';
import type { Bid, Document, RequirementEvidenceMatch } from '../../types';

export const bidApi = {
  getBids: async (): Promise<Bid[]> => {
    const { data } = await apiClient.get('/bids');
    return data;
  },
  getBidDetails: async (id: string): Promise<Bid & { documents: Document[] }> => {
    const { data } = await apiClient.get(`/bids/${id}`);
    return data;
  },
  uploadDocuments: async (id: string, files: File[]): Promise<{ documents: Document[] }> => {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    const { data } = await apiClient.post(`/bids/${id}/documents/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },
  matchBidAgainstTender: async (tenderId: string, bidId: string): Promise<any> => {
    const { data } = await apiClient.post(`/tenders/${tenderId}/match-bid/${bidId}`);
    return data;
  },
  getTenderBidMatches: async (tenderId: string, bidId: string): Promise<{ matches: RequirementEvidenceMatch[] }> => {
    const { data } = await apiClient.get(`/tenders/${tenderId}/bids/${bidId}/matches`);
    return data;
  },
  submitOfficerDecision: async (id: string, decision: string, comment?: string): Promise<any> => {
    const { data } = await apiClient.post(`/bids/${id}/decision`, { decision, comment });
    return data;
  }
};
