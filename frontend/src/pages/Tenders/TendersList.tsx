import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { tenderApi } from '../../services/api/tenderApi';
import type { Tender } from '../../types';
import { Plus, Search, Filter } from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { StatusBadge } from '../../components/common/StatusBadge';

export default function TendersList() {
  const navigate = useNavigate();
  const { data: tenders, isLoading, isError, refetch } = useQuery({
    queryKey: ['tenders'],
    queryFn: tenderApi.getTenders,
  });

  if (isLoading) return <LoadingSpinner text="Loading tenders..." />;
  if (isError) return <ErrorState title="Failed to load tenders" onRetry={() => refetch()} />;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-h1" style={{ marginBottom: 0 }}>Tender Management</h1>
          <p className="text-muted">Manage government tenders, requirements, and compliance.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/tenders/new')}>
          <Plus size={16} /> Create Tender
        </button>
      </div>

      {/* Filter Bar Stub */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'center', backgroundColor: 'var(--color-surface)' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search tenders..." 
            style={{ padding: '8px 12px 8px 36px', borderRadius: '4px', border: '1px solid var(--color-border)', width: '100%', fontSize: '14px' }} 
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Filter size={16} color="var(--text-muted)" />
          <select style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-background)' }}>
            <option>All Statuses</option>
            <option>Published</option>
            <option>Under Evaluation</option>
          </select>
          <select style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '14px', backgroundColor: 'var(--color-background)' }}>
            <option>All Departments</option>
          </select>
        </div>
      </div>

      {tenders?.length === 0 ? (
        <EmptyState title="No active tenders" message="Create a new tender to begin the procurement process." />
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tender</th>
                <th>Reference</th>
                <th>Department</th>
                <th style={{ textAlign: 'center' }}>Bidders</th>
                <th>Closing</th>
                <th>Risk</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {tenders?.map((tender: Tender) => (
                <tr key={tender.id}>
                  <td>
                    <div style={{ fontWeight: 500, color: 'var(--color-primary)' }}>{tender.title}</div>
                  </td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                    {tender.tenderNumber || tender.id.substring(0, 8)}
                  </td>
                  <td style={{ fontSize: '13px' }}>{tender.organization}</td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{tender._count?.bids || 0}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Not Available</td>
                  <td><span className="badge badge-neutral" style={{ fontSize: '10px' }}>N/A</span></td>
                  <td>
                    <StatusBadge status={tender.processingStatus || tender.status || 'DRAFT'} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      className="btn btn-outline"
                      style={{ padding: '4px 12px', fontSize: '12px' }}
                      onClick={() => navigate(`/tenders/${tender.id}`)}
                    >
                      Review
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
