import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../services/api/dashboardApi';
import { tenderApi } from '../../services/api/tenderApi';
import {
  FileText,
  Users,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  Clock,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  FileSearch,
  Activity
} from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { ActivityTimeline } from '../../components/common/ActivityTimeline';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../../components/common/StatusBadge';

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: dashboardApi.getStats,
  });

  const { data: activities, isLoading: activityLoading } = useQuery({
    queryKey: ['recentActivity'],
    queryFn: async () => {
      const res = await fetch('http://localhost:3000/api/activity');
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: tenders, isLoading: tendersLoading } = useQuery({
    queryKey: ['recentTenders'],
    queryFn: tenderApi.getTenders,
  });

  if (statsLoading || activityLoading || tendersLoading) {
    return <LoadingSpinner text="Loading procurement intelligence command center..." />;
  }

  if (statsError) {
    return <ErrorState title="Failed to load dashboard metrics" onRetry={refetchStats} />;
  }

  const hasActions = (stats?.reviewRequired || 0) > 0 || (stats?.conflicting || 0) > 0;
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="animate-fadeIn" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* ── 1. Authoritative Page Header ── */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Procurement Intelligence Overview</h1>
            <div className="subtitle">
              GeM procurement compliance verification, bidder fraud detection, and multi-dossier audit intelligence
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {today}
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. Action Required Alerts ── */}
      {hasActions && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={13} /> Immediate Officer Review Queue
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(stats?.reviewRequired || 0) > 0 && (
              <div
                className="alert-box alert-warning"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  margin: 0,
                  padding: '14px 18px',
                }}
              >
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <AlertTriangle size={20} color="var(--color-warning)" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>
                      {stats?.reviewRequired} Requirements Awaiting Manual Officer Review
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-warning-text)', marginTop: '2px' }}>
                      Documents containing ambiguous clauses or threshold criteria require officer confirmation.
                    </div>
                  </div>
                </div>
                <Link
                  to="/bids"
                  className="btn btn-secondary btn-sm"
                  style={{ flexShrink: 0, fontWeight: 600 }}
                >
                  Review Bids <ArrowRight size={13} />
                </Link>
              </div>
            )}

            {(stats?.conflicting || 0) > 0 && (
              <div
                className="alert-box alert-error"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  margin: 0,
                  padding: '14px 18px',
                }}
              >
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <ShieldAlert size={20} color="var(--color-danger)" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>
                      {stats?.conflicting} Conflicting Evidence Flags Detected
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-danger-text)', marginTop: '2px' }}>
                      Contradictory entity details or discrepancy between statutory records found.
                    </div>
                  </div>
                </div>
                <Link
                  to="/fraud-risk"
                  className="btn btn-secondary btn-sm"
                  style={{ flexShrink: 0, fontWeight: 600 }}
                >
                  Investigate Anomalies <ArrowRight size={13} />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 3. KPI Metric Cards ── */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card__top">
            <span className="stat-card__label">Active Tenders</span>
            <FileText size={16} color="var(--color-navy-500)" />
          </div>
          <div className="stat-card__value">{stats?.tenders || 0}</div>
          <div className="stat-card__sub">
            <span>Procurement packages active</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__top">
            <span className="stat-card__label">Bids Under Review</span>
            <Users size={16} color="var(--color-navy-500)" />
          </div>
          <div className="stat-card__value">{stats?.bids || 0}</div>
          <div className="stat-card__sub">
            <span>Submitted bidder dossiers</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__top">
            <span className="stat-card__label">Review Required</span>
            <AlertTriangle size={16} color="var(--color-warning)" />
          </div>
          <div
            className="stat-card__value"
            style={{ color: (stats?.reviewRequired || 0) > 0 ? 'var(--color-warning)' : 'inherit' }}
          >
            {stats?.reviewRequired || 0}
          </div>
          <div className="stat-card__sub">
            <span>Pending officer determination</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__top">
            <span className="stat-card__label">Conflicts &amp; Flags</span>
            <ShieldAlert size={16} color="var(--color-danger)" />
          </div>
          <div
            className="stat-card__value"
            style={{ color: (stats?.conflicting || 0) > 0 ? 'var(--color-danger)' : 'inherit' }}
          >
            {stats?.conflicting || 0}
          </div>
          <div className="stat-card__sub">
            <span>High vigilance priority</span>
          </div>
        </div>
      </div>

      {/* ── 4. Tender Evaluation Pipeline Visualizer ── */}
      <div className="card" style={{ marginBottom: '28px', padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-slate-900)' }}>
              Tender Evaluation &amp; Verification Pipeline
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Automated end-to-end audit lifecycle from submission to award determination
            </div>
          </div>
          <span className="badge badge--info font-mono">AUTOMATED PIPELINE</span>
        </div>

        <div className="pipeline-container" style={{ margin: 0, padding: '12px 16px', background: 'var(--color-slate-50)' }}>
          <div className="pipeline-step pipeline-step--done">
            <CheckCircle2 size={14} />
            <span>1. Dossier Submission</span>
          </div>
          <span className="pipeline-arrow">→</span>
          <div className="pipeline-step pipeline-step--done">
            <FileSearch size={14} />
            <span>2. Document Forensics</span>
          </div>
          <span className="pipeline-arrow">→</span>
          <div className="pipeline-step pipeline-step--active">
            <ShieldCheck size={14} />
            <span>3. Compliance Engine</span>
          </div>
          <span className="pipeline-arrow">→</span>
          <div className="pipeline-step pipeline-step--active">
            <ShieldAlert size={14} />
            <span>4. Fraud &amp; Collusion Engine</span>
          </div>
          <span className="pipeline-arrow">→</span>
          <div className="pipeline-step">
            <Users size={14} />
            <span>5. Officer Decision Support</span>
          </div>
        </div>
      </div>

      {/* ── 5. Main Content Grid (Cases Table + Live Activity) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
        {/* Left Column: Active Cases */}
        <div>
          <div className="table-wrapper">
            <div className="table-toolbar">
              <span className="table-toolbar-title">
                <TrendingUp size={15} color="var(--color-navy-500)" />
                Active Procurement Tenders
              </span>
              <Link to="/tenders" className="btn btn-ghost btn-sm">
                View All Tenders <ArrowRight size={12} />
              </Link>
            </div>

            {(!tenders || tenders.length === 0) ? (
              <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No active tenders found. Click <Link to="/tenders/new">Create Tender</Link> to initiate a new procurement package.
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Tender Title</th>
                    <th>Reference</th>
                    <th style={{ textAlign: 'center' }}>Bids</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tenders?.slice(0, 6).map((tender: any) => (
                    <tr key={tender.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--color-slate-900)', maxWidth: '240px' }} className="truncate">
                          {tender.title}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {tender.organization || 'Gov. Department'}
                        </div>
                      </td>
                      <td>
                        <span className="font-mono" style={{ background: 'var(--color-slate-100)', padding: '2px 6px', borderRadius: '4px' }}>
                          {tender.tenderNumber || tender.id.substring(0, 8)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>
                        {tender.bids?.length ?? tender._count?.bids ?? 0}
                      </td>
                      <td>
                        <StatusBadge status={tender.processingStatus || tender.status || 'DRAFT'} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link
                          to={`/tenders/${tender.id}`}
                          className="btn btn-secondary btn-sm"
                        >
                          Workspace
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Column: Recent Activity Feed */}
        <div>
          <div className="card">
            <div className="card-header">
              <span className="card-title" style={{ fontSize: '13px' }}>
                <Activity size={15} color="var(--color-navy-500)" />
                Audit Trail &amp; Verification Stream
              </span>
              <Link to="/activity" className="btn btn-ghost btn-sm" style={{ padding: '2px 6px', fontSize: '11px' }}>
                Full Log
              </Link>
            </div>
            <div className="card-body" style={{ padding: '16px' }}>
              {activities && Array.isArray(activities) && activities.length > 0 ? (
                <ActivityTimeline activities={activities.slice(0, 7)} />
              ) : (
                <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                  No recent audit logs recorded in current session.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
