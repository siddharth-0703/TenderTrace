import type { RiskLevel } from '../../types/fraud';

interface Props {
  level: RiskLevel;
  size?: 'sm' | 'md';
}

const DOTS: Record<RiskLevel, string> = {
  LOW:      '●',
  MEDIUM:   '●',
  HIGH:     '●',
  CRITICAL: '●',
};

export default function RiskLevelBadge({ level, size = 'md' }: Props) {
  const cls = level.toLowerCase() as Lowercase<RiskLevel>;
  return (
    <span className={`badge badge--${cls}`} aria-label={`Risk level: ${level}`}>
      <span aria-hidden="true" style={{ fontSize: '0.6em' }}>{DOTS[level]}</span>
      {level}
    </span>
  );
}
