import apiClient from './apiClient';

export interface DashboardStats {
  tenders: number;
  documents: number;
  requirements: number;
  bids: number;
  reviewRequired: number;
  conflicting: number;
}

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const { data } = await apiClient.get('/dashboard/stats');
    return data;
  }
};
