import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { tenderApi } from '../../services/api/tenderApi';
import type { Tender } from '../../types';
import { Eye, FileText, FileQuestion } from 'lucide-react';
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
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-h1" style={{ marginBottom: 0 }}>Tenders</h1>
          <p className="text-muted">Manage and process tender document packages.</p>
        </div>
      </div>

      {tenders?.length === 0 ? (
        <EmptyState title="No tenders found" message="Tenders will appear here when created." />
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID / Title</th>
                <th>Organization</th>
                <th>Stats</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenders?.map((tender: Tender) => (
                <tr key={tender.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{tender.title}</div>
                    <div className="text-xs text-muted font-mono">{tender.id}</div>
                  </td>
                  <td>{tender.department}</td>
                  <td>
                    <div className="flex gap-4">
                      <span className="flex items-center gap-1 text-xs text-muted">
                        <FileText size={14} /> {tender._count?.documents || 0} Docs
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted">
                        <FileQuestion size={14} /> {tender._count?.requirements || 0} Reqs
                      </span>
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={tender.status || tender.processingStatus || 'PENDING'} />
                  </td>
                  <td>
                    <button 
                      className="btn btn-outline"
                      onClick={() => navigate(`/tenders/${tender.id}`)}
                    >
                      <Eye size={16} /> View
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
