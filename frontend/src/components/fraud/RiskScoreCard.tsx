import type { InvestigationPriority, RiskLevel } from '../../types/fraud';
import { getRiskInterpretation } from '../../types/fraud';
import RiskLevelBadge from './RiskLevelBadge';

interface Props {
  riskScore: number;
  riskLevel: RiskLevel;
  confidence?: number | null;
  investigationPriority?: InvestigationPriority | null;
  indicatorCount: number;
}

export default function RiskScoreCard({
  riskScore,
  riskLevel,
  confidence,
  investigationPriority,
  indicatorCount
}: Props) {
  const levelCls = riskLevel.toLowerCase();
  const barWidth = `${Math.min(100, riskScore)}%`;

  return (
    <div className={`risk-score-card risk-score-card--${levelCls}`}>
      <div>
        <div aria-label={`Risk score: ${riskScore} out of 100`}>
          <span className="risk-score-card__number">{riskScore}</span>
          <span className="risk-score-card__denom"> / 100</span>
        </div>
      </div>

      <div className="risk-score-card__meta">
        <div className="risk-score-card__label">Fraud &amp; Anomaly Risk Score</div>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
          <RiskLevelBadge level={riskLevel} />
          {investigationPriority && (
            <span className="badge badge--warning" style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>
              Priority: {investigationPriority}
            </span>
          )}
          {confidence != null && (
            <span className="badge badge--neutral" style={{ fontSize: 'var(--text-xs)' }}>
              Confidence: {confidence}% (Evidence-Backed)
            </span>
          )}
          <span className="text-muted text-sm">
            {indicatorCount} indicator{indicatorCount !== 1 ? 's' : ''} detected
          </span>
        </div>

        <div className="score-bar-track" role="progressbar" aria-valuenow={riskScore} aria-valuemin={0} aria-valuemax={100}>
          <div
            className={`score-bar-fill score-bar-fill--${levelCls}`}
            style={{ width: barWidth }}
          />
        </div>

        <p className="risk-score-card__interp">
          {getRiskInterpretation(riskLevel)}
        </p>
      </div>
    </div>
  );
}

