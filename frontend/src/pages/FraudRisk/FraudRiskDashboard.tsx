import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShieldAlert, ChevronRight, RefreshCw } from 'lucide-react';
import type { BidSummary, RiskLevel, IndicatorType } from '../../types/fraud';
import { fetchAllBids } from '../../services/api/bidsApi';
import RiskLevelBadge from '../../components/fraud/RiskLevelBadge';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StatCard({ label, value, sub, variant }: { label: string; value: string | number; sub?: string; variant?: string }) {
  return (
    <div className={`stat-card${variant ? ` stat-card--${variant}` : ''}`}>
      <div className="stat-card__label">{label}</div>
      <div className="stat-card__value">{value}</div>
      {sub && <div className="stat-card__sub">{sub}</div>}
    </div>
  );
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
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Bids that have at least one fraud analysis
  const analyzed = useMemo(() =>
    bids.filter(b => b.fraudAnalyses && b.fraudAnalyses.length > 0),
  [bids]);

  const stats = useMemo(() => ({
    total:    analyzed.length,
    flagged:  analyzed.filter(b => b.fraudAnalyses[0].indicators?.length > 0).length,
    highCrit: analyzed.filter(b => ['HIGH','CRITICAL'].includes(b.fraudAnalyses[0].riskLevel)).length,
    review:   analyzed.filter(b => ['MEDIUM','HIGH','CRITICAL'].includes(b.fraudAnalyses[0].riskLevel)).length,
  }), [analyzed]);

  const filtered = useMemo(() => {
    let rows = analyzed;
    const q = search.toLowerCase();
    if (q) {
      rows = rows.filter(b =>
        b.bidder.legalName.toLowerCase().includes(q) ||
        b.tender.tenderNumber.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q)
      );
    }
    if (riskFilter) {
      rows = rows.filter(b => b.fraudAnalyses[0].riskLevel === riskFilter);
    }
    if (typeFilter) {
      rows = rows.filter(b =>
        b.fraudAnalyses[0].indicators.some(i => i.type === typeFilter)
      );
    }
    return rows;
  }, [analyzed, search, riskFilter, typeFilter]);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1>Fraud &amp; Risk Overview</h1>
            <div className="subtitle">Anomaly risk assessment across all analyzed bids</div>
          </div>
          <button className="btn btn--secondary btn--sm" onClick={load} disabled={loading} aria-label="Refresh data">
            <RefreshCw size={14} aria-hidden="true" />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      {!loading && !error && (
        <div className="stat-grid">
          <StatCard label="Bids Analyzed"        value={stats.total} />
          <StatCard label="Anomalies Detected"   value={stats.flagged}  variant={stats.flagged > 0 ? 'warning' : undefined} />
          <StatCard label="High / Critical Risk"  value={stats.highCrit} variant={stats.highCrit > 0 ? 'danger' : undefined} sub="Require immediate review" />
          <StatCard label="Require Review"        value={stats.review}   sub="Medium, High or Critical" />
        </div>
      )}

      {/* Table */}
      <div className="table-wrapper">
        <div className="table-toolbar">
          <span className="table-toolbar-title">
            Risk Assessment Table
            {!loading && <span className="badge badge--neutral" style={{ marginLeft: 8 }}>{filtered.length}</span>}
          </span>
          <div className="input-group">
            <div className="input-icon-wrapper">
              <Search size={14} className="input-icon" aria-hidden="true" />
              <input
                className="input"
                style={{ width: 220 }}
                placeholder="Search bidder or tender…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Search bids"
              />
            </div>
            <select
              className="select"
              style={{ width: 150 }}
              value={riskFilter}
              onChange={e => setRiskFilter(e.target.value as any)}
              aria-label="Filter by risk level"
            >
              <option value="">All Risk Levels</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
            <select
              className="select"
              style={{ width: 200 }}
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as any)}
              aria-label="Filter by indicator type"
            >
              <option value="">All Indicator Types</option>
              <option value="IDENTITY_MISMATCH">Identity Mismatch</option>
              <option value="DOCUMENT_DUPLICATION">Document Duplication</option>
              <option value="METADATA_ANOMALY">Metadata Anomaly</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="state-box">
            <div className="spinner spinner--lg" role="status" aria-label="Loading" />
            <div className="state-box__title">Loading Fraud &amp; Risk Data</div>
            <div className="state-box__desc">Retrieving risk indicators…</div>
          </div>
        ) : error ? (
          <div className="state-box">
            <ShieldAlert size={32} className="state-box__icon" aria-hidden="true" />
            <div className="state-box__title">Unable to Retrieve Data</div>
            <div className="state-box__desc">{error}</div>
            <button className="btn btn--secondary" onClick={load}>Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="state-box">
            <ShieldAlert size={32} className="state-box__icon" aria-hidden="true" />
            <div className="state-box__title">
              {analyzed.length === 0 ? 'No Analyses Available' : 'No Results Match Your Filters'}
            </div>
            <div className="state-box__desc">
              {analyzed.length === 0
                ? 'Run fraud analysis on a bid to see results here. Use POST /api/bids/:id/analyze.'
                : 'Try adjusting your search or filter criteria.'}
            </div>
          </div>
        ) : (
          <table aria-label="Risk assessment table">
            <thead>
              <tr>
                <th>Bidder</th>
                <th>Tender</th>
                <th>Risk Score</th>
                <th>Risk Level</th>
                <th>Indicators</th>
                <th>Last Analyzed</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(bid => {
                const fa = bid.fraudAnalyses[0];
                return (
                  <tr key={bid.id}>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--color-slate-900)' }}>
                        {bid.bidder.legalName}
                      </div>
                      <div className="text-xs text-muted font-mono">{bid.id.slice(0,8)}…</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{bid.tender.tenderNumber}</div>
                      <div className="text-xs text-muted">{bid.tender.title}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}>
                        {fa.riskScore}
                      </span>
                      <span className="text-muted text-xs"> / 100</span>
                    </td>
                    <td><RiskLevelBadge level={fa.riskLevel} /></td>
                    <td>
                      <span className="badge badge--neutral">
                        {fa.indicators?.length ?? 0} indicator{(fa.indicators?.length ?? 0) !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="text-sm text-muted">{formatDate(fa.createdAt)}</td>
                    <td>
                      <Link
                        to={`/bids/${bid.id}/fraud-risk`}
                        className="btn btn--secondary btn--sm"
                        aria-label={`View analysis for ${bid.bidder.legalName}`}
                      >
                        View Analysis
                        <ChevronRight size={14} aria-hidden="true" />
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
