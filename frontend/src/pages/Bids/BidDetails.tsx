import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bidApi } from '../../services/api/bidApi';
import { PlayCircle, Loader2, FileText, ChevronRight, ChevronDown } from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { StatusBadge } from '../../components/common/StatusBadge';
import { FileUpload } from '../../components/common/FileUpload';

function EvaluationNode({ node }: { node: any }) {
  const [expanded, setExpanded] = useState(true);
  if (!node) return null;

  const hasChildren = node.children && node.children.length > 0;

  return (
    <div style={{ marginLeft: '1rem', marginTop: '0.5rem', borderLeft: '2px solid var(--color-border)', paddingLeft: '1rem' }}>
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        {hasChildren && (
          <span className="text-muted">{expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>
        )}
        <span className="font-mono text-sm font-semibold">{node.type}</span>
        {node.rule && <span className="text-sm font-mono bg-slate-100 px-1 rounded">{JSON.stringify(node.rule)}</span>}
        {node.extractedValue && <span className="text-xs badge badge-neutral">Extracted: {node.extractedValue}</span>}
        {node.normalizedValue !== undefined && <span className="text-xs badge badge-primary">Normalized: {node.normalizedValue}</span>}
        
        <StatusBadge status={node.result || 'UNKNOWN'} />
      </div>
      
      {expanded && hasChildren && (
        <div style={{ marginTop: '0.5rem' }}>
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
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'documents' | 'compliance'>('compliance');

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

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-h1" style={{ marginBottom: '4px' }}>Bid: {bid.id.substring(0, 8)}...</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <span className="font-semibold">{bid.bidder?.name || 'Unknown Bidder'}</span>
            <span className="hidden md:inline">•</span>
            <span>Tender: {bid.tenderId}</span>
          </div>
        </div>
        <button 
          className="btn btn-primary w-full md:w-auto" 
          onClick={() => matchMutation.mutate()} 
          disabled={matchMutation.isPending || bid.documents?.length === 0}
        >
          {matchMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <PlayCircle size={16} />}
          {matchMutation.isPending ? 'Matching...' : 'Match Bid Against Tender'}
        </button>
      </div>

      <div className="tabs-container">
        <button className={`tab-btn ${activeTab === 'compliance' ? 'active' : ''}`} onClick={() => setActiveTab('compliance')}>Compliance Mapping</button>
        <button className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`} onClick={() => setActiveTab('documents')}>Bidder Documents ({bid.documents?.length || 0})</button>
      </div>

      {activeTab === 'documents' && (
        <div className="flex flex-col gap-6">
          <div className="card">
            <h3 className="text-h3">Upload Bidder Documents</h3>
            <p className="text-muted text-sm mb-4">Upload all bidder response PDFs.</p>
            <FileUpload onUpload={handleUpload} multiple={true} accept=".pdf" />
          </div>

          <div className="card">
            <h3 className="text-h3 mb-4">Bidder Submitted Documents</h3>
            {bid.documents?.length === 0 ? (
               <EmptyState title="No documents" message="Upload bidder documents to begin." />
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Filename</th>
                      <th>Classification</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bid.documents?.map((doc: any) => (
                      <tr key={doc.id}>
                        <td className="font-medium truncate max-w-xs" title={doc.filename}>
                          <FileText size={14} className="inline mr-2 text-muted" />{doc.filename}
                        </td>
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

      {activeTab === 'compliance' && (
        <div className="flex-col gap-6">
          <div className="card">
            <h3 className="text-h3">Requirement Evidence Mapping</h3>
            {(!matches?.matches || matches.matches.length === 0) ? (
              <EmptyState title="No compliance results" message="Click 'Match Bid Against Tender' to run the phase 9 matching engine." />
            ) : (
              <div className="table-container mt-4">
                <table>
                  <thead>
                    <tr>
                      <th>Tender Requirement</th>
                      <th>Bid Evidence</th>
                      <th>Match Score</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matches.matches.map((res: any) => (
                      <tr key={res.id}>
                        <td className="font-mono text-sm max-w-xs truncate" title={res.requirement?.rules || res.requirement?.description}>
                          {res.requirement?.rules || res.requirement?.description || 'Unknown'}
                        </td>
                        <td className="text-sm max-w-xs truncate" title={res.evidence?.sourceText}>
                          {res.evidence ? (
                            <div>
                              <span className="font-semibold">{res.evidence.type}:</span> {res.evidence.value || res.evidence.sourceText}
                            </div>
                          ) : (
                            <span className="text-muted text-xs">None mapped</span>
                          )}
                        </td>
                        <td>{res.matchScore}</td>
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

          <div className="card mt-4">
            <h3 className="text-h3 mb-4">Evaluation Traces</h3>
            <p className="text-sm text-muted mb-4">Deterministic reasoning trees mapped from AI extracted evidence back to tender requirements.</p>
            {(!matches?.matches || matches.matches.length === 0) ? (
               <p className="text-muted text-sm mt-2">Run evaluation to see traces.</p>
            ) : (
               matches.matches.map((res: any) => {
                if (!res.matchingTrace) return null;
                let trace;
                try {
                  trace = typeof res.matchingTrace === 'string' ? JSON.parse(res.matchingTrace) : res.matchingTrace;
                } catch (e) {
                  return null;
                }
                return (
                  <div key={res.id} className="mb-6 p-4 border border-[var(--color-border)] rounded-md">
                    <div className="font-semibold mb-2 flex flex-col gap-1">
                      <span>Requirement: <span className="font-mono text-sm font-normal">{res.requirement?.rules || res.requirement?.description}</span></span>
                      <span className="text-xs text-muted">Match Score: {res.matchScore}</span>
                    </div>
                    <EvaluationNode node={trace} />
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
