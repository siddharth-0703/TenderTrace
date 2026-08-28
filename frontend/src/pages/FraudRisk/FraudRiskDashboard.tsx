import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShieldAlert, ChevronRight, RefreshCw, X } from 'lucide-react';
import type { BidSummary, RiskLevel, IndicatorType } from '../../types/fraud';
import { fetchAllBids } from '../../services/api/bidsApi';
import RiskLevelBadge from '../../components/fraud/RiskLevelBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function FraudRiskDashboard() {
  const [bids, setBids] = useState<BidSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | ''>('');
  const [typeFilter, setTypeFilter] = useState<IndicatorType | ''>('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setBids(await fetchAllBids());
    } catch (e: any) {
      setError(e.message || 'Failed to connect to Fraud & Anomaly Detection service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Bids with at least one fraud analysis
  const analyzed = useMemo(
    () => bids.filter((b) => b.fraudAnalyses && b.fraudAnalyses.length > 0),
    [bids]
  );

  const stats = useMemo(
    () => ({
      total: analyzed.length,
      flagged: analyzed.filter((b) => b.fraudAnalyses[0].indicators?.length > 0).length,
      highCrit: analyzed.filter((b) => ['HIGH', 'CRITICAL'].includes(b.fraudAnalyses[0].riskLevel)).length,
      review: analyzed.filter((b) => ['MEDIUM', 'HIGH', 'CRITICAL'].includes(b.fraudAnalyses[0].riskLevel)).length,
    }),
    [analyzed]
  );

  const filtered = useMemo(() => {
    let rows = analyzed;
    const q = search.toLowerCase().trim();
    if (q) {
      rows = rows.filter(
        (b) =>
          b.bidder.legalName.toLowerCase().includes(q) ||
          b.tender.tenderNumber.toLowerCase().includes(q) ||
          b.id.toLowerCase().includes(q)
      );
    }
    if (riskFilter) {
      rows = rows.filter((b) => b.fraudAnalyses[0].riskLevel === riskFilter);
    }
    if (typeFilter) {
      rows = rows.filter((b) =>
        b.fraudAnalyses[0].indicators.some((i) => i.type === typeFilter)
      );
    }
    return rows;
  }, [analyzed, search, riskFilter, typeFilter]);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* ── Page Header ── */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Fraud &amp; Anomaly Intelligence</h1>
            <div className="subtitle">
              Automated multi-dossier forensic analysis, identity collision detection, and cross-bid pattern recognition
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={load}
            disabled={loading}
            aria-label="Refresh fraud analytics"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Analytics</span>
          </button>
        </div>
      </div>

      {/* ── Summary Stats ── */}
      {!loading && !error && (
        <div className="stat-grid">
          <div className="stat-card">
            <span className="stat-card__label">Bids Analyzed</span>
            <div className="stat-card__value">{stats.total}</div>
            <div className="stat-card__sub">
              <span>Forensic dossiers processed</span>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-card__label">Anomalies Detected</span>
            <div
              className="stat-card__value"
              style={{ color: stats.flagged > 0 ? 'var(--color-warning)' : 'inherit' }}
            >
              {stats.flagged}
            </div>
            <div className="stat-card__sub">
              <span>Bids with forensic indicators</span>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-card__label">High / Critical Risk</span>
            <div
              className="stat-card__value"
              style={{ color: stats.highCrit > 0 ? 'var(--color-danger)' : 'inherit' }}
            >
              {stats.highCrit}
            </div>
            <div className="stat-card__sub">
              <span>Immediate vigilance priority</span>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-card__label">Review Required</span>
            <div
              className="stat-card__value"
              style={{ color: stats.review > 0 ? 'var(--color-warning)' : 'inherit' }}
            >
              {stats.review}
            </div>
            <div className="stat-card__sub">
              <span>Medium, High, or Critical risk</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Table & Filters ── */}
      <div className="table-wrapper">
        <div className="table-toolbar">
          <span className="table-toolbar-title">
            <ShieldAlert size={16} color="var(--color-navy-500)" />
            Forensic Risk Assessment Registry
            {!loading && (
              <span className="badge badge--neutral" style={{ marginLeft: '8px' }}>
                {filtered.length}
              </span>
            )}
          </span>

          <div className="input-group">
            <div className="input-icon-wrapper">
              <Search size={14} className="input-icon" />
              <input
                className="input"
                style={{ width: '240px' }}
                placeholder="Search bidder or tender..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search bids by bidder or tender"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  aria-label="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <select
              className="select"
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value as any)}
              aria-label="Filter by risk severity level"
            >
              <option value="">All Risk Levels</option>
              <option value="LOW">LOW RISK</option>
              <option value="MEDIUM">MEDIUM RISK</option>
              <option value="HIGH">HIGH RISK</option>
              <option value="CRITICAL">CRITICAL RISK</option>
            </select>

            <select
              className="select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              aria-label="Filter by forensic indicator type"
            >
              <option value="">All Indicator Types</option>
              <option value="IDENTITY_MISMATCH">Identity Mismatch</option>
              <option value="DOCUMENT_DUPLICATION">Document Collision</option>
              <option value="METADATA_ANOMALY">Metadata Anomaly</option>
              <option value="COMPANY_INCONSISTENCY">Company Inconsistency</option>
              <option value="CROSS_BID_SIMILARITY">Cross-Bid Similarity</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '48px' }}>
            <LoadingSpinner text="Retrieving forensic risk assessments across bidders..." />
          </div>
        ) : error ? (
          <div style={{ padding: '32px' }}>
            <ErrorState title="Error Loading Fraud Analytics" message={error} onRetry={load} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px' }}>
            <EmptyState
              title="No matching forensic assessments"
              message={
                search || riskFilter || typeFilter
                  ? 'No bids match the active risk filters.'
                  : 'No bids have been evaluated by the Fraud & Anomaly Engine yet. Run evaluation from a bid workspace.'
              }
            />
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Bidder Legal Entity</th>
                <th>Tender Reference</th>
                <th>Risk Score</th>
                <th>Risk Classification</th>
                <th>Indicators</th>
                <th>Analyzed Date</th>
                <th style={{ textAlign: 'right' }}>Forensics</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => {
                const fa = b.fraudAnalyses[0];
                const score = fa.riskScore;
                const levelCls = fa.riskLevel.toLowerCase();

                return (
                  <tr key={b.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-slate-900)' }}>
                        {b.bidder.legalName}
                      </div>
                      <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Bid: {b.id.substring(0, 8)}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--color-slate-800)' }}>
                        {b.tender.tenderNumber}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {(b.tender as any).organization || 'Gov. Organization'}
                      </div>
                    </td>
                    <td style={{ minWidth: '130px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontSize: '13px', width: '28px' }}>
                          {score}
                        </span>
                        <div className="score-bar-track" style={{ margin: 0, height: '6px', flex: 1 }}>
                          <div
                            className={`score-bar-fill score-bar-fill--${levelCls}`}
                            style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <RiskLevelBadge level={fa.riskLevel} />
                    </td>
                    <td>
                      <span className="badge badge--neutral font-mono">
                        {fa.indicators?.length || 0} finding(s)
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {formatDate(fa.createdAt)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        to={`/bids/${b.id}/fraud-risk`}
                        className="btn btn-secondary btn-sm"
                      >
                        Examine <ChevronRight size={13} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
