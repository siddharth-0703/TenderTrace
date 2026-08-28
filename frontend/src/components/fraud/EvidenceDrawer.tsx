import { useEffect } from 'react';
import { X, AlertTriangle, Copy, Clock, FileText, Layers, Calendar, ShieldAlert } from 'lucide-react';
import type { FraudIndicator } from '../../types/fraud';
import { INDICATOR_META } from '../../types/fraud';
import RiskLevelBadge from './RiskLevelBadge';

interface Props {
  indicator: FraudIndicator;
  onClose: () => void;
}

function getDrawerIcon(type: string) {
  switch (type) {
    case 'IDENTITY_MISMATCH':    return <AlertTriangle size={20} style={{ color: 'var(--color-danger)' }} />;
    case 'DOCUMENT_DUPLICATION': return <Copy size={20} style={{ color: 'var(--color-critical)' }} />;
    case 'METADATA_ANOMALY':     return <Clock size={20} style={{ color: 'var(--color-warning)' }} />;
    case 'COMPANY_INCONSISTENCY': return <Layers size={20} style={{ color: 'var(--color-warning)' }} />;
    case 'CROSS_BID_SIMILARITY': return <FileText size={20} style={{ color: 'var(--color-navy-500)' }} />;
    case 'SUSPICIOUS_DATE':      return <Calendar size={20} style={{ color: 'var(--color-danger)' }} />;
    default:                     return <ShieldAlert size={20} style={{ color: 'var(--color-warning)' }} />;
  }
}

const DETECTOR_LABELS: Record<string, string> = {
  IDENTITY_MISMATCH:    'IdentityMismatchDetector (Levenshtein Distance & Entity Normalization)',
  DOCUMENT_DUPLICATION: 'DocumentDuplicationDetector (Cryptographic SHA-256 Collision)',
  METADATA_ANOMALY:     'MetadataAnomalyDetector (Forensic Timestamps & Batch Signatures)',
  COMPANY_INCONSISTENCY: 'CompanyConsistencyDetector (Cross-Dossier Reconciliation)',
  CROSS_BID_SIMILARITY: 'CrossBidSimilarityDetector (N-Gram Overlap & Structural Collusion)',
  SUSPICIOUS_DATE:      'MetadataAnomalyDetector (Chronology & Validity Verification)',
  STRUCTURAL_ANOMALY:   'DocumentForensics (Document Structure & Layout Analysis)',
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

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent body scrolling while modal is active
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div
      className="drawer-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      <div className="drawer">
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            {getDrawerIcon(indicator.type)}
            <div>
              <div id="drawer-title" style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--color-slate-900)' }}>
                {indicator.title || meta?.label || indicator.type.replace(/_/g, ' ')}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Forensic Analysis &amp; Audit Traceability Payload
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            aria-label="Close forensic details panel"
            style={{ padding: '6px', borderRadius: '50%' }}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="drawer-body">
          {/* Severity & Detector Category */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-color)' }}>
            <div>
              <div className="evidence-item__label">Severity Classification</div>
              <RiskLevelBadge level={indicator.severity} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="evidence-item__label">Investigation Impact</div>
              <span className="badge badge--neutral font-mono">{indicator.severity === 'CRITICAL' ? 'BLOCKER' : 'MANUAL REVIEW'}</span>
            </div>
          </div>

          {/* Detector Method */}
          <EvidenceItem
            label="Detection Engine / Heuristic"
            value={indicator.detector || DETECTOR_LABELS[indicator.type] || indicator.type}
          />

          {/* Complete Finding Description */}
          <div className="evidence-item">
            <div className="evidence-item__label">Comprehensive Finding Narrative</div>
            <div style={{ fontSize: '13px', color: 'var(--color-slate-800)', lineHeight: 1.6, background: 'var(--color-slate-50)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              {indicator.description}
            </div>
          </div>

          {/* Structured Forensic Evidence Comparison */}
          {indicator.structuredEvidence && indicator.structuredEvidence.length > 0 && (
            <div className="evidence-item">
              <div className="evidence-item__label">Structured Forensic Comparison Points</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                {indicator.structuredEvidence.map((st, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'var(--color-white)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '12px',
                      fontSize: '12px',
                      boxShadow: 'var(--shadow-xs)',
                    }}
                  >
                    {st.field && (
                      <div style={{ marginBottom: '4px' }}>
                        <strong style={{ color: 'var(--color-slate-700)' }}>Target Field:</strong> <code style={{ color: 'var(--color-navy-700)', fontWeight: 600 }}>{st.field}</code>
                      </div>
                    )}
                    {st.value && (
                      <div style={{ marginTop: '2px' }}>
                        <strong style={{ color: 'var(--color-slate-700)' }}>Observed Value:</strong> <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>"{st.value}"</span>
                      </div>
                    )}
                    {st.expectedValue && (
                      <div style={{ marginTop: '2px' }}>
                        <strong style={{ color: 'var(--color-slate-700)' }}>Expected Value:</strong> <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>"{st.expectedValue}"</span>
                      </div>
                    )}
                    {st.matchedBidId && (
                      <div style={{ marginTop: '2px' }}>
                        <strong style={{ color: 'var(--color-slate-700)' }}>Matched Cross-Bid ID:</strong> <span className="font-mono">{st.matchedBidId}</span>
                      </div>
                    )}
                    {st.details && (
                      <div style={{ marginTop: '6px', color: 'var(--text-muted)', fontSize: '11px', borderTop: '1px dashed var(--border-color)', paddingTop: '4px' }}>
                        {st.details}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evidence Document / Hash References */}
          {indicator.evidence && indicator.evidence.length > 0 && (
            <div className="evidence-item">
              <div className="evidence-item__label">Linked Dossier Document Identifiers &amp; SHA-256 Hashes</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                {indicator.evidence.map((ev, i) => (
                  <div
                    key={i}
                    className="font-mono"
                    style={{
                      fontSize: '11px',
                      background: 'var(--color-slate-50)',
                      border: '1px solid var(--border-color)',
                      padding: '6px 10px',
                      borderRadius: '4px',
                      wordBreak: 'break-all',
                      color: 'var(--color-slate-700)'
                    }}
                  >
                    {ev}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Recommendation */}
          {(indicator.recommendation || meta?.recommendation) && (
            <div className="alert-box alert-warning" style={{ marginTop: 'var(--space-6)', marginBottom: 0 }}>
              <AlertTriangle size={18} color="var(--color-warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '2px' }}>
                  Recommended Action for Tender Committee
                </div>
                <div style={{ fontSize: '12px' }}>
                  {indicator.recommendation || meta?.recommendation}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
