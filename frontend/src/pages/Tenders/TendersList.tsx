import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { tenderApi } from '../../services/api/tenderApi';
import type { Tender } from '../../types';
import { Plus, Eye } from 'lucide-react';
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-h1" style={{ marginBottom: 0 }}>Tender Management</h1>
          <p className="text-muted">Manage government tenders, requirements, and compliance.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/tenders/new')}>
          <Plus size={16} /> Create New Tender
        </button>
      </div>

      {tenders?.length === 0 ? (
        <EmptyState title="No tenders found" message="Create your first tender to begin." />
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tender</th>
                <th>Reference</th>
                <th>Organization</th>
                <th style={{ textAlign: 'center' }}>Docs</th>
                <th style={{ textAlign: 'center' }}>Bids</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenders?.map((tender: Tender) => (
                <tr key={tender.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{tender.title}</div>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {tender.referenceNo || tender.id.substring(0, 8)}
                  </td>
                  <td>{tender.department}</td>
                  <td style={{ textAlign: 'center', fontWeight: 500 }}>{tender._count?.documents || 0}</td>
                  <td style={{ textAlign: 'center', fontWeight: 500 }}>{tender._count?.bids || 0}</td>
                  <td>
                    <StatusBadge status={tender.processingStatus || tender.status || 'DRAFT'} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      className="btn btn-outline"
                      style={{ padding: '4px 12px', fontSize: '12px' }}
                      onClick={() => navigate(`/tenders/${tender.id}`)}
                    >
                      <Eye size={14} /> Open
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
