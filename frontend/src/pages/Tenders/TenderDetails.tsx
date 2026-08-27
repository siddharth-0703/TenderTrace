import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenderApi } from '../../services/api/tenderApi';
import { PlayCircle, Loader2 } from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { StatusBadge } from '../../components/common/StatusBadge';
import { FileUpload } from '../../components/common/FileUpload';
import type { TenderRequirement } from '../../types';

export default function TenderDetails() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'requirements'>('documents');

  const { data: tender, isLoading, isError, refetch } = useQuery({
    queryKey: ['tender', id],
    queryFn: () => tenderApi.getTenderDetails(id!),
    enabled: !!id,
  });

  const uploadMutation = useMutation({
    mutationFn: (files: File[]) => tenderApi.uploadDocuments(id!, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tender', id] });
    },
  });

  const processMutation = useMutation({
    mutationFn: () => tenderApi.processPackage(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tender', id] });
      setActiveTab('requirements');
    },
  });

  if (isLoading) return <LoadingSpinner text="Loading tender details..." />;
  if (isError) return <ErrorState title="Failed to load tender details" onRetry={() => refetch()} />;
  if (!tender) return <ErrorState title="Tender not found" message="The requested tender does not exist." />;

  const handleUpload = async (files: File[]) => {
    await uploadMutation.mutateAsync(files);
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-h1" style={{ marginBottom: '4px' }}>{tender.title}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <span className="font-mono">{tender.id}</span>
            <span className="hidden md:inline">•</span>
            <span>{tender.department}</span>
            <span className="hidden md:inline">•</span>
            <StatusBadge status={tender.processingStatus || 'PENDING'} />
          </div>
        </div>
      </div>

      <div className="tabs-container">
        <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`} onClick={() => setActiveTab('documents')}>Documents ({tender.documents?.length || 0})</button>
        <button className={`tab-btn ${activeTab === 'requirements' ? 'active' : ''}`} onClick={() => setActiveTab('requirements')}>Requirements ({tender.requirements?.length || 0})</button>
      </div>

      {activeTab === 'overview' && (
        <div className="card">
          <h3 className="text-h3 mb-4">Overview</h3>
          <p className="text-muted">Tender overview content goes here...</p>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="flex flex-col gap-6">
          <div className="card">
            <h3 className="text-h3">Upload Tender Package</h3>
            <p className="text-muted text-sm mb-4">Upload all tender PDFs (main tender, BOQ, corrigenda, etc.).</p>
            <FileUpload onUpload={handleUpload} multiple={true} accept=".pdf" />
          </div>

          <div className="card">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
              <h3 className="text-h3">Uploaded Documents</h3>
              <button 
                className="btn btn-primary w-full md:w-auto" 
                onClick={() => processMutation.mutate()} 
                disabled={processMutation.isPending || tender.documents?.length === 0}
              >
                {processMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <PlayCircle size={16} />}
                {processMutation.isPending ? 'Processing Package...' : 'Process Package (Phase 4)'}
              </button>
            </div>

            {tender.documents?.length === 0 ? (
              <EmptyState title="No documents" message="Upload documents above to begin." />
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Filename</th>
                      <th>Pages</th>
                      <th>Classification</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tender.documents?.map((doc: any) => (
                      <tr key={doc.id}>
                        <td className="font-medium truncate max-w-xs" title={doc.filename}>{doc.filename}</td>
                        <td className="text-sm font-mono text-muted">{doc.pageCount || '-'}</td>
                        <td>
                          {doc.documentClass ? (
                            <span className="badge badge-primary">{doc.documentClass}</span>
                          ) : (
                            <span className="text-muted text-xs">Unclassified</span>
                          )}
                        </td>
                        <td>
                          <StatusBadge status={doc.processingStatus} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'requirements' && (
        <div className="card">
          <h3 className="text-h3 mb-4">Extracted Requirements</h3>
          {tender.requirements?.length === 0 ? (
            <EmptyState title="No requirements" message="Run package processing first to extract requirements." />
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Rule / Value</th>
                    <th>Status</th>
                    <th>Review</th>
                  </tr>
                </thead>
                <tbody>
                  {tender.requirements?.map((req: TenderRequirement) => (
                    <tr key={req.id}>
                      <td className="font-semibold">{req.type}</td>
                      <td className="font-mono text-sm max-w-sm truncate" title={req.rules || ''}>
                        {req.rules || req.description}
                      </td>
                      <td>
                        <StatusBadge status={req.status || 'ACTIVE'} />
                      </td>
                      <td>
                        <StatusBadge status={req.reviewStatus || 'DETECTED'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
