import { useEffect } from 'react';
import { X, AlertTriangle, Copy, Clock, ExternalLink } from 'lucide-react';
import type { FraudIndicator } from '../../types/fraud';
import { INDICATOR_META } from '../../types/fraud';
import RiskLevelBadge from './RiskLevelBadge';

interface Props {
  indicator: FraudIndicator;
  onClose: () => void;
}

const TYPE_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  IDENTITY_MISMATCH:    AlertTriangle,
  DOCUMENT_DUPLICATION: Copy,
  METADATA_ANOMALY:     Clock,
};

const DETECTOR_LABELS: Record<string, string> = {
  IDENTITY_MISMATCH:    'IdentityMismatchDetector (Levenshtein)',
  DOCUMENT_DUPLICATION: 'DocumentDuplicationDetector (SHA-256)',
  METADATA_ANOMALY:     'MetadataAnomalyDetector (Timestamp)',
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
  const Icon = TYPE_ICONS[indicator.type] ?? AlertTriangle;

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
            <Icon size={18} aria-hidden="true" style={{ color: 'var(--color-slate-500)' }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                {meta?.label ?? indicator.type.replace(/_/g, ' ')}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-500)' }}>
                Indicator Detail & Evidence
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
            <div className="evidence-item__label" style={{ marginBottom: 'var(--space-2)' }}>Severity</div>
            <RiskLevelBadge level={indicator.severity} />
          </div>

          {/* Detector */}
          <EvidenceItem
            label="Detection Method"
            value={DETECTOR_LABELS[indicator.type] ?? indicator.type}
          />

          {/* Description */}
          <div className="evidence-item">
            <div className="evidence-item__label">Description</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-slate-700)', lineHeight: 1.6 }}>
              {indicator.description}
            </div>
          </div>

          {/* Evidence references */}
          {indicator.evidence.length > 0 && (
            <div className="evidence-item">
              <div className="evidence-item__label">Evidence References</div>
              {indicator.evidence.map((ev, i) => (
                <div key={i} className="evidence-item__value" style={{ marginBottom: 'var(--space-1)' }}>
                  {ev}
                </div>
              ))}
            </div>
          )}

          {/* Indicator-specific guidance */}
          {indicator.type === 'DOCUMENT_DUPLICATION' && (
            <div className="evidence-item">
              <div className="evidence-item__label">How this was detected</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-slate-700)', lineHeight: 1.6 }}>
                The SHA-256 cryptographic hash of the uploaded file was computed and compared
                against all other document hashes submitted for this tender. Identical hashes
                indicate byte-for-byte identical file content. Manual review is required to
                determine whether the reuse is legitimate.
              </div>
            </div>
          )}

          {indicator.type === 'IDENTITY_MISMATCH' && (
            <div className="evidence-item">
              <div className="evidence-item__label">How this was detected</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-slate-700)', lineHeight: 1.6 }}>
                The bidder's registered legal name was compared against entity names
                extracted from submitted documents using edit-distance (Levenshtein) analysis.
                A mismatch was detected beyond the acceptable threshold after normalising
                common legal suffixes (Pvt Ltd, Limited, etc.).
              </div>
            </div>
          )}

          {indicator.type === 'METADATA_ANOMALY' && (
            <div className="evidence-item">
              <div className="evidence-item__label">How this was detected</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-slate-700)', lineHeight: 1.6 }}>
                Document upload timestamps and extracted certificate issue dates were
                compared against the official tender closing date. Anomalies include
                post-deadline uploads, certificates issued after the closing date, and
                suspicious simultaneous batch uploads.
              </div>
            </div>
          )}

          {/* Recommendation */}
          {meta?.recommendation && (
            <div className="alert alert--warning" style={{ marginTop: 'var(--space-4)' }}>
              <AlertTriangle size={16} className="alert__icon" aria-hidden="true" />
              <div>
                <div className="alert__title">Recommended Action</div>
                {meta.recommendation}
              </div>
            </div>
          )}

          <div className="alert alert--info" style={{ marginTop: 'var(--space-4)' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-600)' }}>
              This indicator is flagged for officer review. The system does not determine
              fraud — the Procurement Officer is the final decision-maker.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
