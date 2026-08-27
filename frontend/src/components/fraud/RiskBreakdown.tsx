import type { FraudIndicator } from '../../types/fraud';
import { SEVERITY_SCORE } from '../../types/fraud';
import RiskLevelBadge from './RiskLevelBadge';
import type { RiskLevel } from '../../types/fraud';

interface Props {
  indicators: FraudIndicator[];
  riskScore: number;
}

function IndicatorTypeLabel({ type }: { type: string }) {
  const labels: Record<string, string> = {
    IDENTITY_MISMATCH:    'Identity Mismatch',
    DOCUMENT_DUPLICATION: 'Document Duplication',
    METADATA_ANOMALY:     'Metadata Anomaly',
  };
  return <>{labels[type] ?? type}</>;
}

export default function RiskBreakdown({ indicators, riskScore }: Props) {
  if (indicators.length === 0) return null;

  // Group by type and sum points
  const byType = indicators.reduce<Record<string, { count: number; points: number }>>((acc, ind) => {
    const pts = SEVERITY_SCORE[ind.severity] ?? 0;
    if (!acc[ind.type]) acc[ind.type] = { count: 0, points: 0 };
    acc[ind.type].count++;
    acc[ind.type].points += pts;
    return acc;
  }, {});

  return (
    <div className="card">
      <div className="card-body">
        <h3 style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
          Risk Score Breakdown
        </h3>
        <table className="breakdown-table" aria-label="Risk score breakdown by indicator type">
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--color-slate-500)', fontWeight: 600 }}>
                Indicator Type
              </th>
              <th style={{ textAlign: 'center', padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--color-slate-500)', fontWeight: 600 }}>
                Count
              </th>
              <th style={{ textAlign: 'right', padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--color-slate-500)', fontWeight: 600 }}>
                Points
              </th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(byType).map(([type, { count, points }]) => (
              <tr key={type}>
                <td style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--color-slate-700)' }}>
                  <IndicatorTypeLabel type={type} />
                </td>
                <td style={{ textAlign: 'center', padding: 'var(--space-2) var(--space-3)', color: 'var(--color-slate-500)', fontSize: 'var(--text-sm)' }}>
                  {count}
                </td>
                <td className="breakdown-pts" style={{ color: 'var(--color-slate-700)', padding: 'var(--space-2) var(--space-3)' }}>
                  +{points}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="total-row">
              <td colSpan={2} style={{ fontWeight: 600, padding: 'var(--space-3)', fontSize: 'var(--text-sm)', borderTop: '2px solid var(--border-color)' }}>
                Total (capped at 100)
              </td>
              <td className="breakdown-pts" style={{ fontWeight: 700, padding: 'var(--space-3)', borderTop: '2px solid var(--border-color)', color: 'var(--color-slate-900)' }}>
                {riskScore} / 100
              </td>
            </tr>
          </tfoot>
        </table>
        <p className="text-xs text-muted" style={{ marginTop: 'var(--space-3)' }}>
          Scoring: LOW +5 · MEDIUM +15 · HIGH +25 · CRITICAL +40 (capped at 100)
        </p>
      </div>
    </div>
  );
}
