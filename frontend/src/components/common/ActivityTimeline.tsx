import { Clock, CheckCircle, UploadCloud, AlertTriangle, XCircle, Play, FileText, Trash2 } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  tenderId?: string | null;
  bidId?: string | null;
  metadata?: string | null;
}

interface ActivityTimelineProps {
  activities: ActivityItem[];
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (!activities || activities.length === 0) {
    return (
      <div style={{ 
        padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', 
        backgroundColor: 'var(--color-background)', border: '1px dashed var(--color-border)', borderRadius: '8px' 
      }}>
        <Clock size={28} style={{ margin: '0 auto 10px auto', display: 'block', color: 'var(--color-border)' }} />
        <p style={{ fontSize: '14px' }}>No activity recorded yet.</p>
      </div>
    );
  }

  return (
    <div>
      {activities.map((activity, idx) => {
        const { icon, bg } = getIconConfig(activity.type);
        
        let parsedMeta: any = null;
        if (activity.metadata) {
          try {
            parsedMeta = typeof activity.metadata === 'string' ? JSON.parse(activity.metadata) : activity.metadata;
          } catch (e) {
            // ignore JSON parse error
          }
        }

        return (
          <div key={activity.id} style={{ display: 'flex', gap: '14px', paddingBottom: idx < activities.length - 1 ? '20px' : '0', position: 'relative' }}>
            {/* Timeline line */}
            {idx < activities.length - 1 && (
              <div style={{ 
                position: 'absolute', top: '32px', left: '15px', width: '2px', 
                height: 'calc(100% - 16px)', backgroundColor: 'var(--color-divider)' 
              }} />
            )}
            {/* Icon */}
            <div style={{ 
              width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
              backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', zIndex: 1,
            }}>
              {icon}
            </div>
            {/* Content */}
            <div style={{ flex: 1, paddingTop: '4px', minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500, margin: 0, lineHeight: 1.5 }}>
                  {activity.message}
                </p>
                <time 
                  dateTime={activity.createdAt}
                  style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0, marginTop: '2px' }}
                >
                  {formatTimeAgo(new Date(activity.createdAt))}
                </time>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', backgroundColor: 'var(--color-background)', padding: '1px 6px', borderRadius: '3px' }}>
                  {activity.type}
                </span>
                {parsedMeta?.tenderNumber && (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Ref: {parsedMeta.tenderNumber}
                  </span>
                )}
                {parsedMeta?.organization && (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    • {parsedMeta.organization}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getIconConfig(type: string) {
  if (type.includes('DELETED'))   return { icon: <Trash2 size={15} color="#c5221f" />, color: '#c5221f', bg: '#fce8e6' };
  if (type.includes('UPLOADED'))   return { icon: <UploadCloud size={15} color="#1a73e8" />, color: '#1a73e8', bg: 'var(--color-info-bg)' };
  if (type.includes('COMPLETED') || type.includes('PROCESSED') || type.includes('APPROVED'))
    return { icon: <CheckCircle size={15} color="#188038" />, color: '#188038', bg: 'var(--color-success-bg)' };
  if (type.includes('FAILED'))    return { icon: <XCircle size={15} color="#c5221f" />, color: '#c5221f', bg: 'var(--color-error-bg)' };
  if (type.includes('STARTED') || type.includes('PROCESSING'))
    return { icon: <Play size={15} color="#7c3aed" />, color: '#7c3aed', bg: '#f3e8fd' };
  if (type.includes('CREATED'))   return { icon: <FileText size={15} color="#1a73e8" />, color: '#1a73e8', bg: 'var(--color-info-bg)' };
  if (type.includes('WARNING') || type.includes('CONFLICT'))
    return { icon: <AlertTriangle size={15} color="#e37400" />, color: '#e37400', bg: 'var(--color-warning-bg)' };
  return { icon: <Clock size={15} color="var(--text-muted)" />, color: 'var(--text-muted)', bg: '#f1f3f4' };
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
