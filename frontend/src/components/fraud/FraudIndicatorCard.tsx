import { useState } from 'react';
import { ChevronDown, ChevronUp, Eye, AlertTriangle, Copy, FileSearch, Clock } from 'lucide-react';
import type { FraudIndicator } from '../../types/fraud';
import { INDICATOR_META } from '../../types/fraud';
import RiskLevelBadge from './RiskLevelBadge';
import EvidenceDrawer from './EvidenceDrawer';

interface Props {
  indicator: FraudIndicator;
  index: number;
}

const TYPE_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  IDENTITY_MISMATCH:    AlertTriangle,
  DOCUMENT_DUPLICATION: Copy,
  METADATA_ANOMALY:     Clock,
};

function IndicatorTypeLabel({ type }: { type: string }) {
  const meta = INDICATOR_META[type as keyof typeof INDICATOR_META];
  return <>{meta?.label ?? type.replace(/_/g, ' ')}</>;
}

export default function FraudIndicatorCard({ indicator, index }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const levelCls = indicator.severity.toLowerCase();
  const meta = INDICATOR_META[indicator.type];
  const Icon = TYPE_ICONS[indicator.type] ?? AlertTriangle;

  return (
    <>
      <article
        className={`indicator-card indicator-card--${levelCls}`}
        aria-label={`${indicator.type} indicator — ${indicator.severity} severity`}
      >
        {/* Header row — always visible */}
        <div
          className="indicator-card__header"
          onClick={() => setExpanded(e => !e)}
          role="button"
          tabIndex={0}
          aria-expanded={expanded}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setExpanded(ex => !ex); }}
        >
          <div className="indicator-card__title-row">
            <Icon size={16} aria-hidden="true" style={{ color: 'var(--color-slate-400)', flexShrink: 0 }} />
            <span className="indicator-card__type">
              <IndicatorTypeLabel type={indicator.type} />
            </span>
            <RiskLevelBadge level={indicator.severity} />
          </div>
          <span aria-hidden="true" style={{ color: 'var(--color-slate-400)', flexShrink: 0 }}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </div>

        {/* Expanded body */}
        {expanded && (
          <>
            <div className="indicator-card__desc">
              <p>{indicator.description}</p>

              {indicator.evidence.length > 0 && (
                <div style={{ marginTop: 'var(--space-3)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-slate-500)', marginBottom: 'var(--space-2)' }}>
                    Evidence References
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                    {indicator.evidence.map((ev, i) => (
                      <span key={i} className="badge badge--neutral font-mono">{ev.slice(0, 12)}…</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {meta?.recommendation && (
              <div className="indicator-card__recommendation">
                <AlertTriangle size={14} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
                <span><strong>Recommendation:</strong> {meta.recommendation}</span>
              </div>
            )}

            <div className="indicator-card__footer">
              <button
                className="btn btn--secondary btn--sm"
                onClick={() => setDrawerOpen(true)}
                aria-label={`View full details for ${indicator.type} indicator`}
              >
                <Eye size={14} aria-hidden="true" />
                View Details
              </button>
            </div>
          </>
        )}
      </article>

      {drawerOpen && (
        <EvidenceDrawer
          indicator={indicator}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </>
  );
}
