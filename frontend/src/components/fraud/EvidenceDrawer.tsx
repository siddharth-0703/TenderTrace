import { useEffect } from 'react';
import { X, AlertTriangle, Copy, Clock, FileText, Layers, Calendar } from 'lucide-react';
import type { FraudIndicator } from '../../types/fraud';
import { INDICATOR_META } from '../../types/fraud';
import RiskLevelBadge from './RiskLevelBadge';

interface Props {
  indicator: FraudIndicator;
  onClose: () => void;
}

function getDrawerIcon(type: string) {
  switch (type) {
    case 'IDENTITY_MISMATCH':    return <AlertTriangle size={18} style={{ color: 'var(--color-slate-500)' }} />;
    case 'DOCUMENT_DUPLICATION': return <Copy size={18} style={{ color: 'var(--color-slate-500)' }} />;
    case 'METADATA_ANOMALY':     return <Clock size={18} style={{ color: 'var(--color-slate-500)' }} />;
    case 'COMPANY_INCONSISTENCY': return <Layers size={18} style={{ color: 'var(--color-slate-500)' }} />;
    case 'CROSS_BID_SIMILARITY': return <FileText size={18} style={{ color: 'var(--color-slate-500)' }} />;
    case 'SUSPICIOUS_DATE':      return <Calendar size={18} style={{ color: 'var(--color-slate-500)' }} />;
    default:                     return <AlertTriangle size={18} style={{ color: 'var(--color-slate-500)' }} />;
  }
}

const DETECTOR_LABELS: Record<string, string> = {
  IDENTITY_MISMATCH:    'IdentityMismatchDetector (Levenshtein & Normalization)',
  DOCUMENT_DUPLICATION: 'DocumentDuplicationDetector (SHA-256 Collision)',
  METADATA_ANOMALY:     'MetadataAnomalyDetector (Forensic Timestamps)',
  COMPANY_INCONSISTENCY: 'CompanyConsistencyDetector (Statutory & Corporate Reconciliation)',
  CROSS_BID_SIMILARITY: 'CrossBidSimilarityDetector (N-Gram & Text Overlap)',
  SUSPICIOUS_DATE:      'MetadataAnomalyDetector (Chronology & Validity Verification)',
  STRUCTURAL_ANOMALY:   'DocumentForensics (Structural Analysis)',
};

function EvidenceItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="evidence-item">
      <div className="evidence-item__label">{label}</div>
      <div className="evidence-item__value">{value}</div>
    </div>
  );
}

export default function EvidenceDrawer({ indicator, onClose }: Props) {
  const meta = INDICATOR_META[indicator.type];

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="drawer-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="drawer" role="dialog" aria-modal="true" aria-label="Indicator evidence details">
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            {getDrawerIcon(indicator.type)}
            <div>
              <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                {indicator.title || meta?.label || indicator.type.replace(/_/g, ' ')}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-500)' }}>
                Indicator Detail &amp; Structured Forensic Evidence
              </div>
            </div>
          </div>
          <button className="btn btn--ghost btn--sm" onClick={onClose} aria-label="Close details panel">
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="drawer-body">
          {/* Severity */}
          <div style={{ marginBottom: 'var(--space-5)' }}>
            <div className="evidence-item__label" style={{ marginBottom: 'var(--space-2)' }}>Severity Level</div>
            <RiskLevelBadge level={indicator.severity} />
          </div>

          {/* Detector */}
          <EvidenceItem
            label="Detection Method"
            value={indicator.detector || DETECTOR_LABELS[indicator.type] || indicator.type}
          />

          {/* Description */}
          <div className="evidence-item">
            <div className="evidence-item__label">Finding Description</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-slate-700)', lineHeight: 1.6 }}>
              {indicator.description}
            </div>
          </div>

          {/* Structured Forensic Evidence */}
          {indicator.structuredEvidence && indicator.structuredEvidence.length > 0 && (
            <div className="evidence-item">
              <div className="evidence-item__label">Structured Forensic Comparison Points</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                {indicator.structuredEvidence.map((st, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'var(--color-slate-50)',
                      border: '1px solid var(--color-slate-200)',
                      borderRadius: 6,
                      padding: 'var(--space-3)',
                      fontSize: 'var(--text-xs)'
                    }}
                  >
                    {st.field && (
                      <div><strong style={{ color: 'var(--color-slate-700)' }}>Field:</strong> <code>{st.field}</code></div>
                    )}
                    {st.value && (
                      <div style={{ marginTop: 2 }}>
                        <strong style={{ color: 'var(--color-slate-700)' }}>Observed Value:</strong> <span style={{ color: 'var(--color-danger)' }}>{st.value}</span>
                      </div>
                    )}
                    {st.expectedValue && (
                      <div style={{ marginTop: 2 }}>
                        <strong style={{ color: 'var(--color-slate-700)' }}>Expected Value:</strong> <span style={{ color: 'var(--color-success)' }}>{st.expectedValue}</span>
                      </div>
                    )}
                    {st.matchedBidId && (
                      <div style={{ marginTop: 2 }}>
                        <strong style={{ color: 'var(--color-slate-700)' }}>Matched Bid:</strong> <span className="font-mono">{st.matchedBidId}</span>
                      </div>
                    )}
                    {st.details && (
                      <div style={{ marginTop: 4, color: 'var(--color-slate-600)', fontStyle: 'italic' }}>
                        {st.details}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evidence document references */}
          {indicator.evidence && indicator.evidence.length > 0 && (
            <div className="evidence-item">
              <div className="evidence-item__label">Supporting Document / Bid Identifiers</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)', marginTop: 'var(--space-1)' }}>
                {indicator.evidence.map((ev, i) => (
                  <span key={i} className="badge badge--neutral font-mono" style={{ fontSize: 11 }}>
                    {ev}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recommendation */}
          {(indicator.recommendation || meta?.recommendation) && (
            <div className="alert alert--warning" style={{ marginTop: 'var(--space-4)' }}>
              <AlertTriangle size={16} className="alert__icon" aria-hidden="true" />
              <div>
                <div className="alert__title">Recommended Officer Action</div>
                {indicator.recommendation || meta?.recommendation}
              </div>
            </div>
          )}

          <div className="alert alert--info" style={{ marginTop: 'var(--space-4)' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-600)' }}>
              This finding provides decision support for procurement evaluation. The Procurement Officer is the final authorized decision-maker.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

