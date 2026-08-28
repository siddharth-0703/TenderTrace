import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../services/api/dashboardApi';
import { tenderApi } from '../../services/api/tenderApi';
import { FileText, Users, AlertTriangle, ShieldAlert, ArrowRight, Clock, TrendingUp } from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { ActivityTimeline } from '../../components/common/ActivityTimeline';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../../components/common/StatusBadge';

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

  if (statsLoading || activityLoading || tendersLoading) return <LoadingSpinner text="Loading overview..." />;
  if (statsError) return <ErrorState title="Failed to load dashboard data" />;

  const hasActions = (stats?.reviewRequired || 0) > 0 || (stats?.conflicting || 0) > 0;
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }} className="animate-fadeIn">
      {/* Greeting */}
      <div style={{ marginBottom: '32px' }}>
        <h1 className="text-h1" style={{ marginBottom: '2px' }}>Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{today} • Procurement Compliance Overview</p>
      </div>
      
      {/* Action Required */}
      {hasActions && (
        <div style={{ marginBottom: '28px' }}>
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={13} /> Requires Your Attention
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(stats?.reviewRequired || 0) > 0 && (
              <div className="alert-box alert-warning" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0, padding: '16px 20px' }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <AlertTriangle size={20} color="var(--color-warning)" />
                  <div>
                    <div style={{ fontWeight: 600, color: '#5f3700', fontSize: '14px' }}>{stats?.reviewRequired} requirements awaiting manual verification</div>
                    <div style={{ fontSize: '13px', color: '#8a5200', marginTop: '2px' }}>Documents that could not be conclusively verified by the system.</div>
                  </div>
                </div>
                <Link to="/bids" className="btn btn-outline" style={{ flexShrink: 0, backgroundColor: 'white', borderColor: 'rgba(227,116,0,0.3)', color: '#8a5200', fontSize: '12px' }}>
                  Review <ArrowRight size={13} />
                </Link>
              </div>
            )}
            
            {(stats?.conflicting || 0) > 0 && (
              <div className="alert-box alert-error" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0, padding: '16px 20px' }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <ShieldAlert size={20} color="var(--color-error)" />
                  <div>
                    <div style={{ fontWeight: 600, color: '#7c0a02', fontSize: '14px' }}>{stats?.conflicting} conflicting evidence flags detected</div>
                    <div style={{ fontSize: '13px', color: '#a31515', marginTop: '2px' }}>Contradictory information found in bidder submissions.</div>
                  </div>
                </div>
                <Link to="/bids" className="btn btn-outline" style={{ flexShrink: 0, backgroundColor: 'white', borderColor: 'rgba(197,34,31,0.3)', color: '#a31515', fontSize: '12px' }}>
                  Investigate <ArrowRight size={13} />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* KPIs */}
      <div className="dashboard-grid" style={{ marginBottom: '28px' }}>
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <FileText size={15} color="var(--color-accent)" />
            <span className="section-title" style={{ margin: 0 }}>Active Tenders</span>
          </div>
          <div className="stat-value">{stats?.tenders || 0}</div>
        </div>
        
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Users size={15} color="var(--color-accent)" />
            <span className="section-title" style={{ margin: 0 }}>Bids Under Review</span>
          </div>
          <div className="stat-value">{stats?.bids || 0}</div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <AlertTriangle size={15} color="var(--color-warning)" />
            <span className="section-title" style={{ margin: 0 }}>Pending Verification</span>
          </div>
          <div className="stat-value" style={{ color: (stats?.reviewRequired || 0) > 0 ? 'var(--color-warning)' : 'var(--color-primary)' }}>
            {stats?.reviewRequired || 0}
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <ShieldAlert size={15} color="var(--color-error)" />
            <span className="section-title" style={{ margin: 0 }}>Conflicts</span>
          </div>
          <div className="stat-value" style={{ color: (stats?.conflicting || 0) > 0 ? 'var(--color-error)' : 'var(--color-primary)' }}>
            {stats?.conflicting || 0}
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '28px' }}>
        {/* Tenders Table */}
        <div>
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={13} /> Active Procurement Cases
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Tender</th>
                  <th>Reference</th>
                  <th style={{ textAlign: 'center' }}>Bidders</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}></th>
                </tr>
              </thead>
              <tbody>
                {tenders?.slice(0, 6).map((tender: any) => (
                  <tr key={tender.id}>
                    <td>
                      <div style={{ fontWeight: 500, maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {tender.title}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)', backgroundColor: 'var(--color-background)', padding: '2px 8px', borderRadius: '4px' }}>
                        {tender.tenderNumber || tender.id.substring(0,8)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{tender._count?.bids || 0}</td>
                    <td><StatusBadge status={tender.status} /></td>
                    <td style={{ textAlign: 'right' }}>
                      <Link to={`/tenders/${tender.id}`} className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '12px' }}>
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
                {tenders?.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No active tenders. Create one to begin.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {(tenders?.length || 0) > 0 && (
            <div style={{ marginTop: '12px', textAlign: 'right' }}>
              <Link to="/tenders" style={{ fontSize: '13px', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                View all tenders <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div>
          <div className="section-title">Recent Activity</div>
          <div className="card" style={{ padding: '20px' }}>
             <ActivityTimeline activities={(activities || []).slice(0, 8)} />
          </div>
          <div style={{ marginTop: '12px', textAlign: 'right' }}>
            <Link to="/activity" style={{ fontSize: '13px', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              Full audit log <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
