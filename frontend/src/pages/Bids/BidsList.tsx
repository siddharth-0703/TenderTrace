import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { bidApi } from '../../services/api/bidApi';
import type { Bid } from '../../types';
import { Eye } from 'lucide-react';
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
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-h1" style={{ marginBottom: 0 }}>Bids & Evidence</h1>
          <p className="text-muted">Review submitted bids and mapped evidence compliance.</p>
        </div>
      </div>

      {bids?.length === 0 ? (
        <EmptyState title="No bids found" message="Bids will appear here when submitted against a tender." />
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Bid ID</th>
                <th>Bidder</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bids?.map((bid: Bid) => (
                <tr key={bid.id}>
                  <td>
                    <div className="text-xs text-muted font-mono">{bid.id}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{bid.bidder?.name || 'Unknown Bidder'}</div>
                  </td>
                  <td>
                    <StatusBadge status={bid.status || 'SUBMITTED'} />
                  </td>
                  <td>
                    <button 
                      className="btn btn-outline"
                      onClick={() => navigate(`/bids/${bid.id}`)}
                    >
                      <Eye size={16} /> View Compliance
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
