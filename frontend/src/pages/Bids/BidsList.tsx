import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { bidApi } from '../../services/api/bidApi';
import type { Bid } from '../../services/api/bidApi';
import { Eye } from 'lucide-react';

export default function BidsList() {
  const navigate = useNavigate();
  const { data: bids, isLoading, isError } = useQuery({
    queryKey: ['bids'],
    queryFn: bidApi.getBids,
  });

  if (isLoading) return <div className="text-muted">Loading bids...</div>;
  if (isError) return <div className="text-error">Failed to load bids.</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-h1" style={{ marginBottom: 0 }}>Bids & Evidence</h1>
          <p className="text-muted">Review submitted bids and mapped evidence compliance.</p>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Bid ID</th>
              <th>Bidder</th>
              <th>Tender</th>
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
                  <div className="text-sm truncate" style={{ maxWidth: '200px' }}>{bid.tender?.title || 'Unknown Tender'}</div>
                </td>
                <td>
                  <span className={`badge badge-neutral`}>
                    SUBMITTED
                  </span>
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
            {bids?.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                  <p className="text-muted">No bids found.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
