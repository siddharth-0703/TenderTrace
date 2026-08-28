import { CheckCircle2, XCircle, AlertTriangle, Clock, HelpCircle, FileText, ShieldCheck } from 'lucide-react';

interface Props {
  status: string;
}

const statusConfig: Record<string, { bg: string; color: string; border: string; Icon: any }> = {
  // Compliance & Outcome
  COMPLIANT:             { bg: 'var(--color-success-bg)', color: 'var(--color-success)', border: 'var(--color-success-border)', Icon: CheckCircle2 },
  SUCCESS:               { bg: 'var(--color-success-bg)', color: 'var(--color-success)', border: 'var(--color-success-border)', Icon: CheckCircle2 },
  APPROVED:              { bg: 'var(--color-success-bg)', color: 'var(--color-success)', border: 'var(--color-success-border)', Icon: CheckCircle2 },
  COMPLETED:             { bg: 'var(--color-success-bg)', color: 'var(--color-success)', border: 'var(--color-success-border)', Icon: CheckCircle2 },
  VERIFIED:              { bg: 'var(--color-success-bg)', color: 'var(--color-success)', border: 'var(--color-success-border)', Icon: CheckCircle2 },
  
  NON_COMPLIANT:         { bg: 'var(--color-danger-bg)',  color: 'var(--color-danger)',  border: 'var(--color-danger-border)',  Icon: XCircle },
  FAILED:                { bg: 'var(--color-danger-bg)',  color: 'var(--color-danger)',  border: 'var(--color-danger-border)',  Icon: XCircle },
  REJECTED:              { bg: 'var(--color-danger-bg)',  color: 'var(--color-danger)',  border: 'var(--color-danger-border)',  Icon: XCircle },
  
  CONFLICTING:           { bg: 'var(--color-warning-bg)', color: 'var(--color-warning)', border: 'var(--color-warning-border)', Icon: AlertTriangle },
  CONFLICTING_EVIDENCE:  { bg: 'var(--color-warning-bg)', color: 'var(--color-warning)', border: 'var(--color-warning-border)', Icon: AlertTriangle },
  INSUFFICIENT_EVIDENCE: { bg: 'var(--color-warning-bg)', color: 'var(--color-warning)', border: 'var(--color-warning-border)', Icon: AlertTriangle },
  PARTIAL:               { bg: 'var(--color-warning-bg)', color: 'var(--color-warning)', border: 'var(--color-warning-border)', Icon: AlertTriangle },
  REVIEW_REQUIRED:       { bg: 'var(--color-warning-bg)', color: 'var(--color-warning)', border: 'var(--color-warning-border)', Icon: AlertTriangle },
  REQUIRES_OFFICER_REVIEW:{ bg: 'var(--color-warning-bg)', color: 'var(--color-warning)', border: 'var(--color-warning-border)', Icon: AlertTriangle },
  
  // Processing & Workflow
  UPLOADED:              { bg: 'var(--color-info-bg)',    color: 'var(--color-info)',    border: 'var(--color-info-border)',    Icon: Clock },
  PENDING:               { bg: 'var(--color-info-bg)',    color: 'var(--color-info)',    border: 'var(--color-info-border)',    Icon: Clock },
  DETECTED:              { bg: 'var(--color-info-bg)',    color: 'var(--color-info)',    border: 'var(--color-info-border)',    Icon: Clock },
  SUBMITTED:             { bg: 'var(--color-info-bg)',    color: 'var(--color-info)',    border: 'var(--color-info-border)',    Icon: Clock },
  READY:                 { bg: 'var(--color-info-bg)',    color: 'var(--color-info)',    border: 'var(--color-info-border)',    Icon: ShieldCheck },
  PUBLISHED:             { bg: 'var(--color-info-bg)',    color: 'var(--color-info)',    border: 'var(--color-info-border)',    Icon: ShieldCheck },
  EXTRACTING:            { bg: '#faf5ff',                 color: '#7e22ce',              border: '#e9d5ff',                     Icon: Clock },
  PROCESSING:            { bg: '#faf5ff',                 color: '#7e22ce',              border: '#e9d5ff',                     Icon: Clock },
  DRAFT:                 { bg: 'var(--color-slate-100)',  color: 'var(--color-slate-700)',border: 'var(--color-slate-200)',    Icon: FileText },
};

const defaultConfig = {
  bg: 'var(--color-slate-100)',
  color: 'var(--color-slate-700)',
  border: 'var(--color-slate-200)',
  Icon: HelpCircle,
};

export function StatusBadge({ status }: Props) {
  const key = (status || '').toUpperCase();
  const cfg = statusConfig[key] || defaultConfig;
  const { bg, color, border, Icon } = cfg;

  const formattedText = (status || '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span
      className="badge"
      style={{
        backgroundColor: bg,
        color: color,
        border: `1px solid ${border}`,
      }}
    >
      <Icon size={12} aria-hidden="true" />
      <span>{formattedText}</span>
    </span>
  );
}

export default StatusBadge;
