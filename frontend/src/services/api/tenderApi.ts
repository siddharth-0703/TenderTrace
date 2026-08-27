import apiClient from './apiClient';

export interface Tender {
  id: string;
  title: string;
  department: string;
  issueDate: string;
  closingDate: string;
  processingStatus: string;
  _count?: {
    documents: number;
    requirements: number;
    bids: number;
  };
}

export const tenderApi = {
  getTenders: async (): Promise<Tender[]> => {
    const { data } = await apiClient.get('/tenders');
    return data;
  },
  getTenderDetails: async (id: string): Promise<any> => {
    const { data } = await apiClient.get(`/tenders/${id}`);
    return data;
  },
  uploadDocuments: async (id: string, files: File[]): Promise<any> => {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    const { data } = await apiClient.post(`/tenders/${id}/documents/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },
  processPackage: async (id: string): Promise<any> => {
    const { data } = await apiClient.post(`/tenders/${id}/process-package`);
    return data;
  },
  getRequirements: async (id: string): Promise<any> => {
    const { data } = await apiClient.get(`/tenders/${id}/requirements`);
    return data;
  }
};
