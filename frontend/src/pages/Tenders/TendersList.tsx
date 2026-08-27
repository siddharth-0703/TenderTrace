import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { tenderApi } from '../../services/api/tenderApi';
import type { Tender } from '../../services/api/tenderApi';
import { Eye, FileText, FileQuestion } from 'lucide-react';

export default function TendersList() {
  const navigate = useNavigate();
  const { data: tenders, isLoading, isError } = useQuery({
    queryKey: ['tenders'],
    queryFn: tenderApi.getTenders,
  });

  if (isLoading) return <div className="text-muted">Loading tenders...</div>;
  if (isError) return <div className="text-error">Failed to load tenders.</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-h1" style={{ marginBottom: 0 }}>Tenders</h1>
          <p className="text-muted">Manage and process tender document packages.</p>
        </div>
        <button className="btn btn-primary">
          + New Tender
        </button>
      </div>

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
                  <span className={`badge ${tender.processingStatus === 'PROCESSED' ? 'badge-success' : 'badge-neutral'}`}>
                    {tender.processingStatus}
                  </span>
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
            {tenders?.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                  <p className="text-muted">No tenders found.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
