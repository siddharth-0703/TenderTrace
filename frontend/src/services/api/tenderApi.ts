import apiClient from './apiClient';
import type { Tender, TenderRequirement, Document } from '../../types';

export const tenderApi = {
  getTenders: async (): Promise<Tender[]> => {
    const { data } = await apiClient.get('/tenders');
    return data;
  },
  getTenderDetails: async (id: string): Promise<Tender & { documents: Document[] }> => {
    const { data } = await apiClient.get(`/tenders/${id}`);
    return data;
  },
  uploadDocuments: async (id: string, files: File[]): Promise<{ documents: Document[] }> => {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    const { data } = await apiClient.post(`/tenders/${id}/documents/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },
  processPackage: async (id: string): Promise<{ requirements: TenderRequirement[] }> => {
    const { data } = await apiClient.post(`/tenders/${id}/process-package`);
    return data;
  },
  getRequirements: async (id: string): Promise<TenderRequirement[]> => {
    const { data } = await apiClient.get(`/tenders/${id}/requirements`);
    return data;
  }
};
