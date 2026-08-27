import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../services/api/dashboardApi';
import { FileText, Files, FileQuestion, Users, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function Dashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: dashboardApi.getStats,
  });

  if (isLoading) return <div className="text-muted">Loading dashboard...</div>;
  if (isError) return <div className="text-error">Failed to load dashboard stats.</div>;

  return (
    <div>
      <h1 className="text-h1">System Overview</h1>
      <p className="text-muted mb-4">Tender-Bid Compliance Platform metrics</p>
      
      <div className="dashboard-grid">
        <div className="card stat-card">
          <div className="flex items-center gap-2 text-muted font-semibold">
            <FileText size={18} /> ACTIVE TENDERS
          </div>
          <div className="stat-value">{data?.tenders || 0}</div>
        </div>
        
        <div className="card stat-card">
          <div className="flex items-center gap-2 text-muted font-semibold">
            <Files size={18} /> DOCUMENTS
          </div>
          <div className="stat-value">{data?.documents || 0}</div>
        </div>

        <div className="card stat-card">
          <div className="flex items-center gap-2 text-muted font-semibold">
            <FileQuestion size={18} /> REQUIREMENTS
          </div>
          <div className="stat-value">{data?.requirements || 0}</div>
        </div>

        <div className="card stat-card">
          <div className="flex items-center gap-2 text-muted font-semibold">
            <Users size={18} /> BIDS
          </div>
          <div className="stat-value">{data?.bids || 0}</div>
        </div>
      </div>

      <h2 className="text-h2 mt-4">Action Required</h2>
      <div className="dashboard-grid mt-4">
        <div className="card stat-card" style={{ borderLeft: '4px solid var(--color-warning)' }}>
          <div className="flex items-center gap-2 text-muted font-semibold">
            <AlertTriangle size={18} color="var(--color-warning)" /> REVIEW REQUIRED
          </div>
          <div className="stat-value">{data?.reviewRequired || 0}</div>
          <p className="text-xs text-muted mt-2">AI extracted requirements needing officer approval</p>
        </div>

        <div className="card stat-card" style={{ borderLeft: '4px solid var(--color-error)' }}>
          <div className="flex items-center gap-2 text-muted font-semibold">
            <ShieldAlert size={18} color="var(--color-error)" /> CONFLICTING
          </div>
          <div className="stat-value">{data?.conflicting || 0}</div>
          <p className="text-xs text-muted mt-2">Requirements with document conflicts</p>
        </div>
      </div>
    </div>
  );
}
