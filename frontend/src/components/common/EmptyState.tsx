import { FileSearch } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  title?: string;
  message?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function EmptyState({
  title = 'No records found',
  message = 'There is currently no data matching your query in the workspace.',
  action,
  icon,
}: Props) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '56px 24px',
        textAlign: 'center',
        background: 'var(--color-white)',
        border: '1px dashed var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        margin: '16px 0',
      }}
    >
      <div
        style={{
          width: '52px',
          height: '52px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--color-slate-50)',
          border: '1px solid var(--color-slate-200)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
          color: 'var(--color-slate-500)',
        }}
      >
        {icon || <FileSearch size={24} />}
      </div>
      <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-slate-900)', marginBottom: '6px' }}>
        {title}
      </h3>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '420px', marginBottom: action ? '20px' : '0', lineHeight: 1.5 }}>
        {message}
      </p>
      {action && <div style={{ marginTop: '16px' }}>{action}</div>}
    </div>
  );
}

export default EmptyState;
