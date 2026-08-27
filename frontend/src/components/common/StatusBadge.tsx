import { CheckCircle2, XCircle, AlertTriangle, Clock, HelpCircle, FileText } from 'lucide-react';

interface Props {
  status: string;
}

const statusConfig: Record<string, { bg: string; color: string; Icon: any }> = {
  // Compliance
  COMPLIANT:              { bg: 'var(--color-success-bg)', color: 'var(--color-success)',  Icon: CheckCircle2 },
  SUCCESS:                { bg: 'var(--color-success-bg)', color: 'var(--color-success)',  Icon: CheckCircle2 },
  APPROVED:               { bg: 'var(--color-success-bg)', color: 'var(--color-success)',  Icon: CheckCircle2 },
  COMPLETED:              { bg: 'var(--color-success-bg)', color: 'var(--color-success)',  Icon: CheckCircle2 },
  NON_COMPLIANT:          { bg: 'var(--color-error-bg)',   color: 'var(--color-error)',    Icon: XCircle },
  FAILED:                 { bg: 'var(--color-error-bg)',   color: 'var(--color-error)',    Icon: XCircle },
  REJECTED:               { bg: 'var(--color-error-bg)',   color: 'var(--color-error)',    Icon: XCircle },
  CONFLICTING:            { bg: 'var(--color-warning-bg)', color: '#b06000',               Icon: AlertTriangle },
  CONFLICTING_EVIDENCE:   { bg: 'var(--color-warning-bg)', color: '#b06000',               Icon: AlertTriangle },
  INSUFFICIENT_EVIDENCE:  { bg: 'var(--color-warning-bg)', color: '#b06000',               Icon: AlertTriangle },
  PARTIAL:                { bg: 'var(--color-warning-bg)', color: '#b06000',               Icon: AlertTriangle },
  REVIEW_REQUIRED:        { bg: 'var(--color-warning-bg)', color: '#b06000',               Icon: AlertTriangle },
  // Processing
  UPLOADED:               { bg: 'var(--color-info-bg)',    color: 'var(--color-accent)',   Icon: Clock },
  PENDING:                { bg: 'var(--color-info-bg)',    color: 'var(--color-accent)',   Icon: Clock },
  DETECTED:               { bg: 'var(--color-info-bg)',    color: 'var(--color-accent)',   Icon: Clock },
  SUBMITTED:              { bg: 'var(--color-info-bg)',    color: 'var(--color-accent)',   Icon: Clock },
  EXTRACTING:             { bg: '#f3e8fd',                 color: '#7c3aed',               Icon: Clock },
  PROCESSING:             { bg: '#f3e8fd',                 color: '#7c3aed',               Icon: Clock },
  TEXT_AVAILABLE:          { bg: '#f1f3f4',                 color: 'var(--text-secondary)', Icon: FileText },
  OCR_REQUIRED:           { bg: '#f1f3f4',                 color: 'var(--text-secondary)', Icon: FileText },
};

const defaultConfig = { bg: '#f1f3f4', color: 'var(--text-secondary)', Icon: HelpCircle };

export function StatusBadge({ status }: Props) {
  const key = (status || '').toUpperCase();
  const cfg = statusConfig[key] || defaultConfig;
  const { bg, color, Icon } = cfg;

  const formattedText = (status || '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 10px',
        borderRadius: '9999px',
        fontSize: '11px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
        backgroundColor: bg,
        color: color,
        lineHeight: 1.5,
      }}
    >
      <Icon size={13} />
      {formattedText}
    </span>
  );
}
