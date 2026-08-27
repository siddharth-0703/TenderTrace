import type { FraudIndicator, IndicatorSeverity } from '../../types/fraud';
import FraudIndicatorCard from './FraudIndicatorCard';

interface Props {
  indicators: FraudIndicator[];
}

const ORDER: IndicatorSeverity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL'];

const GROUP_LABELS: Record<IndicatorSeverity, string> = {
  CRITICAL:      'Critical Indicators',
  HIGH:          'High Severity Indicators',
  MEDIUM:        'Medium Severity Indicators',
  LOW:           'Low Severity Indicators',
  INFORMATIONAL: 'Informational Observations',
};

export default function FraudIndicatorList({ indicators }: Props) {
  if (indicators.length === 0) {
    return (
      <div className="state-box">
        <div className="state-box__title">No Suspicious Indicators</div>
        <div className="state-box__desc">
          No anomalies were detected for this bid. Standard procurement due diligence is recommended.
        </div>
      </div>
    );
  }

  const grouped: Record<IndicatorSeverity, FraudIndicator[]> = {
    CRITICAL: [],
    HIGH: [],
    MEDIUM: [],
    LOW: [],
    INFORMATIONAL: []
  };

  for (const ind of indicators) {
    if (grouped[ind.severity]) {
      grouped[ind.severity].push(ind);
    } else {
      grouped.LOW.push(ind);
    }
  }

  let globalIndex = 0;

  return (
    <div>
      {ORDER.filter(sev => grouped[sev] && grouped[sev].length > 0).map(sev => (
        <div key={sev} className="section" style={{ marginBottom: 'var(--space-4)' }}>
          <div className="section-title">
            {GROUP_LABELS[sev]}
            <span className="badge badge--neutral">{grouped[sev].length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {grouped[sev].map((ind: FraudIndicator) => (
              <FraudIndicatorCard
                key={`${ind.type}-${globalIndex}`}
                indicator={ind}
                index={globalIndex++}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

