import type { FraudIndicator, IndicatorSeverity } from '../../types/fraud';
import FraudIndicatorCard from './FraudIndicatorCard';

interface Props {
  indicators: FraudIndicator[];
}

const ORDER: IndicatorSeverity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

const GROUP_LABELS: Record<IndicatorSeverity, string> = {
  CRITICAL: 'Critical Indicators',
  HIGH:     'High Severity Indicators',
  MEDIUM:   'Medium Severity Indicators',
  LOW:      'Low Severity Indicators',
};

export default function FraudIndicatorList({ indicators }: Props) {
  if (indicators.length === 0) {
    return (
      <div className="state-box">
        <div className="state-box__title">No Suspicious Indicators</div>
        <div className="state-box__desc">
          No anomalies were detected for this bid. Low risk does not guarantee
          the absence of fraud — manual verification is always recommended.
        </div>
      </div>
    );
  }

  const grouped = ORDER.reduce<Record<IndicatorSeverity, FraudIndicator[]>>(
    (acc, sev) => {
      acc[sev] = indicators.filter(ind => ind.severity === sev);
      return acc;
    },
    { CRITICAL: [], HIGH: [], MEDIUM: [], LOW: [] }
  );

  let globalIndex = 0;

  return (
    <div>
      {ORDER.filter(sev => grouped[sev].length > 0).map(sev => (
        <div key={sev} className="section">
          <div className="section-title">
            {GROUP_LABELS[sev]}
            <span className="badge badge--neutral">{grouped[sev].length}</span>
          </div>
          {grouped[sev].map(ind => (
            <FraudIndicatorCard
              key={`${ind.type}-${globalIndex}`}
              indicator={ind}
              index={globalIndex++}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
