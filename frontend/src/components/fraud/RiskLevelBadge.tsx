import { ShieldAlert, ShieldCheck, AlertTriangle, AlertOctagon, Info } from 'lucide-react';
import type { RiskLevel, IndicatorSeverity } from '../../types/fraud';

interface Props {
  level: RiskLevel | IndicatorSeverity | string;
}

const config: Record<string, { cls: string; Icon: any; label: string }> = {
  LOW:           { cls: 'badge--low',      Icon: ShieldCheck,   label: 'LOW RISK' },
  MEDIUM:        { cls: 'badge--medium',   Icon: AlertTriangle, label: 'MEDIUM RISK' },
  HIGH:          { cls: 'badge--high',     Icon: ShieldAlert,   label: 'HIGH RISK' },
  CRITICAL:      { cls: 'badge--critical', Icon: AlertOctagon,  label: 'CRITICAL RISK' },
  INFORMATIONAL: { cls: 'badge--info',     Icon: Info,          label: 'INFORMATIONAL' },
};

export default function RiskLevelBadge({ level }: Props) {
  const key = (level || 'LOW').toUpperCase();
  const cfg = config[key] ?? { cls: 'badge--neutral', Icon: Info, label: key };
  const { Icon, cls, label } = cfg;

  return (
    <span className={`badge ${cls}`} role="status" aria-label={`Risk Level: ${level}`}>
      <Icon size={12} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
