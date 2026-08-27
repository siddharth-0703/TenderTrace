import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ 
  title = 'Something went wrong', 
  message = 'An unexpected error occurred. Please try again later.',
  onRetry 
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
        backgroundColor: 'var(--color-error-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px',
      }}>
        <AlertCircle size={28} color="var(--color-error)" />
      </div>
      <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>{title}</h3>
      <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '360px', marginBottom: onRetry ? '20px' : '0' }}>{message}</p>
      {onRetry && (
        <button className="btn btn-outline" onClick={onRetry} style={{ gap: '8px' }}>
          <RefreshCw size={14} /> Retry
        </button>
      )}
    </div>
  );
}
