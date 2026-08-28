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
  indicatorCount,
}: Props) {
  const levelCls = riskLevel.toLowerCase();
  const barWidth = `${Math.min(100, Math.max(0, riskScore))}%`;

  return (
    <div className={`risk-score-card risk-score-card--${levelCls}`}>
      <div>
        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>
          Anomaly Score
        </div>
        <div aria-label={`Risk score: ${riskScore} out of 100`}>
          <span className="risk-score-card__number">{riskScore}</span>
          <span className="risk-score-card__denom"> / 100</span>
        </div>
      </div>

      <div className="risk-score-card__meta">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-slate-900)' }}>
            Fraud &amp; Collusion Risk Assessment
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RiskLevelBadge level={riskLevel} />
            {investigationPriority && (
              <span
                className="badge"
                style={{
                  background: 'var(--color-warning-bg)',
                  borderColor: 'var(--color-warning-border)',
                  color: 'var(--color-warning)',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                Priority: {investigationPriority}
              </span>
            )}
          </div>
        </div>

        {/* Segmented Score Meter */}
        <div className="score-bar-track" role="progressbar" aria-valuenow={riskScore} aria-valuemin={0} aria-valuemax={100}>
          <div
            className={`score-bar-fill score-bar-fill--${levelCls}`}
            style={{ width: barWidth }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '6px', fontSize: '12px' }}>
          {confidence != null && (
            <span style={{ color: 'var(--text-muted)' }}>
              Confidence: <strong style={{ color: 'var(--color-slate-800)' }}>{confidence}%</strong> (Evidence-Backed)
            </span>
          )}
          <span style={{ color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--color-slate-800)' }}>{indicatorCount}</strong> indicator{indicatorCount !== 1 ? 's' : ''} detected
          </span>
        </div>

        <p className="risk-score-card__interp">
          {getRiskInterpretation(riskLevel)}
        </p>
      </div>
    </div>
  );
}
