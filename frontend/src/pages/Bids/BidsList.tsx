import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { bidApi } from '../../services/api/bidApi';
import type { Bid } from '../../types';
import { Search, Filter } from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { StatusBadge } from '../../components/common/StatusBadge';

export default function BidsList() {
  const navigate = useNavigate();
  const { data: bids, isLoading, isError, refetch } = useQuery({
    queryKey: ['bids'],
    queryFn: bidApi.getBids,
  });

  if (isLoading) return <LoadingSpinner text="Loading bids..." />;
  if (isError) return <ErrorState title="Failed to load bids" onRetry={() => refetch()} />;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-h1" style={{ marginBottom: 0 }}>Bid Management</h1>
          <p className="text-muted">Review submitted bids and map evidence to tender requirements.</p>
        </div>
      </div>

      {/* Filter Bar Stub */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'center', backgroundColor: 'var(--color-surface)' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search bidders or tenders..." 
            style={{ padding: '8px 12px 8px 36px', borderRadius: '4px', border: '1px solid var(--color-border)', width: '100%', fontSize: '14px' }} 
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Filter size={16} color="var(--text-muted)" />
          <select style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-background)' }}>
            <option>All Statuses</option>
            <option>Review Required</option>
            <option>Compliant</option>
          </select>
          <select style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-background)' }}>
            <option>All Risk Levels</option>
            <option>High Risk</option>
            <option>Low Risk</option>
          </select>
        </div>
      </div>

      {bids?.length === 0 ? (
        <EmptyState title="No bids found" message="Bids will appear here when submitted against a tender." />
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Bidder</th>
                <th>Tender</th>
                <th style={{ textAlign: 'center' }}>Documents</th>
                <th style={{ textAlign: 'center' }}>Compliance</th>
                <th>Risk</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {bids?.map((bid: Bid) => (
                <tr key={bid.id}>
                  <td>
                    {bid.bidder?.name ? (
                      <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{bid.bidder.name}</div>
                    ) : (
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-muted)', fontStyle: 'italic' }}>Bidder identity not established</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Requires document review</div>
                      </div>
                    )}
                  </td>
                  <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '13px' }}>
                     {bid.tender?.title || 'Unknown Tender'}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 500 }}>
                    {bid._count?.documents || 0}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="badge badge-neutral" style={{ fontFamily: 'monospace' }}>PENDING</span>
                  </td>
                  <td>
                    <span className="badge badge-neutral" style={{ fontSize: '10px' }}>N/A</span>
                  </td>
                  <td>
                    <StatusBadge status={bid.status || 'SUBMITTED'} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      className="btn btn-outline"
                      style={{ padding: '4px 12px', fontSize: '12px' }}
                      onClick={() => navigate(`/bids/${bid.id}`)}
                    >
                      Evaluate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
