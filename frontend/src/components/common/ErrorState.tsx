import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Service Unavailable',
  message = 'Unable to complete the requested operation. Please verify connection and retry.',
  onRetry,
}: Props) {
  return (
    <div
      className="alert-box alert-error"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
        margin: '24px 0',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: 'rgba(220, 38, 38, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
        }}
      >
        <AlertCircle size={24} color="var(--color-danger)" />
      </div>
      <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-danger)', marginBottom: '8px' }}>
        {title}
      </h3>
      <p style={{ fontSize: '13px', color: 'var(--color-danger-text)', maxWidth: '440px', marginBottom: onRetry ? '20px' : '0' }}>
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn btn-secondary btn-sm"
          style={{ marginTop: '12px' }}
        >
          <RefreshCw size={13} />
          <span>Retry Request</span>
        </button>
      )}
    </div>
  );
}

export default ErrorState;
