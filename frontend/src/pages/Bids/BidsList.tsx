import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { bidApi } from '../../services/api/bidApi';
import type { Bid } from '../../types';
import { Search, Filter, Users, ShieldAlert, X } from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { StatusBadge } from '../../components/common/StatusBadge';

export default function BidsList() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { data: bids, isLoading, isError, refetch } = useQuery({
    queryKey: ['bids'],
    queryFn: bidApi.getBids,
  });

  const filteredBids = useMemo(() => {
    if (!bids) return [];
    return bids.filter((bid: Bid) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const bidderName = (bid.bidder?.legalName || bid.bidder?.name || '').toLowerCase();
        const tenderTitle = (bid.tender?.title || '').toLowerCase();
        const bidId = bid.id.toLowerCase();
        if (!bidderName.includes(q) && !tenderTitle.includes(q) && !bidId.includes(q)) {
          return false;
        }
      }

      if (statusFilter !== 'ALL') {
        const current = (bid.status || '').toUpperCase();
        if (statusFilter === 'COMPLIANT' && current !== 'COMPLIANT' && current !== 'APPROVED') return false;
        if (statusFilter === 'REVIEW' && current !== 'REVIEW_REQUIRED' && current !== 'REQUIRES_OFFICER_REVIEW' && current !== 'CONFLICTING_EVIDENCE') return false;
        if (statusFilter === 'NON_COMPLIANT' && current !== 'NON_COMPLIANT' && current !== 'REJECTED') return false;
        if (statusFilter === 'PENDING' && current !== 'SUBMITTED' && current !== 'PENDING' && current !== 'UPLOADED') return false;
      }

      return true;
    });
  }, [bids, search, statusFilter]);

  if (isLoading) return <LoadingSpinner text="Loading bidder dossier registry..." />;
  if (isError) return <ErrorState title="Failed to load bids" onRetry={() => refetch()} />;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* ── Page Header ── */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Bidder Dossier Management</h1>
            <div className="subtitle">
              Evaluate bidder proposals, verify structured requirement evidence, and assess cross-bid risk
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <div className="input-icon-wrapper" style={{ flex: '1 1 280px' }}>
          <Search size={15} className="input-icon" />
          <input
            type="text"
            className="input"
            placeholder="Search by bidder name, tender title, or bid ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%' }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Filter size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <select
            className="select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by bid evaluation status"
          >
            <option value="ALL">All Evaluation States</option>
            <option value="COMPLIANT">Compliant / Approved</option>
            <option value="REVIEW">Officer Review Required</option>
            <option value="NON_COMPLIANT">Non-Compliant / Rejected</option>
            <option value="PENDING">Pending Evaluation</option>
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      {filteredBids.length === 0 ? (
        <EmptyState
          title="No bids found"
          message={search ? "No bid dossiers match your search filter." : "Bids will appear here once registered under active tenders."}
        />
      ) : (
        <div className="table-wrapper">
          <div className="table-toolbar">
            <span className="table-toolbar-title">
              <Users size={15} color="var(--color-navy-500)" />
              Submitted Bid Dossiers
              <span className="badge badge--neutral" style={{ marginLeft: '8px' }}>
                {filteredBids.length}
              </span>
            </span>
          </div>

          <table>
            <thead>
              <tr>
                <th>Bidder Entity</th>
                <th>Tender Reference &amp; Title</th>
                <th style={{ textAlign: 'center' }}>Dossier Files</th>
                <th>Compliance Status</th>
                <th style={{ textAlign: 'right' }}>Evaluation Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredBids.map((bid: Bid) => {
                const bidderName = bid.bidder?.legalName || bid.bidder?.name || 'Bidder ' + bid.id.substring(0, 8);
                return (
                  <tr key={bid.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-slate-900)' }}>
                        {bidderName}
                      </div>
                      <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        ID: {bid.id.substring(0, 8)}
                      </div>
                    </td>
                    <td style={{ maxWidth: '280px' }}>
                      <div style={{ fontWeight: 500, color: 'var(--color-slate-800)' }} className="truncate">
                        {bid.tender?.title || 'Tender ' + (bid.tenderId?.substring(0, 8) || 'N/A')}
                      </div>
                      <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {bid.tender?.tenderNumber || bid.tenderId?.substring(0, 8)}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>
                      {bid.documents?.length ?? bid._count?.documents ?? 0}
                    </td>
                    <td>
                      <StatusBadge status={bid.status || 'SUBMITTED'} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <Link
                          to={`/bids/${bid.id}`}
                          className="btn btn-secondary btn-sm"
                        >
                          Evaluate Compliance
                        </Link>
                        <Link
                          to={`/bids/${bid.id}/fraud-risk`}
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--color-warning)' }}
                          title="Fraud & Anomaly Inspection"
                        >
                          <ShieldAlert size={14} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
