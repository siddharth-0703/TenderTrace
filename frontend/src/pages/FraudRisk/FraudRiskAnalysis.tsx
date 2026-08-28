import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ShieldAlert, RefreshCw, AlertCircle } from 'lucide-react';
import type { BidSummary, FraudAnalysis } from '../../types/fraud';
import { fetchFraudAnalysis, runAnalysis } from '../../services/api/fraudApi';
import { fetchAllBids } from '../../services/api/bidsApi';
import RiskScoreCard from '../../components/fraud/RiskScoreCard';
import RiskBreakdown from '../../components/fraud/RiskBreakdown';
import FraudIndicatorList from '../../components/fraud/FraudIndicatorList';
import ReviewNotice from '../../components/fraud/ReviewNotice';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export default function FraudRiskAnalysis() {
  const { bidId } = useParams<{ bidId: string }>();
  const [analysis, setAnalysis] = useState<FraudAnalysis | null>(null);
  const [bid, setBid]           = useState<BidSummary | null>(null);
  const [loading, setLoading]   = useState(true);
  const [running, setRunning]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const load = async () => {
    if (!bidId) return;
    setLoading(true);
    setError(null);
    try {
      // Load bid meta and fraud analysis in parallel
      const [fa, bids] = await Promise.all([
        fetchFraudAnalysis(bidId),
        fetchAllBids(),
      ]);
      setAnalysis(fa);
      setBid(bids.find(b => b.id === bidId) ?? null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [bidId]);

  const handleRunAnalysis = async () => {
    if (!bidId) return;
    setRunning(true);
    setError(null);
    try {
      await runAnalysis(bidId);
      // Re-load to get full analysis with all joins
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="state-box" style={{ paddingTop: 'var(--space-16)' }}>
        <div className="spinner spinner--lg" role="status" aria-label="Loading" />
        <div className="state-box__title">Loading Fraud &amp; Anomaly Analysis</div>
        <div className="state-box__desc">Retrieving indicators and evidence…</div>
      </div>
    );
  }

  // ── Error ──
  if (error && !analysis) {
    return (
      <div className="state-box">
        <AlertCircle size={32} className="state-box__icon" aria-hidden="true" />
        <div className="state-box__title">Unable to Retrieve Fraud Analysis</div>
        <div className="state-box__desc">
          {error}
          <br />The Fraud &amp; Anomaly Engine could not be reached. Please try again.
        </div>
        <button className="btn btn--secondary" onClick={load}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link to="/fraud-risk">Fraud &amp; Risk</Link>
        <span className="sep">›</span>
        <span className="current">Bid Analysis</span>
      </div>

      {/* Page Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <ShieldAlert size={24} aria-hidden="true" />
              Fraud &amp; Anomaly Assessment
            </h1>

            {bid && (
              <div style={{ marginTop: 'var(--space-3)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                <div>
                  <span className="text-xs text-muted">Bidder</span>
                  <div style={{ fontWeight: 600 }}>{bid.bidder.legalName}</div>
                </div>
                <div>
                  <span className="text-xs text-muted">Tender</span>
                  <div style={{ fontWeight: 600 }}>{bid.tender.tenderNumber}</div>
                </div>
                <div>
                  <span className="text-xs text-muted">Bid ID</span>
                  <div className="font-mono" style={{ fontSize: 'var(--text-xs)', paddingTop: 4 }}>{bid.id}</div>
                </div>
                {analysis && (
                  <div>
                    <span className="text-xs text-muted">Last Analyzed</span>
                    <div style={{ fontSize: 'var(--text-sm)' }}>{formatDate(analysis.createdAt)}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0 }}>
            <Link to="/fraud-risk" className="btn btn--ghost btn--sm">
              <ArrowLeft size={14} aria-hidden="true" />
              Back
            </Link>
            <button
              className="btn btn--secondary btn--sm"
              onClick={handleRunAnalysis}
              disabled={running}
              aria-label="Re-run fraud analysis"
            >
              <RefreshCw size={14} aria-hidden="true" />
              {running ? 'Analyzing…' : 'Re-run Analysis'}
            </button>
          </div>
        </div>
      </div>

      {/* Error banner (soft — analysis still shown) */}
      {error && (
        <div className="alert alert--danger mb-4" role="alert">
          <AlertCircle size={16} className="alert__icon" aria-hidden="true" />
          <div>{error}</div>
        </div>
      )}

      {/* No analysis yet */}
      {!analysis ? (
        <div className="state-box">
          <ShieldAlert size={32} className="state-box__icon" aria-hidden="true" />
          <div className="state-box__title">No Analysis Available</div>
          <div className="state-box__desc">
            No Fraud &amp; Anomaly analysis has been generated for this bid yet.
          </div>
          <button
            className="btn btn--primary"
            onClick={handleRunAnalysis}
            disabled={running}
          >
            {running ? 'Running Analysis…' : 'Run Analysis'}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Human-in-the-loop notice */}
          <ReviewNotice />

          {/* Risk Score Card */}
          <RiskScoreCard
            riskScore={analysis.riskScore}
            riskLevel={analysis.riskLevel}
            confidence={analysis.confidence}
            investigationPriority={analysis.investigationPriority}
            indicatorCount={analysis.indicators?.length ?? 0}
          />

          {/* Correlated Clusters Section */}
          {analysis.correlatedFindings && analysis.correlatedFindings.length > 0 && (
            <div className="card" style={{ borderLeft: '4px solid var(--color-danger, #e53e3e)' }}>
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                  <ShieldAlert size={18} style={{ color: 'var(--color-danger, #e53e3e)' }} />
                  <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, margin: 0 }}>
                    Correlated Risk Clusters ({analysis.correlatedFindings.length})
                  </h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {analysis.correlatedFindings.map((cluster, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'var(--color-slate-50)',
                        border: '1px solid var(--color-slate-200)',
                        borderRadius: 6,
                        padding: 'var(--space-4)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                        <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-slate-800)' }}>
                          {cluster.title}
                        </span>
                        <span className={`badge badge--${cluster.severity.toLowerCase()}`}>
                          {cluster.severity}
                        </span>
                      </div>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-700)', margin: '0 0 var(--space-2) 0', lineHeight: 1.5 }}>
                        {cluster.description}
                      </p>
                      {cluster.explanation && (
                        <div style={{ fontSize: '11px', color: 'var(--color-slate-600)', fontStyle: 'italic' }}>
                          💡 {cluster.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Two-column layout: Breakdown + Indicator List */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-6)', alignItems: 'start' }}>
            <RiskBreakdown indicators={analysis.indicators ?? []} riskScore={analysis.riskScore} />

            <div>
              <div className="section-title">
                Detected Indicators
                <span className="badge badge--neutral">{analysis.indicators?.length ?? 0}</span>
              </div>
              <FraudIndicatorList indicators={analysis.indicators ?? []} />
            </div>
          </div>

          {/* Recommendation */}
          <div className="card">
            <div className="card-body">
              <h3 style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>
                Recommended Officer Action
              </h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-slate-700)', lineHeight: 1.6 }}>
                {analysis.riskLevel === 'LOW' &&
                  'No significant anomalies were detected. Standard due diligence is recommended before finalising procurement.'}
                {analysis.riskLevel === 'MEDIUM' &&
                  'Potentially suspicious indicators have been identified. Manual verification of the flagged documents and bidder identity is recommended before proceeding.'}
                {analysis.riskLevel === 'HIGH' &&
                  'High anomaly risk detected. Manual investigation of all flagged indicators is strongly recommended before making any procurement decision.'}
                {analysis.riskLevel === 'CRITICAL' &&
                  'Multiple critical indicators require immediate manual investigation. Do not proceed with procurement until all flagged anomalies have been reviewed and resolved.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
