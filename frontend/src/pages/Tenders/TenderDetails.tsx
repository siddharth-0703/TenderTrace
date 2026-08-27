import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenderApi } from '../../services/api/tenderApi';
import { PlayCircle, Loader2, ArrowLeft, Plus } from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { StatusBadge } from '../../components/common/StatusBadge';
import { FileUpload } from '../../components/common/FileUpload';
import { ActivityTimeline } from '../../components/common/ActivityTimeline';
import type { TenderRequirement } from '../../types';

export default function TenderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'requirements' | 'bids' | 'history'>('overview');

  const { data: tender, isLoading, isError, refetch } = useQuery({
    queryKey: ['tender', id],
    queryFn: () => tenderApi.getTenderDetails(id!),
    enabled: !!id,
  });

  const { data: activities } = useQuery({
    queryKey: ['tender', id, 'activity'],
    queryFn: async () => {
      const res = await fetch(`http://localhost:3000/api/tenders/${id}/activity`);
      return res.json();
    },
    enabled: !!id && activeTab === 'history',
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

  if (isLoading) return <LoadingSpinner text="Loading workspace..." />;
  if (isError) return <ErrorState title="Failed to load tender workspace" onRetry={() => refetch()} />;
  if (!tender) return <ErrorState title="Tender not found" message="The requested tender does not exist." />;

  const handleUpload = async (files: File[]) => {
    await uploadMutation.mutateAsync(files);
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'documents', label: `Documents (${tender.documents?.length || 0})` },
    { id: 'requirements', label: `Requirements (${tender.requirements?.length || 0})` },
    { id: 'bids', label: `Bidders (${tender.bids?.length || 0})` },
    { id: 'history', label: 'History' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="card mb-6">
        <button 
          onClick={() => navigate('/tenders')}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '16px', fontSize: '14px', fontWeight: 500 }}
        >
          <ArrowLeft size={16} /> Back to Tenders
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 className="text-h1" style={{ marginBottom: '8px' }}>{tender.title}</h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              <span className="badge badge-neutral" style={{ fontFamily: 'monospace' }}>{tender.referenceNo || tender.id}</span>
              <span>•</span>
              <span style={{ fontWeight: 500 }}>{tender.department}</span>
              <span>•</span>
              <span>Created {new Date(tender.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div>
            <StatusBadge status={tender.processingStatus || tender.status || 'DRAFT'} />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tabs-container">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ paddingBottom: '48px' }}>
        {activeTab === 'overview' && (
          <div className="dashboard-grid">
            <div className="card stat-card">
              <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '4px' }}>Documents</div>
              <div className="stat-value">{tender.documents?.length || 0}</div>
            </div>
            <div className="card stat-card">
              <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '4px' }}>Requirements</div>
              <div className="stat-value">{tender.requirements?.length || 0}</div>
            </div>
            <div className="card stat-card">
              <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '4px' }}>Bidders</div>
              <div className="stat-value">{tender.bids?.length || 0}</div>
            </div>
            <div className="card stat-card">
              <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '4px' }}>Status</div>
              <div className="stat-value" style={{ textTransform: 'capitalize', fontSize: '20px' }}>{tender.status?.toLowerCase() || 'Draft'}</div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="card">
              <h3 className="text-h3">Upload Tender Package</h3>
              <p className="text-muted mb-4" style={{ fontSize: '14px' }}>Upload all tender PDFs (main tender, BOQ, corrigenda, etc.).</p>
              <FileUpload onUpload={handleUpload} multiple={true} accept=".pdf" />
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="text-h3" style={{ margin: 0 }}>Uploaded Documents</h3>
                <button 
                  className="btn btn-primary" 
                  onClick={() => processMutation.mutate()} 
                  disabled={processMutation.isPending || tender.documents?.length === 0}
                >
                  {processMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <PlayCircle size={16} />}
                  {processMutation.isPending ? 'Processing Package...' : 'Process Package (Phase 4)'}
                </button>
              </div>

              {tender.documents?.length === 0 ? (
                <div style={{ padding: '32px' }}>
                  <EmptyState title="No documents uploaded" message="Upload documents above to begin processing." />
                </div>
              ) : (
                <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
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
                          <td style={{ fontWeight: 500 }}>{doc.filename}</td>
                          <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{doc.pageCount || '-'}</td>
                          <td>
                            {doc.documentClass ? (
                              <span className="badge badge-primary">{doc.documentClass}</span>
                            ) : (
                              <span style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--text-muted)' }}>Unclassified</span>
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
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border)' }}>
              <h3 className="text-h3" style={{ margin: 0 }}>Extracted Requirements</h3>
              <p className="text-muted" style={{ fontSize: '14px', marginTop: '4px' }}>Review and approve requirements extracted from the tender package.</p>
            </div>
            
            {tender.requirements?.length === 0 ? (
              <div style={{ padding: '32px' }}>
                <EmptyState title="No requirements found" message="Run package processing on the Documents tab to extract requirements." />
              </div>
            ) : (
              <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Type / Category</th>
                      <th>Rule Description</th>
                      <th>Status</th>
                      <th>Review</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tender.requirements?.map((req: TenderRequirement) => (
                      <tr key={req.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{req.type}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{req.category}</div>
                        </td>
                        <td>
                           <div style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={req.rules || req.description}>
                            {req.rules || req.description}
                           </div>
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

        {activeTab === 'bids' && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 className="text-h3" style={{ margin: 0 }}>Associated Bidders</h3>
                <p className="text-muted" style={{ fontSize: '14px', marginTop: '4px' }}>Manage and evaluate incoming bids.</p>
              </div>
              <button className="btn btn-outline">
                <Plus size={16} /> Add Bidder
              </button>
            </div>
            
            {tender.bids?.length === 0 ? (
              <div style={{ padding: '32px' }}>
                <EmptyState title="No bidders yet" message="Add a bidder to begin uploading their documents and evaluating compliance." />
              </div>
            ) : (
              <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Bidder</th>
                      <th>Status</th>
                      <th>Submitted</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tender.bids?.map((bid: any) => (
                      <tr key={bid.id}>
                        <td style={{ fontWeight: 600 }}>{bid.bidder?.legalName || bid.id}</td>
                        <td>
                          <StatusBadge status={bid.status} />
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{new Date(bid.submittedAt).toLocaleDateString()}</td>
                        <td style={{ textAlign: 'right' }}>
                           <button 
                             className="btn btn-primary"
                             style={{ padding: '4px 12px', fontSize: '12px' }}
                             onClick={() => navigate(`/bids/${bid.id}`)}
                           >
                             Open Workspace
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="card">
            <h3 className="text-h3" style={{ marginBottom: '24px' }}>Activity History</h3>
            <ActivityTimeline activities={activities || []} />
          </div>
        )}
      </div>
    </div>
  );
}
