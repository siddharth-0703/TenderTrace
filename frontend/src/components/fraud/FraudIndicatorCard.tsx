import { useState } from 'react';
import { ChevronDown, ChevronUp, Eye, AlertTriangle, Copy, Clock, Layers, FileText, Calendar } from 'lucide-react';
import type { FraudIndicator } from '../../types/fraud';
import { INDICATOR_META } from '../../types/fraud';
import RiskLevelBadge from './RiskLevelBadge';
import EvidenceDrawer from './EvidenceDrawer';

interface Props {
  indicator: FraudIndicator;
  index?: number;
}

function getIndicatorIcon(type: string) {
  switch (type) {
    case 'IDENTITY_MISMATCH':    return <AlertTriangle size={16} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />;
    case 'DOCUMENT_DUPLICATION': return <Copy size={16} style={{ color: 'var(--color-critical)', flexShrink: 0 }} />;
    case 'METADATA_ANOMALY':     return <Clock size={16} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />;
    case 'COMPANY_INCONSISTENCY': return <Layers size={16} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />;
    case 'CROSS_BID_SIMILARITY': return <FileText size={16} style={{ color: 'var(--color-navy-500)', flexShrink: 0 }} />;
    case 'SUSPICIOUS_DATE':      return <Calendar size={16} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />;
    default:                     return <AlertTriangle size={16} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />;
  }
}

function IndicatorTypeLabel({ type, title }: { type: string; title?: string }) {
  if (title) return <>{title}</>;
  const meta = INDICATOR_META[type as keyof typeof INDICATOR_META];
  return <>{meta?.label ?? type.replace(/_/g, ' ')}</>;
}

export default function FraudIndicatorCard({ indicator }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const levelCls = indicator.severity.toLowerCase();
  const meta = INDICATOR_META[indicator.type];

  return (
    <>
      <article
        className={`indicator-card indicator-card--${levelCls}`}
        aria-label={`${indicator.type} indicator — ${indicator.severity} severity`}
      >
        {/* Header row — always visible */}
        <div
          className="indicator-card__header"
          onClick={() => setExpanded((e) => !e)}
          role="button"
          tabIndex={0}
          aria-expanded={expanded}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setExpanded((ex) => !ex);
            }
          }}
        >
          <div className="indicator-card__title-row">
            {getIndicatorIcon(indicator.type)}
            <span className="indicator-card__type">
              <IndicatorTypeLabel type={indicator.type} title={indicator.title} />
            </span>
            <RiskLevelBadge level={indicator.severity} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {expanded ? 'Hide Details' : 'View Finding'}
            </span>
            <span aria-hidden="true" style={{ color: 'var(--color-slate-400)', display: 'flex' }}>
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
          </div>
        </div>

        {/* Expanded body */}
        {expanded && (
          <div className="animate-fadeIn">
            <div className="indicator-card__desc">
              <p style={{ color: 'var(--color-slate-800)', fontSize: '13px', lineHeight: 1.6 }}>
                {indicator.description}
              </p>

              {indicator.structuredEvidence && indicator.structuredEvidence.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-slate-500)', marginBottom: '6px' }}>
                    Key Forensic Comparison Points
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {indicator.structuredEvidence.map((st, i) => (
                      <div
                        key={i}
                        style={{
                          fontSize: '12px',
                          background: 'var(--color-white)',
                          border: '1px solid var(--border-color)',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                        }}
                      >
                        {st.field && (
                          <div style={{ fontWeight: 600, color: 'var(--color-slate-700)' }}>
                            Field Analyzed: <code style={{ color: 'var(--color-navy-700)', fontWeight: 700 }}>{st.field}</code>
                          </div>
                        )}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginTop: '2px' }}>
                          {st.value && (
                            <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>
                              Observed: "{st.value}"
                            </span>
                          )}
                          {st.expectedValue && (
                            <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                              (Expected: "{st.expectedValue}")
                            </span>
                          )}
                        </div>
                        {st.details && (
                          <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px' }}>
                            {st.details}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {indicator.evidence && indicator.evidence.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-slate-500)', marginBottom: '6px' }}>
                    Supporting Document Artifacts
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {indicator.evidence.map((ev, i) => (
                      <span key={i} className="badge badge--neutral font-mono" style={{ fontSize: '11px' }}>
                        {ev.slice(0, 16)}…
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {(indicator.recommendation || meta?.recommendation) && (
              <div className="indicator-card__recommendation">
                <AlertTriangle size={15} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
                <span>
                  <strong>Officer Guidance:</strong> {indicator.recommendation || meta?.recommendation}
                </span>
              </div>
            )}

            <div className="indicator-card__footer">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setDrawerOpen(true)}
                aria-label={`View full forensic details for ${indicator.type} indicator`}
              >
                <Eye size={13} aria-hidden="true" />
                <span>Examine Forensic Evidence</span>
              </button>
            </div>
          </div>
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
