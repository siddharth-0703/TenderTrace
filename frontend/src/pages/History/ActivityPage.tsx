import { useQuery } from '@tanstack/react-query';
import { ActivityTimeline } from '../../components/common/ActivityTimeline';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { Search, Filter, Download } from 'lucide-react';

export default function ActivityPage() {
  const { data: activities, isLoading, isError, refetch } = useQuery({
    queryKey: ['globalActivity'],
    queryFn: async () => {
      const res = await fetch('http://localhost:3000/api/activity');
      if (!res.ok) throw new Error('Failed to fetch activity');
      return res.json();
    }
  });

  if (isLoading) return <LoadingSpinner text="Loading global audit log..." />;
  if (isError) return <ErrorState title="Failed to load audit log" onRetry={() => refetch()} />;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-h1" style={{ marginBottom: '4px' }}>System Audit Trail</h1>
          <p className="text-muted">Immutable ledger of all procurement actions, evaluations, and decisions.</p>
        </div>
        <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Download size={16} /> Export Log
        </button>
      </div>

      <div className="card" style={{ marginBottom: '24px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'center', backgroundColor: 'var(--color-surface)' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search by tender, bidder, or action..." 
            style={{ padding: '8px 12px 8px 36px', borderRadius: '4px', border: '1px solid var(--color-border)', width: '100%', fontSize: '14px' }} 
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Filter size={16} color="var(--text-muted)" />
          <select style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-background)' }}>
            <option>All Actions</option>
            <option>Compliance Evaluated</option>
            <option>Officer Decision</option>
          </select>
          <select style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-background)' }}>
            <option>Last 30 Days</option>
            <option>Last 6 Months</option>
            <option>All Time</option>
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: '32px' }}>
        <ActivityTimeline activities={activities || []} />
      </div>
    </div>
  );
}
