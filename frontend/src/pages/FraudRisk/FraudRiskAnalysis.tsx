import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, AlertCircle, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { BidSummary, FraudAnalysis } from '../../types/fraud';
import { fetchFraudAnalysis, runAnalysis } from '../../services/api/fraudApi';
import { fetchAllBids } from '../../services/api/bidsApi';
import RiskScoreCard from '../../components/fraud/RiskScoreCard';
import RiskBreakdown from '../../components/fraud/RiskBreakdown';
import FraudIndicatorList from '../../components/fraud/FraudIndicatorList';
import ReviewNotice from '../../components/fraud/ReviewNotice';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function FraudRiskAnalysis() {
  const { bidId } = useParams<{ bidId: string }>();
  const [analysis, setAnalysis] = useState<FraudAnalysis | null>(null);
  const [bid, setBid] = useState<BidSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!bidId) return;
    setLoading(true);
    setError(null);
    try {
      const [fa, bids] = await Promise.all([
        fetchFraudAnalysis(bidId),
        fetchAllBids(),
      ]);
      setAnalysis(fa);
      setBid(bids.find((b) => b.id === bidId) ?? null);
    } catch (e: any) {
      setError(e.message || 'Failed to retrieve forensic analysis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [bidId]);

  const handleRunAnalysis = async () => {
    if (!bidId) return;
    setRunning(true);
    setError(null);
    try {
      await runAnalysis(bidId);
      await load();
    } catch (e: any) {
      setError(e.message || 'Failed to execute fraud analysis engine');
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Retrieving multi-dossier forensic analysis &amp; collusion markers..." />;
  }

  if (error && !analysis) {
    return (
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <ErrorState
          title="Unable to Retrieve Forensic Risk Analysis"
          message={error}
          onRetry={load}
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* ── Breadcrumbs ── */}
      <div className="breadcrumb">
        <Link to="/fraud-risk">Fraud &amp; Risk Intelligence</Link>
        <span className="sep">›</span>
        {bid && (
          <>
            <Link to={`/bids/${bid.id}`}>Bid Workspace</Link>
            <span className="sep">›</span>
          </>
        )}
        <span className="current">Forensic Assessment</span>
      </div>

      {/* ── Page Header ── */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge--neutral font-mono">
                BID: {bidId?.substring(0, 8)}
              </span>
              <span className="badge badge--info font-mono">FORENSIC DOSSIER</span>
            </div>
            <h1>Fraud &amp; Collusion Forensic Assessment</h1>
            <div className="subtitle">
              Automated anomaly scoring, identity verification distance, SHA-256 collisions, and timeline reconciliation
            </div>

            {bid && (
              <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '13px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Bidder Legal Entity
                  </span>
                  <div style={{ fontWeight: 600, color: 'var(--color-slate-900)' }}>
                    {bid.bidder.legalName}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Tender Reference
                  </span>
                  <div style={{ fontWeight: 600, color: 'var(--color-slate-900)' }}>
                    {bid.tender.tenderNumber}
                  </div>
                </div>
                {analysis && (
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Analyzed Timestamp
                    </span>
                    <div style={{ color: 'var(--text-secondary)' }}>
                      {formatDate(analysis.createdAt)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {bid && (
              <Link to={`/bids/${bid.id}`} className="btn btn-secondary btn-sm">
                <ArrowLeft size={13} /> Bid Compliance
              </Link>
            )}
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleRunAnalysis}
              disabled={running}
              aria-label="Re-run fraud analysis engine"
            >
              <RefreshCw size={13} className={running ? 'animate-spin' : ''} />
              <span>{running ? 'Running Engine…' : 'Re-run Analysis'}</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert-box alert-error" style={{ marginBottom: '20px' }}>
          <AlertCircle size={16} color="var(--color-danger)" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Main Analysis Content ── */}
      {!analysis ? (
        <EmptyState
          title="No Forensic Analysis Available"
          message="This bid has not been evaluated by the Fraud & Anomaly Engine yet."
          action={
            <button className="btn btn-primary" onClick={handleRunAnalysis} disabled={running}>
              {running ? 'Evaluating Forensic Dossier…' : 'Run Forensic Evaluation'}
            </button>
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Human Decision Support Guardrail Banner */}
          <ReviewNotice />

          {/* Primary Risk Score Card */}
          <RiskScoreCard
            riskScore={analysis.riskScore}
            riskLevel={analysis.riskLevel}
            confidence={analysis.confidence}
            investigationPriority={analysis.investigationPriority}
            indicatorCount={analysis.indicators?.length ?? 0}
          />

          {/* Correlated Evidence Clusters */}
          {analysis.correlatedFindings && analysis.correlatedFindings.length > 0 && (
            <div className="card" style={{ borderLeft: '4px solid var(--color-danger)' }}>
              <div className="card-header" style={{ background: 'var(--color-slate-50)' }}>
                <span className="card-title" style={{ color: 'var(--color-danger)' }}>
                  <ShieldAlert size={16} color="var(--color-danger)" />
                  Correlated Risk Clusters ({analysis.correlatedFindings.length})
                </span>
                <span className="badge badge--critical font-mono">ELEVATED PRIORITY</span>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {analysis.correlatedFindings.map((cluster, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'var(--color-slate-50)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        padding: '16px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-slate-900)' }}>
                          {cluster.title}
                        </span>
                        <span className={`badge badge--${cluster.severity.toLowerCase()}`}>
                          {cluster.severity}
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--color-slate-700)', margin: '0 0 8px 0', lineHeight: 1.5 }}>
                        {cluster.description}
                      </p>
                      {cluster.explanation && (
                        <div style={{ fontSize: '11px', color: 'var(--color-slate-600)', fontStyle: 'italic', background: 'var(--color-white)', padding: '6px 10px', borderRadius: '4px', border: '1px dashed var(--border-color)' }}>
                          <strong>Vigilance Correlation Rationale:</strong> {cluster.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Breakdown & Detected Forensic Indicators Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', alignItems: 'start' }}>
            <RiskBreakdown indicators={analysis.indicators ?? []} riskScore={analysis.riskScore} />

            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Detected Forensic Indicators</span>
                <span className="badge badge--neutral">
                  {analysis.indicators?.length ?? 0}
                </span>
              </div>
              <FraudIndicatorList indicators={analysis.indicators ?? []} />
            </div>
          </div>

          {/* Authorized Officer Action Guidance */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <ShieldCheck size={16} color="var(--color-navy-500)" />
                Recommended Tender Committee Action
              </span>
            </div>
            <div className="card-body">
              <p style={{ fontSize: '13px', color: 'var(--color-slate-800)', lineHeight: 1.6, margin: 0 }}>
                {analysis.riskLevel === 'LOW' &&
                  'No significant anomalies detected. Standard statutory due diligence is recommended before tender award.'}
                {analysis.riskLevel === 'MEDIUM' &&
                  'Potentially suspicious indicators have been identified. Manual verification of flagged documents and bidder identity is recommended prior to technical qualification.'}
                {analysis.riskLevel === 'HIGH' &&
                  'High anomaly risk detected. Comprehensive manual investigation of all flagged identity and document collision indicators is strongly recommended.'}
                {analysis.riskLevel === 'CRITICAL' &&
                  'Multiple critical collusion or statutory conflict indicators require immediate vigilance investigation. Do not conclude evaluation until all flagged anomalies are resolved.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
