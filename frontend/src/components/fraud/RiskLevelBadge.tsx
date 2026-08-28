import type { IndicatorSeverity, RiskLevel } from '../../types/fraud';

interface Props {
  level: RiskLevel | IndicatorSeverity | string;
  size?: 'sm' | 'md';
}

const DOTS: Record<string, string> = {
  INFORMATIONAL: 'ℹ',
  LOW:           '●',
  MEDIUM:        '●',
  HIGH:          '●',
  CRITICAL:      '●',
};

export default function RiskLevelBadge({ level, size = 'md' }: Props) {
  const cls = (level || 'LOW').toLowerCase();
  return (
    <span className={`badge badge--${cls} ${size === 'sm' ? 'badge--sm' : ''}`} aria-label={`Level: ${level}`}>
      <span aria-hidden="true" style={{ fontSize: '0.6em', marginRight: 4 }}>{DOTS[level] || '●'}</span>
      {level}
    </span>
  );
}

