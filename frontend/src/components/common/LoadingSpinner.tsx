import { Loader2 } from 'lucide-react';

interface Props {
  text?: string;
}

export function LoadingSpinner({ text = 'Loading...' }: Props) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px',
      minHeight: '280px',
      color: 'var(--text-muted)',
    }}>
      <Loader2 className="animate-spin" size={28} style={{ marginBottom: '12px', color: 'var(--color-accent)' }} />
      <span style={{ fontSize: '14px', fontWeight: 500 }}>{text}</span>
    </div>
  );
}
