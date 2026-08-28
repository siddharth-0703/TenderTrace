import { Loader2 } from 'lucide-react';

interface Props {
  text?: string;
  size?: number;
}

export function LoadingSpinner({ text = 'Processing...', size = 22 }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 24px',
        color: 'var(--text-muted)',
      }}
      role="status"
      aria-label={text}
    >
      <Loader2
        size={size}
        className="animate-spin"
        style={{ color: 'var(--color-navy-500)', marginBottom: '14px' }}
      />
      <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-slate-600)' }}>
        {text}
      </span>
    </div>
  );
}

export default LoadingSpinner;
