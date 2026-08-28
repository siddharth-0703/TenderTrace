import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ActivityTimeline } from '../../components/common/ActivityTimeline';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { Search, Filter, Download, Activity, X } from 'lucide-react';

export default function ActivityPage() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const { data: activities, isLoading, isError, refetch } = useQuery({
    queryKey: ['globalActivity'],
    queryFn: async () => {
      const res = await fetch('http://localhost:3000/api/activity');
      if (!res.ok) throw new Error('Failed to fetch activity');
      return res.json();
    },
  });

  const filteredActivities = useMemo(() => {
    if (!activities || !Array.isArray(activities)) return [];
    return activities.filter((act: any) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const msg = (act.message || '').toLowerCase();
        const type = (act.type || '').toLowerCase();
        if (!msg.includes(q) && !type.includes(q)) return false;
      }

      if (actionFilter !== 'ALL') {
        const t = (act.type || '').toUpperCase();
        if (actionFilter === 'EVALUATION' && !t.includes('COMPLIANCE') && !t.includes('MATCH') && !t.includes('EVALUAT')) return false;
        if (actionFilter === 'DECISION' && !t.includes('DECISION') && !t.includes('APPROVED') && !t.includes('REJECTED')) return false;
        if (actionFilter === 'UPLOAD' && !t.includes('UPLOAD') && !t.includes('DOCUMENT')) return false;
      }

      return true;
    });
  }, [activities, search, actionFilter]);

  const handleExportJson = () => {
    if (!activities) return;
    const blob = new Blob([JSON.stringify(activities, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tendertrace-audit-log-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) return <LoadingSpinner text="Loading global compliance audit trail..." />;
  if (isError) return <ErrorState title="Failed to load audit trail" onRetry={() => refetch()} />;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* ── Page Header ── */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Immutable Audit Trail &amp; Event Stream</h1>
            <div className="subtitle">
              Cryptographically timestamped record of all procurement evaluations, AI extractions, and officer determinations
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleExportJson}
            disabled={!activities || activities.length === 0}
          >
            <Download size={13} />
            <span>Export Audit Trail (JSON)</span>
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <div className="input-icon-wrapper" style={{ flex: '1 1 280px' }}>
          <Search size={15} className="input-icon" />
          <input
            type="text"
            className="input"
            placeholder="Search by keyword, tender reference, or action type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%' }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Filter size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <select
            className="select"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            aria-label="Filter by action category"
          >
            <option value="ALL">All Event Categories</option>
            <option value="EVALUATION">Compliance Evaluations</option>
            <option value="DECISION">Officer Determinations</option>
            <option value="UPLOAD">Document Ingestions</option>
          </select>
        </div>
      </div>

      {/* ── Timeline Card ── */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            <Activity size={16} color="var(--color-navy-500)" />
            Recorded System Events
            <span className="badge badge--neutral" style={{ marginLeft: '8px' }}>
              {filteredActivities.length}
            </span>
          </span>
        </div>
        <div className="card-body">
          {filteredActivities.length === 0 ? (
            <EmptyState
              title="No events matching criteria"
              message={search || actionFilter !== 'ALL' ? 'Try changing your search terms or filter selection.' : 'No audit events have been logged yet.'}
            />
          ) : (
            <ActivityTimeline activities={filteredActivities} />
          )}
        </div>
      </div>
    </div>
  );
}
