import { PackageOpen } from 'lucide-react';

interface Props {
  title?: string;
  message?: string;
  action?: React.ReactNode;
}

export function EmptyState({ 
  title = 'No data found', 
  message = 'There is currently no data to display here.',
  action 
}: Props) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      textAlign: 'center',
      minHeight: '200px',
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        backgroundColor: 'var(--color-background)',
        border: '1px solid var(--color-border-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px',
      }}>
        <PackageOpen size={28} color="var(--text-muted)" />
      </div>
      <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>{title}</h3>
      <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '360px', marginBottom: action ? '24px' : '0' }}>{message}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
