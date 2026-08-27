import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../services/api/dashboardApi';
import { FileText, Files, FileQuestion, Users, AlertTriangle, ShieldAlert } from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { ActivityTimeline } from '../../components/common/ActivityTimeline';
import { Link } from 'react-router-dom';
import { tenderApi } from '../../services/api/tenderApi';

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading, isError: statsError } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: dashboardApi.getStats,
  });

  const { data: activities, isLoading: activityLoading } = useQuery({
    queryKey: ['recentActivity'],
    queryFn: async () => {
      const res = await fetch('http://localhost:3000/api/activity');
      return res.json();
    }
  });

  const { data: tenders, isLoading: tendersLoading } = useQuery({
    queryKey: ['recentTenders'],
    queryFn: tenderApi.getTenders,
  });

  if (statsLoading || activityLoading || tendersLoading) return <LoadingSpinner text="Loading dashboard..." />;
  if (statsError) return <ErrorState title="Failed to load dashboard data" />;

  return (
    <div>
      <h1 className="text-h1">Dashboard</h1>
      <p className="text-muted mb-6">Overview of tender compliance and evaluation.</p>
      
      <div className="dashboard-grid">
        <div className="card stat-card">
          <div className="flex items-center gap-2 text-muted font-semibold">
            <FileText size={18} /> ACTIVE TENDERS
          </div>
          <div className="stat-value">{stats?.tenders || 0}</div>
        </div>
        
        <div className="card stat-card">
          <div className="flex items-center gap-2 text-muted font-semibold">
            <Users size={18} /> TOTAL BIDS
          </div>
          <div className="stat-value">{stats?.bids || 0}</div>
        </div>

        <div className="card stat-card">
          <div className="flex items-center gap-2 text-muted font-semibold">
            <Files size={18} /> PROCESSED DOCS
          </div>
          <div className="stat-value">{stats?.documents || 0}</div>
        </div>

        <div className="card stat-card">
          <div className="flex items-center gap-2 text-muted font-semibold">
            <FileQuestion size={18} /> REQUIREMENTS
          </div>
          <div className="stat-value">{stats?.requirements || 0}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        <div>
          <h2 className="text-h2">Recent Tenders</h2>
          <div className="card mt-4" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%' }}>
              <tbody>
                {tenders?.slice(0, 5).map((tender: any) => (
                  <tr key={tender.id}>
                    <td style={{ padding: '16px' }}>
                      <Link to={`/tenders/${tender.id}`} style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'block', textDecoration: 'none' }}>
                        {tender.title}
                      </Link>
                      <div className="text-muted" style={{ fontSize: '12px', marginTop: '4px' }}>
                        {tender.tenderNumber || tender.id.substring(0,8)} • {tender.organization}
                      </div>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                       <span className="badge badge-neutral">{tender.status}</span>
                    </td>
                  </tr>
                ))}
                {tenders?.length === 0 && (
                  <tr><td colSpan={2} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No tenders yet</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <h2 className="text-h2 mt-6">Action Required</h2>
          <div className="dashboard-grid mt-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="card stat-card" style={{ borderLeft: '4px solid var(--color-warning)' }}>
              <div className="flex items-center gap-2 text-muted font-semibold">
                <AlertTriangle size={18} color="var(--color-warning)" /> REVIEW REQUIRED
              </div>
              <div className="stat-value">{stats?.reviewRequired || 0}</div>
            </div>

            <div className="card stat-card" style={{ borderLeft: '4px solid var(--color-error)' }}>
              <div className="flex items-center gap-2 text-muted font-semibold">
                <ShieldAlert size={18} color="var(--color-error)" /> CONFLICTING
              </div>
              <div className="stat-value">{stats?.conflicting || 0}</div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-h2">Recent Activity</h2>
          <div className="card mt-4">
             <ActivityTimeline activities={(activities || []).slice(0, 10)} />
          </div>
        </div>
      </div>
    </div>
  );
}
