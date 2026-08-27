import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bidApi } from '../../services/api/bidApi';
import { CheckCircle2, XCircle, PlayCircle, Loader2, FileText, ChevronRight, ChevronDown } from 'lucide-react';

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
        
        {node.result === 'PASS' && <span className="text-xs text-success font-bold flex items-center"><CheckCircle2 size={12}/> PASS</span>}
        {node.result === 'FAIL' && <span className="text-xs text-error font-bold flex items-center"><XCircle size={12}/> FAIL</span>}
        {node.result === 'MISSING_EVIDENCE' && <span className="text-xs text-warning font-bold">MISSING EVIDENCE</span>}
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

  const { data: bid, isLoading } = useQuery({
    queryKey: ['bid', id],
    queryFn: () => bidApi.getBidDetails(id!),
    enabled: !!id,
  });

  const processMutation = useMutation({
    mutationFn: () => bidApi.processEvidence(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bid', id] });
    },
  });

  if (isLoading) return <div className="text-muted">Loading bid details...</div>;
  if (!bid) return <div className="text-error">Bid not found.</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-h1" style={{ marginBottom: '4px' }}>Bid: {bid.id.substring(0, 8)}...</h1>
          <div className="flex items-center gap-2 text-sm text-muted">
            <span className="font-semibold">{bid.bidder?.name}</span>
            <span>•</span>
            <span>Tender: {bid.tender?.title}</span>
          </div>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => processMutation.mutate()} 
          disabled={processMutation.isPending}
        >
          {processMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <PlayCircle size={16} />}
          {processMutation.isPending ? 'Evaluating...' : 'Evaluate Compliance (Phase 5)'}
        </button>
      </div>

      <div className="tabs-container">
        <button className={`tab-btn ${activeTab === 'compliance' ? 'active' : ''}`} onClick={() => setActiveTab('compliance')}>Compliance & Evidence Mapping</button>
        <button className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`} onClick={() => setActiveTab('documents')}>Bidder Documents ({bid.documents?.length || 0})</button>
      </div>

      {activeTab === 'documents' && (
        <div className="card">
          <h3 className="text-h3 mb-4">Bidder Submitted Documents</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Classification</th>
                  <th>Extracted Evidence</th>
                </tr>
              </thead>
              <tbody>
                {bid.documents?.map((doc: any) => (
                  <tr key={doc.id}>
                    <td className="font-medium"><FileText size={14} className="inline mr-2 text-muted" />{doc.filename}</td>
                    <td>
                      {doc.documentClass ? (
                        <span className="badge badge-primary">{doc.documentClass}</span>
                      ) : (
                        <span className="text-muted text-xs">Unclassified</span>
                      )}
                    </td>
                    <td>
                      {doc.evidence?.length > 0 ? (
                        <span className="badge badge-success">{doc.evidence.length} Evidence Items</span>
                      ) : (
                        <span className="text-muted text-xs">No evidence</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'compliance' && (
        <div className="flex-col gap-6">
          <div className="card">
            <h3 className="text-h3">Compliance Results</h3>
            {(!bid.complianceResults || bid.complianceResults.length === 0) ? (
              <p className="text-muted text-sm mt-2">No compliance results yet. Run evaluation.</p>
            ) : (
              <div className="table-container mt-4">
                <table>
                  <thead>
                    <tr>
                      <th>Requirement Rule</th>
                      <th>Evidence Document</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bid.complianceResults.map((res: any) => (
                      <tr key={res.id}>
                        <td className="font-mono text-sm">{JSON.stringify(res.requirement?.rule)}</td>
                        <td>
                          {res.evidence ? (
                            <div className="text-sm">
                              <span className="font-semibold">{res.evidence.type}:</span> {res.evidence.value}
                            </div>
                          ) : (
                            <span className="text-muted text-xs">None mapped</span>
                          )}
                        </td>
                        <td>
                          {res.status === 'PASS' && <span className="badge badge-success">PASS</span>}
                          {res.status === 'FAIL' && <span className="badge badge-error">FAIL</span>}
                          {res.status === 'MISSING_EVIDENCE' && <span className="badge badge-warning">MISSING EVIDENCE</span>}
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
            {bid.complianceResults?.map((res: any) => {
              if (!res.evaluationTrace) return null;
              let trace;
              try {
                trace = JSON.parse(res.evaluationTrace);
              } catch (e) {
                return null;
              }
              return (
                <div key={res.id} className="mb-6 p-4 border border-[var(--color-border)] rounded-md">
                  <div className="font-semibold mb-2 flex items-center gap-2">
                    Trace for: <span className="font-mono text-sm font-normal">{JSON.stringify(res.requirement?.rule)}</span>
                  </div>
                  <EvaluationNode node={trace} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
