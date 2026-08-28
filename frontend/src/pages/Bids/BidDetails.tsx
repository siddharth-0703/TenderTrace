import { useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bidApi } from '../../services/api/bidApi';
import { PlayCircle, Loader2, ArrowLeft, CheckCircle, AlertTriangle, ShieldAlert, XCircle, FileText, Check, HelpCircle, Ban, RotateCcw } from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { StatusBadge } from '../../components/common/StatusBadge';
import { FileUpload } from '../../components/common/FileUpload';
import { ActivityTimeline } from '../../components/common/ActivityTimeline';
import { RuleDisplay } from '../../components/common/RuleDisplay';

export default function BidDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  
  // Default to 'documents' so first-time users land directly on upload
  const initialTab = (searchParams.get('tab') as any) || 'documents';
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'compliance' | 'history'>(initialTab);
  const [decisionNote, setDecisionNote] = useState('');
  const [decisionFeedback, setDecisionFeedback] = useState<string | null>(null);
  const [isModifyingDecision, setIsModifyingDecision] = useState(false);

  const { data: bid, isLoading, isError, refetch } = useQuery({
    queryKey: ['bid', id],
    queryFn: () => bidApi.getBidDetails(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      const docs = query.state.data?.documents;
      const isExtracting = docs?.some((d: any) => d.processingStatus === 'EXTRACTING' || d.processingStatus === 'PROCESSING');
      return isExtracting ? 2000 : false;
    }
  });

  const { data: matches, isLoading: matchesLoading } = useQuery({
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
      queryClient.invalidateQueries({ queryKey: ['bid', id] });
      queryClient.invalidateQueries({ queryKey: ['tender', bid!.tenderId] });
      setActiveTab('compliance');
    },
  });

  const decisionMutation = useMutation({
    mutationFn: ({ decision, comment }: { decision: string; comment?: string }) =>
      bidApi.submitOfficerDecision(id!, decision, comment),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bid', id] });
      queryClient.invalidateQueries({ queryKey: ['bid', id, 'activity'] });
      queryClient.invalidateQueries({ queryKey: ['tender', bid?.tenderId] });
      queryClient.invalidateQueries({ queryKey: ['bids'] });
      setDecisionFeedback(`Decision recorded successfully as ${data.bid?.status || 'UPDATED'}.`);
      setDecisionNote('');
      setTimeout(() => setDecisionFeedback(null), 5000);
    }
  });

  const complianceItems: any[] = useMemo(() => {
    if (Array.isArray(matches) && matches.length > 0) {
      return matches.map((req: any) => {
        const directMatch = req.matches?.[0];
        const directResult = req.results?.[0] || bid?.complianceResults?.find((cr: any) => cr.requirementId === req.id);
        const status = directResult?.status || (directMatch ? 'COMPLIANT' : 'INSUFFICIENT_EVIDENCE');
        return {
          id: req.id,
          requirement: req,
          status: status,
          evidence: directMatch?.evidence || directResult?.evidence,
          rule: req.rules || req.description,
          score: directMatch?.matchScore || directResult?.confidence
        };
      });
    }
    if (Array.isArray(bid?.complianceResults) && bid.complianceResults.length > 0) {
      return bid.complianceResults.map((cr: any) => ({
        id: cr.id,
        requirement: cr.requirement,
        status: cr.status,
        evidence: cr.evidence,
        rule: cr.requirement?.rules || cr.requirement?.description,
        score: cr.confidence
      }));
    }
    if (matches && Array.isArray((matches as any).matches)) {
      return (matches as any).matches;
    }
    return [];
  }, [matches, bid?.complianceResults]);

  if (isLoading || matchesLoading) return <LoadingSpinner text="Loading evaluation workspace..." />;
  if (isError) return <ErrorState title="Failed to load workspace" onRetry={() => refetch()} />;
  if (!bid) return <ErrorState title="Bid not found" />;

  const handleUpload = async (files: File[]) => {
    await uploadMutation.mutateAsync(files);
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'documents', label: `Documents (${bid.documents?.length || 0})` },
    { id: 'compliance', label: `Compliance & Evidence (${complianceItems.length})` },
    { id: 'history', label: 'Audit Trail' },
  ];

  // Derive stats safely
  const totalMatches = complianceItems.length;
  const verifiedMatches = complianceItems.filter((m: any) => m.status === 'COMPLIANT').length;
  const reviewRequired = complianceItems.filter((m: any) => m.status === 'CONFLICTING_EVIDENCE' || m.status === 'INSUFFICIENT_EVIDENCE' || m.status === 'REQUIRES_OFFICER_REVIEW').length;
  const nonCompliant = complianceItems.filter((m: any) => m.status === 'NON_COMPLIANT').length;

  const complianceSummary = {
    total: totalMatches,
    compliant: verifiedMatches,
    reviewRequired,
    nonCompliant
  };

  const bidderDisplayName = bid.bidder?.legalName || bid.bidder?.name || 'Bidder ' + bid.id.substring(0, 8);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div className="card mb-6" style={{ padding: '24px 32px' }}>
        <button 
          onClick={() => navigate(`/tenders/${bid.tenderId}`)}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '16px', fontSize: '13px', fontWeight: 500 }}
        >
          <ArrowLeft size={16} /> Back to Tender Workspace
        </button>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
          <div>
            <h1 className="text-h1" style={{ marginBottom: '8px', color: 'var(--color-primary)' }}>{bidderDisplayName}</h1>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              <span style={{ fontWeight: 600 }}>Tender: {bid.tender?.title || bid.tenderId.substring(0, 8)}</span>
              <span>•</span>
              <span className="badge badge-neutral" style={{ fontFamily: 'monospace' }}>Bid Ref: {bid.id.substring(0, 8)}</span>
              <span>•</span>
              <span>Submitted: {(bid.submittedAt || bid.submissionDate) ? new Date((bid.submittedAt || bid.submissionDate)!).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center', padding: '12px 24px', backgroundColor: 'var(--color-background)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verification</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>{verifiedMatches} / {totalMatches > 0 ? totalMatches : '-'}</div>
            </div>
            <div style={{ width: '1px', height: '32px', backgroundColor: 'var(--color-border)' }}></div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</div>
              <div style={{ marginTop: '4px' }}><StatusBadge status={bid.status || 'SUBMITTED'} /></div>
            </div>
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
      <div style={{ paddingBottom: '64px' }}>
        {activeTab === 'overview' && (
           <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
             {/* Key Metrics Grid */}
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
               <div className="card" style={{ padding: '20px' }}>
                 <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                   Documents
                 </div>
                 <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '8px', color: 'var(--color-primary)' }}>
                   {bid.documents?.length || 0}
                 </div>
                 <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                   {bid.documents?.reduce((acc: number, d: any) => acc + (d.pageCount || 0), 0) || 0} pages total
                 </div>
               </div>

               <div className="card" style={{ padding: '20px' }}>
                 <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                   Requirements Verified
                 </div>
                 <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '8px', color: complianceSummary.compliant > 0 ? 'var(--color-success)' : 'var(--text-primary)' }}>
                   {complianceSummary.compliant} / {complianceSummary.total}
                 </div>
                 <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                   {complianceSummary.total > 0 ? `${Math.round((complianceSummary.compliant / complianceSummary.total) * 100)}% compliance rate` : 'Not evaluated yet'}
                 </div>
               </div>

               <div className="card" style={{ padding: '20px' }}>
                 <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                   Non-Compliant Criteria
                 </div>
                 <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '8px', color: complianceSummary.nonCompliant > 0 ? 'var(--color-error)' : 'var(--color-success)' }}>
                   {complianceSummary.nonCompliant}
                 </div>
                 <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                   {complianceSummary.reviewRequired} pending review
                 </div>
               </div>

               <div className="card" style={{ padding: '20px' }}>
                 <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                   Official Determination
                 </div>
                 <div style={{ marginTop: '12px' }}>
                   <StatusBadge status={bid.status || 'SUBMITTED'} />
                 </div>
                 <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                   {bid.status === 'REJECTED' && 'Disqualified by Officer'}
                   {bid.status === 'APPROVED' && 'Accepted & Qualified'}
                   {bid.status === 'UNDER_REVIEW' && 'Clarification Requested'}
                   {(!bid.status || bid.status === 'SUBMITTED') && 'Awaiting Determination'}
                 </div>
               </div>
             </div>

             {/* Bidder & Tender Summary */}
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
               <div className="card">
                 <h3 className="text-h3" style={{ fontSize: '15px', marginBottom: '16px' }}>Bidder Profile</h3>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
                     <span style={{ color: 'var(--text-muted)' }}>Legal Name</span>
                     <span style={{ fontWeight: 600 }}>{bid.bidder?.legalName || bid.bidder?.name || 'N/A'}</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
                     <span style={{ color: 'var(--text-muted)' }}>Bid Reference</span>
                     <span style={{ fontFamily: 'monospace' }}>{bid.id}</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
                     <span style={{ color: 'var(--text-muted)' }}>Submission Date</span>
                     <span>{new Date(bid.submittedAt || bid.createdAt).toLocaleDateString()}</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                     <span style={{ color: 'var(--text-muted)' }}>Tender Package</span>
                     <span style={{ fontWeight: 500 }}>{bid.tender?.title || bid.tenderId}</span>
                   </div>
                 </div>
               </div>

               <div className="card">
                 <h3 className="text-h3" style={{ fontSize: '15px', marginBottom: '16px' }}>Evaluation Actions</h3>
                 <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                   {complianceSummary.total > 0 
                     ? `Automated compliance verification analyzed ${complianceSummary.total} criteria across submitted bid packages.`
                     : 'Bid documents need to be uploaded and evaluated against tender requirements.'}
                 </p>
                 <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                   <button 
                     className="btn btn-primary"
                     onClick={() => setActiveTab('compliance')}
                     style={{ fontSize: '13px' }}
                   >
                     View Compliance & Evidence ({complianceSummary.total})
                   </button>
                   <button 
                     className="btn btn-outline"
                     onClick={() => setActiveTab('documents')}
                     style={{ fontSize: '13px' }}
                   >
                     Manage Documents ({bid.documents?.length || 0})
                   </button>
                 </div>
               </div>
             </div>
           </div>
        )}

        {activeTab === 'documents' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="card">
              <h3 className="text-h3" style={{ fontSize: '16px' }}>Upload Bidder Documents</h3>
              <p className="text-muted mb-4" style={{ fontSize: '13px' }}>Upload all bidder response PDFs (proposals, financial statements, etc.).</p>
              <FileUpload onUpload={handleUpload} multiple={true} accept=".pdf" />
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="text-h3" style={{ margin: 0, fontSize: '16px' }}>Bidder Submitted Documents</h3>
                <button 
                  className="btn btn-primary" 
                  onClick={() => matchMutation.mutate()} 
                  disabled={matchMutation.isPending || bid.documents?.length === 0}
                >
                  {matchMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <PlayCircle size={16} />}
                  {matchMutation.isPending ? 'Processing Evaluation...' : 'Run Compliance Evaluation'}
                </button>
              </div>

              {bid.documents?.length === 0 ? (
                <div style={{ padding: '48px' }}>
                  <EmptyState title="No documents found" message="Upload bidder documents to begin evaluation." />
                </div>
              ) : (
                <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Filename</th>
                        <th>Pages</th>
                        <th>Classification</th>
                        <th>Processing Status</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bid.documents?.map((doc: any) => (
                        <tr key={doc.id}>
                          <td style={{ fontWeight: 500 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <FileText size={16} color="var(--text-muted)" />
                              {doc.filename}
                            </div>
                          </td>
                          <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{doc.pageCount || '-'} pages</td>
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
                          <td style={{ textAlign: 'right' }}>
                            <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '12px' }}>View</button>
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
          <div>
            {/* System Assessment Summary */}
            <div className="card mb-6" style={{ padding: '24px' }}>
               <h3 className="text-h3" style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '16px' }}>System Assessment</h3>
               
               {complianceItems.length === 0 ? (
                 <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
                   <p>No evaluation data available. Go to Documents to run the compliance evaluation.</p>
                 </div>
               ) : (
                 <div>
                   <p style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
                     {verifiedMatches} of {totalMatches} requirements verified
                   </p>
                   <div style={{ display: 'flex', gap: '24px' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                       <CheckCircle size={18} color="var(--color-success)" />
                       <span style={{ fontWeight: 500 }}>{verifiedMatches} Compliant</span>
                     </div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                       <AlertTriangle size={18} color="var(--color-warning)" />
                       <span style={{ fontWeight: 500 }}>{reviewRequired} Review Required</span>
                     </div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                       <XCircle size={18} color="var(--color-error)" />
                       <span style={{ fontWeight: 500 }}>{nonCompliant} Non-Compliant</span>
                     </div>
                   </div>
                 </div>
               )}
            </div>

            {/* Detailed Traceability view */}
            {complianceItems.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {complianceItems.map((res: any) => {
                  
                  const isConflict = res.status === 'CONFLICTING_EVIDENCE';
                  const isMissing = res.status === 'INSUFFICIENT_EVIDENCE';
                  const isFail = res.status === 'NON_COMPLIANT';
                  
                  return (
                    <div key={res.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                      {/* Requirement Header */}
                      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-background)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                            Requirement • {res.requirement?.category || 'General'}
                          </div>
                          <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-primary)', maxWidth: '800px' }}>
                            {res.requirement?.description || res.requirement?.rules}
                          </div>
                        </div>
                        <StatusBadge status={res.status} />
                      </div>

                      {/* Conflict / Missing Alerts */}
                      {isConflict && (
                        <div className="alert-box alert-warning" style={{ margin: '16px 24px', borderRadius: '4px' }}>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            <ShieldAlert size={18} color="var(--color-warning)" style={{ marginTop: '2px' }} />
                            <div>
                              <strong style={{ display: 'block', color: '#5f3700', marginBottom: '4px' }}>Conflicting Evidence Detected</strong>
                              <p style={{ fontSize: '13px', color: '#8a5200' }}>The system found multiple sources of evidence that contradict each other. Officer review is required to determine the authoritative value.</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {isMissing && (
                        <div className="alert-box alert-warning" style={{ margin: '16px 24px', borderRadius: '4px' }}>
                           <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            <AlertTriangle size={18} color="var(--color-warning)" style={{ marginTop: '2px' }} />
                            <div>
                              <strong style={{ display: 'block', color: '#5f3700', marginBottom: '4px' }}>Missing Evidence</strong>
                              <p style={{ fontSize: '13px', color: '#8a5200' }}>No supporting document or data could be identified in the submitted bid package for this requirement.</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Evidence & Rule Breakdown */}
                      <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                        
                        {/* Left: Extracted Evidence */}
                        <div>
                           <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                             System Finding / Evidence
                           </div>
                           
                           {res.evidence ? (
                             <div className="evidence-card">
                               <div className="evidence-header">
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 500 }}>
                                    <FileText size={14} color="var(--text-muted)" />
                                    Document Ref: {String(res.evidence.documentId || res.evidence.sourceDocumentId || res.evidence.id || 'N/A').substring(0, 8)}
                                  </div>
                                  <span className="badge badge-neutral" style={{ fontSize: '10px' }}>Page {res.evidence.page ?? res.evidence.pageNumber ?? '?'}</span>
                               </div>
                               <div style={{ padding: '8px 0', fontSize: '14px' }}>
                                 <span style={{ color: 'var(--text-secondary)' }}>Extracted Value: </span>
                                 <strong style={{ color: 'var(--text-primary)' }}>{res.evidence.value || res.evidence.sourceText || 'Detected in document'}</strong>
                               </div>
                               <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                                 Confidence: {typeof res.evidence.confidence === 'number' ? (res.evidence.confidence <= 1 ? (res.evidence.confidence * 100).toFixed(0) : res.evidence.confidence.toFixed(0)) : '80'}%
                               </div>
                             </div>
                           ) : (
                             <div style={{ padding: '16px', border: '1px dashed var(--color-border)', borderRadius: '4px', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>
                               No specific evidence mapped.
                             </div>
                           )}
                        </div>

                        {/* Right: Rule Evaluation */}
                        <div>
                           <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                             Rule & Result
                           </div>
                           
                           <div style={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '16px' }}>
                             <div style={{ marginBottom: '12px' }}>
                               <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Evaluation Criterion:</span>
                               <div style={{ backgroundColor: 'white', padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--color-border)', marginTop: '6px' }}>
                                 <RuleDisplay rules={res.rule || res.requirement?.rules} fallbackDescription={res.requirement?.description} />
                               </div>
                             </div>
                             
                             <div style={{ paddingTop: '12px', borderTop: '1px dashed var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                               <span style={{ fontSize: '13px', fontWeight: 500 }}>Result:</span>
                               {isFail ? (
                                 <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-error)', fontWeight: 600, fontSize: '13px' }}>
                                   <XCircle size={14} /> Requirement not satisfied
                                 </span>
                               ) : res.status === 'COMPLIANT' ? (
                                 <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-success)', fontWeight: 600, fontSize: '13px' }}>
                                   <CheckCircle size={14} /> Requirement satisfied
                                 </span>
                               ) : (
                                 <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-warning)', fontWeight: 600, fontSize: '13px' }}>
                                   <AlertTriangle size={14} /> Pending officer review
                                 </span>
                               )}
                             </div>
                           </div>
                        </div>

                      </div>
                    </div>
                  );
                })}

                {/* Officer Decision Panel */}
                <div className="card" style={{ padding: '24px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                    <div>
                      <h3 className="text-h3" style={{ fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-primary)', margin: 0 }}>
                        Authorized Officer Determination
                      </h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
                        System assessments are advisory. Final compliance acceptance rests with the procurement authority.
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Official Status:</span>
                      <StatusBadge status={bid.status || 'SUBMITTED'} />
                    </div>
                  </div>

                  {decisionFeedback && (
                    <div className="alert-box alert-info" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '4px' }}>
                      <CheckCircle size={16} color="var(--color-primary)" />
                      <span style={{ fontSize: '13px', fontWeight: 500 }}>{decisionFeedback}</span>
                    </div>
                  )}

                  {/* If decision already exists and not modifying */}
                  {['APPROVED', 'REJECTED', 'UNDER_REVIEW'].includes(bid.status) && !isModifyingDecision ? (
                    <div style={{ 
                      padding: '16px 20px', 
                      borderRadius: '6px', 
                      backgroundColor: bid.status === 'APPROVED' ? 'rgba(22,101,52,0.06)' : bid.status === 'REJECTED' ? 'rgba(197,34,31,0.06)' : 'rgba(180,83,9,0.06)',
                      border: `1px solid ${bid.status === 'APPROVED' ? 'rgba(22,101,52,0.25)' : bid.status === 'REJECTED' ? 'rgba(197,34,31,0.25)' : 'rgba(180,83,9,0.25)'}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '16px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {bid.status === 'APPROVED' ? (
                          <CheckCircle size={24} color="var(--color-success)" />
                        ) : bid.status === 'REJECTED' ? (
                          <XCircle size={24} color="var(--color-error)" />
                        ) : (
                          <AlertTriangle size={24} color="var(--color-warning)" />
                        )}
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '14px', color: bid.status === 'APPROVED' ? 'var(--color-success)' : bid.status === 'REJECTED' ? 'var(--color-error)' : 'var(--color-warning)' }}>
                            {bid.status === 'APPROVED' && 'OFFICIAL DECISION: BID APPROVED & QUALIFIED'}
                            {bid.status === 'REJECTED' && 'OFFICIAL DECISION: BID DISQUALIFIED & REJECTED'}
                            {bid.status === 'UNDER_REVIEW' && 'OFFICIAL DECISION: CLARIFICATION REQUESTED'}
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {bid.status === 'APPROVED' && 'This bid has satisfied mandatory procurement criteria and has been formally accepted.'}
                            {bid.status === 'REJECTED' && 'This bid failed mandatory compliance rules and was disqualified by the authorized officer.'}
                            {bid.status === 'UNDER_REVIEW' && 'The evaluation has been paused pending receipt of clarifying documents from the bidder.'}
                          </div>
                        </div>
                      </div>

                      <button 
                        className="btn btn-outline" 
                        onClick={() => setIsModifyingDecision(true)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 14px', backgroundColor: 'white' }}
                      >
                        <RotateCcw size={13} /> Modify Determination
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ marginTop: '12px', marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Officer Remarks / Evaluation Note (Optional)
                        </label>
                        <textarea 
                          value={decisionNote}
                          onChange={(e) => setDecisionNote(e.target.value)}
                          placeholder="Add justification or specific remarks for audit compliance..."
                          rows={2}
                          style={{ 
                            width: '100%', 
                            padding: '10px 12px', 
                            borderRadius: '4px', 
                            border: '1px solid var(--color-border)', 
                            fontSize: '13px', 
                            backgroundColor: 'var(--color-background)',
                            resize: 'vertical'
                          }}
                        />
                      </div>
                      
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'flex-start' }}>
                        <button 
                          className="btn btn-success" 
                          onClick={() => {
                            decisionMutation.mutate({ decision: 'APPROVED', comment: decisionNote });
                            setIsModifyingDecision(false);
                          }}
                          disabled={decisionMutation.isPending}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 18px', fontSize: '13px' }}
                        >
                          {decisionMutation.isPending ? <Loader2 className="animate-spin" size={15} /> : <Check size={15} />}
                          Approve Bid
                        </button>
                        
                        <button 
                          className="btn btn-outline" 
                          onClick={() => {
                            decisionMutation.mutate({ decision: 'CLARIFICATION_REQUESTED', comment: decisionNote });
                            setIsModifyingDecision(false);
                          }}
                          disabled={decisionMutation.isPending}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 18px', fontSize: '13px', backgroundColor: 'white' }}
                        >
                          {decisionMutation.isPending ? <Loader2 className="animate-spin" size={15} /> : <HelpCircle size={15} />}
                          Request Clarification
                        </button>
                        
                        <button 
                          className="btn btn-danger" 
                          onClick={() => {
                            const confirmed = window.confirm('Are you sure you want to REJECT this bid? This will be recorded in the audit trail.');
                            if (confirmed) {
                              decisionMutation.mutate({ decision: 'REJECTED', comment: decisionNote });
                              setIsModifyingDecision(false);
                            }
                          }}
                          disabled={decisionMutation.isPending}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 18px', fontSize: '13px' }}
                        >
                          {decisionMutation.isPending ? <Loader2 className="animate-spin" size={15} /> : <Ban size={15} />}
                          Reject Bid
                        </button>

                        {isModifyingDecision && (
                          <button 
                            className="btn btn-outline" 
                            onClick={() => setIsModifyingDecision(false)}
                            style={{ padding: '8px 14px', fontSize: '13px' }}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="card">
            <h3 className="text-h3" style={{ marginBottom: '24px' }}>Audit Trail</h3>
            <ActivityTimeline activities={activities || []} />
          </div>
        )}
      </div>
    </div>
  );
}
