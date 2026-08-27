import { useQuery } from '@tanstack/react-query';
import { ActivityTimeline } from '../../components/common/ActivityTimeline';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';

export default function ActivityPage() {
  const { data: activities, isLoading, isError, refetch } = useQuery({
    queryKey: ['globalActivity'],
    queryFn: async () => {
      const res = await fetch('http://localhost:3000/api/activity');
      if (!res.ok) throw new Error('Failed to fetch activity');
      return res.json();
    }
  });

  if (isLoading) return <LoadingSpinner text="Loading global activity history..." />;
  if (isError) return <ErrorState title="Failed to load activity" onRetry={() => refetch()} />;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 className="text-h1" style={{ marginBottom: '4px' }}>Global Activity History</h1>
        <p className="text-muted">System-wide audit log of all tender and compliance operations.</p>
      </div>

      <div className="card" style={{ padding: '32px' }}>
        <ActivityTimeline activities={activities || []} />
      </div>
    </div>
  );
}
