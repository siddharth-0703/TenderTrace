import { Clock } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  tenderId?: string | null;
  bidId?: string | null;
}

interface ActivityTimelineProps {
  activities: ActivityItem[];
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (!activities || activities.length === 0) {
    return (
      <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--color-background)', border: '1px dashed var(--color-border)', borderRadius: '8px' }}>
        <Clock size={32} style={{ margin: '0 auto 12px auto', color: '#cbd5e1' }} />
        <p>No activity recorded yet.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flow-root' }}>
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 -32px 0' }}>
        {activities.map((activity, activityIdx) => (
          <li key={activity.id}>
            <div style={{ position: 'relative', paddingBottom: '32px' }}>
              {activityIdx !== activities.length - 1 ? (
                <span 
                  style={{ position: 'absolute', top: '16px', left: '16px', marginLeft: '-1px', height: '100%', width: '2px', backgroundColor: 'var(--color-border)' }} 
                  aria-hidden="true" 
                />
              ) : null}
              <div style={{ position: 'relative', display: 'flex', gap: '12px' }}>
                <div>
                  <span style={{ 
                    height: '32px', width: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    boxShadow: '0 0 0 8px white',
                    backgroundColor: getIconColor(activity.type)
                  }}>
                    <Clock size={16} color="white" aria-hidden="true" />
                  </span>
                </div>
                <div style={{ minWidth: 0, flex: 1, paddingTop: '6px', display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                  <div>
                    <p style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500, margin: 0 }}>{activity.message}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'monospace' }}>{activity.type}</p>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '12px', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                    <time dateTime={activity.createdAt}>
                      {new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(activity.createdAt))}
                    </time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function getIconColor(type: string) {
  if (type.includes('CREATED') || type.includes('UPLOADED')) return '#3b82f6';
  if (type.includes('COMPLETED') || type.includes('PROCESSED') || type.includes('APPROVED')) return '#22c55e';
  if (type.includes('FAILED')) return '#ef4444';
  if (type.includes('STARTED')) return '#f59e0b';
  return '#94a3b8';
}
