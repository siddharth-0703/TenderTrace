import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bidApi } from '../../services/api/bidApi';
import { PlayCircle, Loader2, ArrowLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { StatusBadge } from '../../components/common/StatusBadge';
import { FileUpload } from '../../components/common/FileUpload';
import { ActivityTimeline } from '../../components/common/ActivityTimeline';

function EvaluationNode({ node }: { node: any }) {
  const [expanded, setExpanded] = useState(true);
  if (!node) return null;

  const hasChildren = node.children && node.children.length > 0;

  return (
    <div style={{ marginLeft: '16px', marginTop: '8px', borderLeft: '2px solid var(--color-border)', paddingLeft: '16px' }}>
      <div 
        style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '4px', borderRadius: '4px' }} 
        onClick={() => setExpanded(!expanded)}
      >
        {hasChildren && (
          <span style={{ color: 'var(--text-muted)' }}>{expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>
        )}
        <span style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{node.type}</span>
        {node.rule && <span style={{ fontSize: '14px', fontFamily: 'monospace', background: 'var(--color-background)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-secondary)' }}>{JSON.stringify(node.rule)}</span>}
        {node.extractedValue && <span className="badge badge-neutral">Extracted: {node.extractedValue}</span>}
        {node.normalizedValue !== undefined && <span className="badge badge-primary">Normalized: {node.normalizedValue}</span>}
        
        <StatusBadge status={node.result || 'UNKNOWN'} />
      </div>
      
      {expanded && hasChildren && (
        <div style={{ marginTop: '4px' }}>
          {node.children.map((child: any, idx: number) => (
            <EvaluationNode key={idx} node={child} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function BidDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'matching' | 'compliance' | 'history'>('overview');

  const { data: bid, isLoading, isError, refetch } = useQuery({
    queryKey: ['bid', id],
    queryFn: () => bidApi.getBidDetails(id!),
    enabled: !!id,
  });

  const { data: matches } = useQuery({
    queryKey: ['bidMatches', bid?.tenderId, id],
    queryFn: () => bidApi.getTenderBidMatches(bid!.tenderId, id!),
    enabled: !!bid?.tenderId && !!id,
  });

  const { data: activities } = useQuery({
    queryKey: ['bid', id, 'activity'],
    queryFn: async () => {
      const res = await fetch(`http://localhost:3000/api/bids/${id}/activity`);
      return res.json();
    },
    enabled: !!id && activeTab === 'history',
  });

  const uploadMutation = useMutation({
    mutationFn: (files: File[]) => bidApi.uploadDocuments(id!, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bid', id] });
    },
  });

  const matchMutation = useMutation({
    mutationFn: () => bidApi.matchBidAgainstTender(bid!.tenderId, id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bidMatches', bid!.tenderId, id] });
      setActiveTab('compliance');
    },
  });

  if (isLoading) return <LoadingSpinner text="Loading bid details..." />;
  if (isError) return <ErrorState title="Failed to load bid details" onRetry={() => refetch()} />;
  if (!bid) return <ErrorState title="Bid not found" />;

  const handleUpload = async (files: File[]) => {
    await uploadMutation.mutateAsync(files);
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'documents', label: `Documents (${bid.documents?.length || 0})` },
    { id: 'matching', label: 'Matching' },
    { id: 'compliance', label: 'Compliance' },
    { id: 'history', label: 'History' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="card mb-6">
        <button 
          onClick={() => navigate(`/tenders/${bid.tenderId}`)}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '16px', fontSize: '14px', fontWeight: 500 }}
        >
          <ArrowLeft size={16} /> Back to Tender
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 className="text-h1" style={{ marginBottom: '8px' }}>{bid.bidder?.name || 'Unknown Bidder'}</h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              <span className="badge badge-neutral" style={{ fontFamily: 'monospace' }}>{bid.id.substring(0, 8)}</span>
              <span>•</span>
              <span style={{ fontWeight: 500 }}>Tender: {bid.tender?.title || bid.tenderId.substring(0, 8)}</span>
              <span>•</span>
              <span>Submitted {new Date(bid.submissionDate).toLocaleDateString()}</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <StatusBadge status={bid.status || 'SUBMITTED'} />
            <button 
              className="btn btn-primary" 
              onClick={() => matchMutation.mutate()} 
              disabled={matchMutation.isPending || bid.documents?.length === 0}
            >
              {matchMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <PlayCircle size={16} />}
              {matchMutation.isPending ? 'Matching...' : 'Match Bid Against Tender'}
            </button>
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
              <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '4px' }}>Documents Uploaded</div>
              <div className="stat-value">{bid.documents?.length || 0}</div>
            </div>
            <div className="card stat-card">
              <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '4px' }}>Matches Found</div>
              <div className="stat-value">{matches?.matches?.length || 0}</div>
            </div>
            <div className="card stat-card">
              <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '4px' }}>Compliance Status</div>
              <div className="stat-value" style={{ textTransform: 'capitalize', fontSize: '20px' }}>{bid.status?.toLowerCase() || 'Pending Evaluation'}</div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="card">
              <h3 className="text-h3">Upload Bidder Documents</h3>
              <p className="text-muted mb-4" style={{ fontSize: '14px' }}>Upload all bidder response PDFs (proposals, financial statements, etc.).</p>
              <FileUpload onUpload={handleUpload} multiple={true} accept=".pdf" />
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border)' }}>
                <h3 className="text-h3" style={{ margin: 0 }}>Bidder Submitted Documents</h3>
              </div>

              {bid.documents?.length === 0 ? (
                <div style={{ padding: '32px' }}>
                  <EmptyState title="No documents" message="Upload bidder documents to begin." />
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
                      {bid.documents?.map((doc: any) => (
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

        {activeTab === 'matching' && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border)' }}>
              <h3 className="text-h3" style={{ margin: 0 }}>Requirement Evidence Mapping</h3>
              <p className="text-muted" style={{ fontSize: '14px', marginTop: '4px' }}>Links extracted bidder evidence to tender requirements.</p>
            </div>
            
            {(!matches?.matches || matches.matches.length === 0) ? (
              <div style={{ padding: '32px' }}>
                <EmptyState title="No matches found" message="Click 'Match Bid Against Tender' to run the matching engine." />
              </div>
            ) : (
              <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Tender Requirement</th>
                      <th>Bid Evidence</th>
                      <th style={{ textAlign: 'center' }}>Match Score</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matches.matches.map((res: any) => (
                      <tr key={res.id}>
                        <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={res.requirement?.rules || res.requirement?.description}>
                          {res.requirement?.rules || res.requirement?.description || 'Unknown'}
                        </td>
                        <td style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-secondary)' }} title={res.evidence?.sourceText}>
                          {res.evidence ? (
                            <div>
                              <span style={{ fontWeight: 600 }}>{res.evidence.type}:</span> {res.evidence.value || res.evidence.sourceText}
                            </div>
                          ) : (
                            <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>None mapped</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center', fontFamily: 'monospace' }}>
                          <span className={`badge ${res.matchScore >= 0.8 ? 'badge-success' : res.matchScore >= 0.5 ? 'badge-warning' : 'badge-error'}`}>
                            {(res.matchScore * 100).toFixed(0)}%
                          </span>
                        </td>
                        <td>
                          <StatusBadge status={res.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="card">
            <h3 className="text-h3" style={{ marginBottom: '8px' }}>Evaluation Traces</h3>
            <p className="text-muted" style={{ fontSize: '14px', marginBottom: '24px' }}>Deterministic reasoning trees mapped from AI extracted evidence back to tender requirements.</p>
            
            {(!matches?.matches || matches.matches.length === 0) ? (
               <EmptyState title="No evaluation traces" message="Run evaluation to see traces." />
            ) : (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                 {matches.matches.map((res: any) => {
                  if (!res.matchingTrace) return null;
                  let trace;
                  try {
                    trace = typeof res.matchingTrace === 'string' ? JSON.parse(res.matchingTrace) : res.matchingTrace;
                  } catch (e) {
                    return null;
                  }
                  return (
                    <div key={res.id} style={{ padding: '20px', border: '1px solid var(--color-border)', borderRadius: '8px', backgroundColor: 'rgba(241, 245, 249, 0.5)' }}>
                      <div style={{ fontWeight: 600, marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ color: 'var(--text-primary)' }}>Requirement: <span style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 400, color: 'var(--text-secondary)', marginLeft: '8px' }}>{res.requirement?.rules || res.requirement?.description}</span></span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Score:</span>
                          <span className="badge badge-primary" style={{ fontFamily: 'monospace' }}>{(res.matchScore * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '4px', border: '1px solid var(--color-border)', overflowX: 'auto' }}>
                        <EvaluationNode node={trace} />
                      </div>
                    </div>
                  );
                })}
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
