import { useState, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bidApi } from '../../services/api/bidApi';
import {
  PlayCircle,
  Loader2,
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
  XCircle,
  FileText,
  Check,
  HelpCircle,
  Ban,
  RotateCcw,
  ShieldCheck,
  ExternalLink,
  Activity,
  UserCheck
} from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { StatusBadge } from '../../components/common/StatusBadge';
import { FileUpload } from '../../components/common/FileUpload';
import { ActivityTimeline } from '../../components/common/ActivityTimeline';
import { RuleDisplay } from '../../components/common/RuleDisplay';

export default function BidDetails() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const initialTab = (searchParams.get('tab') as any) || 'overview';
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
      const isExtracting = docs?.some(
        (d: any) => d.processingStatus === 'EXTRACTING' || d.processingStatus === 'PROCESSING'
      );
      return isExtracting ? 2000 : false;
    },
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
      if (!res.ok) return [];
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
    },
  });

  const complianceItems: any[] = useMemo(() => {
    if (Array.isArray(matches) && matches.length > 0) {
      return matches.map((req: any) => {
        const directMatch = req.matches?.[0];
        const directResult =
          req.results?.[0] ||
          bid?.complianceResults?.find((cr: any) => cr.requirementId === req.id);
        const status =
          directResult?.status || (directMatch ? 'COMPLIANT' : 'INSUFFICIENT_EVIDENCE');
        return {
          id: req.id,
          requirement: req,
          status: status,
          evidence: directMatch?.evidence || directResult?.evidence,
          rule: req.rules || req.description,
          score: directMatch?.matchScore || directResult?.confidence,
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
        score: cr.confidence,
      }));
    }
    if (matches && Array.isArray((matches as any).matches)) {
      return (matches as any).matches;
    }
    return [];
  }, [matches, bid?.complianceResults]);

  if (isLoading || matchesLoading) {
    return <LoadingSpinner text="Loading bidder evaluation workspace and evidence..." />;
  }
  if (isError) return <ErrorState title="Failed to load bidder workspace" onRetry={() => refetch()} />;
  if (!bid) return <ErrorState title="Bidder dossier not found" />;

  const handleUpload = async (files: File[]) => {
    await uploadMutation.mutateAsync(files);
  };

  const totalMatches = complianceItems.length;
  const verifiedMatches = complianceItems.filter((m: any) => m.status === 'COMPLIANT').length;
  const reviewRequired = complianceItems.filter(
    (m: any) =>
      m.status === 'CONFLICTING_EVIDENCE' ||
      m.status === 'INSUFFICIENT_EVIDENCE' ||
      m.status === 'REQUIRES_OFFICER_REVIEW'
  ).length;
  const nonCompliant = complianceItems.filter((m: any) => m.status === 'NON_COMPLIANT').length;

  const complianceSummary = {
    total: totalMatches,
    compliant: verifiedMatches,
    reviewRequired,
    nonCompliant,
  };

  const bidderDisplayName = bid.bidder?.legalName || bid.bidder?.name || 'Bidder ' + bid.id.substring(0, 8);

  const tabs = [
    { id: 'overview', label: 'Dossier Overview' },
    { id: 'documents', label: 'Submitted Documents', count: bid.documents?.length || 0 },
    { id: 'compliance', label: 'Compliance & Evidence Matrix', count: complianceItems.length },
    { id: 'history', label: 'Audit Trail' },
  ];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* ── Breadcrumbs ── */}
      <div className="breadcrumb">
        <Link to="/bids">Bids &amp; Bidders</Link>
        <span className="sep">›</span>
        {bid.tenderId && (
          <>
            <Link to={`/tenders/${bid.tenderId}`}>Tender Workspace</Link>
            <span className="sep">›</span>
          </>
        )}
        <span className="current">{bidderDisplayName}</span>
      </div>

      {/* ── Header Card ── */}
      <div className="card" style={{ marginBottom: '24px', padding: '24px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge--neutral font-mono">BID: {bid.id.substring(0, 8)}</span>
              <StatusBadge status={bid.status || 'SUBMITTED'} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-slate-900)', marginBottom: '8px' }}>
              {bidderDisplayName}
            </h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <span>
                <strong>Tender:</strong>{' '}
                <Link to={`/tenders/${bid.tenderId}`} style={{ color: 'var(--color-navy-500)', fontWeight: 500 }}>
                  {bid.tender?.title || bid.tenderId.substring(0, 8)}
                </Link>
              </span>
              <span>•</span>
              <span>
                <strong>Submitted:</strong>{' '}
                {bid.submittedAt || bid.submissionDate
                  ? new Date((bid.submittedAt || bid.submissionDate)!).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'N/A'}
              </span>
            </div>
          </div>

          {/* Quick Metrics & Forensic Bridge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link
              to={`/bids/${bid.id}/fraud-risk`}
              className="btn btn-secondary btn-sm"
              style={{ fontWeight: 600, borderColor: 'var(--color-warning-border)', color: 'var(--color-warning)' }}
            >
              <ShieldAlert size={14} />
              Fraud &amp; Anomaly Analysis <ExternalLink size={12} />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="tabs-nav" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="tab-badge">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div style={{ paddingBottom: '48px' }}>
        {/* ── TAB 1: OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* KPI Metric Summary */}
            <div className="stat-grid">
              <div className="stat-card">
                <span className="stat-card__label">Dossier Documents</span>
                <div className="stat-card__value">{bid.documents?.length || 0}</div>
                <div className="stat-card__sub">
                  <span>{bid.documents?.reduce((acc: number, d: any) => acc + (d.pageCount || 0), 0) || 0} total pages</span>
                </div>
              </div>

              <div className="stat-card">
                <span className="stat-card__label">Requirements Verified</span>
                <div
                  className="stat-card__value"
                  style={{ color: complianceSummary.compliant > 0 ? 'var(--color-success)' : 'inherit' }}
                >
                  {complianceSummary.compliant} / {complianceSummary.total}
                </div>
                <div className="stat-card__sub">
                  <span>
                    {complianceSummary.total > 0
                      ? `${Math.round((complianceSummary.compliant / complianceSummary.total) * 100)}% compliance rate`
                      : 'Not evaluated yet'}
                  </span>
                </div>
              </div>

              <div className="stat-card">
                <span className="stat-card__label">Pending Officer Review</span>
                <div
                  className="stat-card__value"
                  style={{ color: complianceSummary.reviewRequired > 0 ? 'var(--color-warning)' : 'inherit' }}
                >
                  {complianceSummary.reviewRequired}
                </div>
                <div className="stat-card__sub">
                  <span>{complianceSummary.nonCompliant} non-compliant</span>
                </div>
              </div>

              <div className="stat-card">
                <span className="stat-card__label">Official Status</span>
                <div style={{ marginTop: '8px' }}>
                  <StatusBadge status={bid.status || 'SUBMITTED'} />
                </div>
                <div className="stat-card__sub" style={{ marginTop: '6px' }}>
                  <span>Advisory determination active</span>
                </div>
              </div>
            </div>

            {/* Profile & Evaluation Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
              <div className="card">
                <div className="card-header">
                  <span className="card-title">
                    <UserCheck size={16} color="var(--color-navy-500)" />
                    Bidder Legal Entity Profile
                  </span>
                </div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Registered Legal Name</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-slate-900)' }}>{bidderDisplayName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Bid Identifier</span>
                    <span className="font-mono">{bid.id}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Submission Timestamp</span>
                    <span>{new Date(bid.submittedAt || bid.createdAt).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Target Tender</span>
                    <span style={{ fontWeight: 500 }}>{bid.tender?.title || bid.tenderId}</span>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <span className="card-title">
                    <ShieldCheck size={16} color="var(--color-success)" />
                    Verification &amp; Decision Summary
                  </span>
                </div>
                <div className="card-body">
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.6 }}>
                    {complianceSummary.total > 0
                      ? `Automated rule engine evaluated ${complianceSummary.total} criteria across submitted bid packages with structured evidence mapping.`
                      : 'Bid documents require processing and matching against extracted tender requirement rules.'}
                  </p>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => setActiveTab('compliance')}
                    >
                      View Compliance Matrix ({complianceSummary.total})
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setActiveTab('documents')}
                    >
                      Manage Dossier Files ({bid.documents?.length || 0})
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: DOCUMENTS ── */}
        {activeTab === 'documents' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="card">
              <div className="card-header">
                <span className="card-title">
                  <FileText size={16} color="var(--color-navy-500)" />
                  Upload Bidder Response Dossier
                </span>
              </div>
              <div className="card-body">
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Upload technical proposals, statutory certificates (GST, PAN, MSME, ITR), and audited balance sheets.
                </p>
                <FileUpload onUpload={handleUpload} multiple={true} accept=".pdf" />
              </div>
            </div>

            <div className="table-wrapper">
              <div className="table-toolbar">
                <span className="table-toolbar-title">
                  Submitted Bidder Documents
                  <span className="badge badge--neutral" style={{ marginLeft: '8px' }}>
                    {bid.documents?.length || 0}
                  </span>
                </span>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => matchMutation.mutate()}
                  disabled={matchMutation.isPending || !bid.documents || bid.documents.length === 0}
                >
                  {matchMutation.isPending ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      Matching Rules…
                    </>
                  ) : (
                    <>
                      <PlayCircle size={14} />
                      Run Compliance Verification
                    </>
                  )}
                </button>
              </div>

              {(!bid.documents || bid.documents.length === 0) ? (
                <div style={{ padding: '36px' }}>
                  <EmptyState
                    title="No bid documents uploaded"
                    message="Upload bidder PDF files above to begin OCR and compliance evaluation."
                  />
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Document Name</th>
                      <th>Pages</th>
                      <th>Classification</th>
                      <th>Forensic Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bid.documents.map((doc: any) => (
                      <tr key={doc.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                            <FileText size={15} color="var(--text-muted)" />
                            {doc.filename}
                          </div>
                        </td>
                        <td className="font-mono" style={{ color: 'var(--text-muted)' }}>
                          {doc.pageCount || '—'}
                        </td>
                        <td>
                          {doc.documentClass ? (
                            <span className="badge badge--info">{doc.documentClass}</span>
                          ) : (
                            <span style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                              Unclassified
                            </span>
                          )}
                        </td>
                        <td>
                          <StatusBadge status={doc.processingStatus} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 3: COMPLIANCE & EVIDENCE MATRIX ── */}
        {activeTab === 'compliance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* System Assessment Bar */}
            <div className="card" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Automated Verification Assessment
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-slate-900)' }}>
                    {verifiedMatches} of {totalMatches} Requirements Verified
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <span className="badge badge-success">
                    <CheckCircle size={13} /> {verifiedMatches} Compliant
                  </span>
                  <span className="badge badge-warning">
                    <AlertTriangle size={13} /> {reviewRequired} Review Required
                  </span>
                  <span className="badge badge-error">
                    <XCircle size={13} /> {nonCompliant} Non-Compliant
                  </span>
                </div>
              </div>
            </div>

            {/* Detailed Requirement Cards */}
            {complianceItems.length === 0 ? (
              <EmptyState
                title="No compliance evaluation results"
                message="Run compliance verification from the Submitted Documents tab to evaluate rules."
                action={
                  <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('documents')}>
                    Go to Documents
                  </button>
                }
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {complianceItems.map((res: any) => {
                  const isConflict = res.status === 'CONFLICTING_EVIDENCE';
                  const isMissing = res.status === 'INSUFFICIENT_EVIDENCE';
                  const isFail = res.status === 'NON_COMPLIANT';

                  return (
                    <div key={res.id} className="card" style={{ overflow: 'hidden' }}>
                      <div
                        style={{
                          padding: '14px 20px',
                          borderBottom: '1px solid var(--border-color)',
                          backgroundColor: 'var(--color-slate-50)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: '12px',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
                            Requirement • {res.requirement?.category || 'General Criterion'}
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-slate-900)' }}>
                            {res.requirement?.description || res.requirement?.rules}
                          </div>
                        </div>
                        <StatusBadge status={res.status} />
                      </div>

                      {isConflict && (
                        <div className="alert-box alert-warning" style={{ margin: '14px 20px 0 20px' }}>
                          <ShieldAlert size={16} color="var(--color-warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <div>
                            <strong style={{ fontSize: '13px' }}>Conflicting Evidence Detected</strong>
                            <div style={{ fontSize: '12px', marginTop: '2px' }}>
                              Contradictory values observed across submitted documents. Officer review required.
                            </div>
                          </div>
                        </div>
                      )}

                      {isMissing && (
                        <div className="alert-box alert-warning" style={{ margin: '14px 20px 0 20px' }}>
                          <AlertTriangle size={16} color="var(--color-warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <div>
                            <strong style={{ fontSize: '13px' }}>Missing Document Evidence</strong>
                            <div style={{ fontSize: '12px', marginTop: '2px' }}>
                              No supporting document in the bidder dossier satisfied this clause.
                            </div>
                          </div>
                        </div>
                      )}

                      <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                        {/* Evidence Finding */}
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '8px' }}>
                            Extracted Finding / Evidence
                          </div>
                          {res.evidence ? (
                            <div style={{ background: 'var(--color-slate-50)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                  Doc Ref: {String(res.evidence.documentId || res.evidence.sourceDocumentId || res.evidence.id || 'N/A').substring(0, 8)}
                                </span>
                                <span className="badge badge--neutral font-mono" style={{ fontSize: '10px' }}>
                                  Page {res.evidence.page ?? res.evidence.pageNumber ?? '?'}
                                </span>
                              </div>
                              <div style={{ fontSize: '13px', color: 'var(--color-slate-800)' }}>
                                <strong>Value: </strong>
                                {res.evidence.value || res.evidence.sourceText || 'Detected in dossier'}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                Confidence:{' '}
                                {typeof res.evidence.confidence === 'number'
                                  ? (res.evidence.confidence <= 1
                                      ? (res.evidence.confidence * 100).toFixed(0)
                                      : res.evidence.confidence.toFixed(0))
                                  : '80'}
                                %
                              </div>
                            </div>
                          ) : (
                            <div style={{ padding: '12px', border: '1px dashed var(--border-color)', borderRadius: '6px', color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center' }}>
                              No specific document evidence mapped.
                            </div>
                          )}
                        </div>

                        {/* Rule Evaluation Condition */}
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '8px' }}>
                            Rule Specification &amp; Determination
                          </div>
                          <div style={{ background: 'var(--color-slate-50)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px' }}>
                            <RuleDisplay rules={res.rule || res.requirement?.rules} fallbackDescription={res.requirement?.description} />
                            <div style={{ paddingTop: '8px', marginTop: '8px', borderTop: '1px dashed var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>Result:</span>
                              {isFail ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-danger)', fontWeight: 600, fontSize: '12px' }}>
                                  <XCircle size={13} /> Not Satisfied
                                </span>
                              ) : res.status === 'COMPLIANT' ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-success)', fontWeight: 600, fontSize: '12px' }}>
                                  <CheckCircle size={13} /> Satisfied
                                </span>
                              ) : (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-warning)', fontWeight: 600, fontSize: '12px' }}>
                                  <AlertTriangle size={13} /> Requires Officer Determination
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Authorized Officer Decision Support Section */}
                <div className="card" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-slate-900)', margin: 0 }}>
                        Authorized Procurement Officer Determination
                      </h3>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', margin: 0 }}>
                        System assessments are advisory decision-support. Formal qualification requires officer authorization.
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Official Status:</span>
                      <StatusBadge status={bid.status || 'SUBMITTED'} />
                    </div>
                  </div>

                  {decisionFeedback && (
                    <div className="alert-box alert-info" style={{ marginBottom: '16px' }}>
                      <CheckCircle size={15} color="var(--color-info)" />
                      <span>{decisionFeedback}</span>
                    </div>
                  )}

                  {['APPROVED', 'REJECTED', 'UNDER_REVIEW'].includes(bid.status) && !isModifyingDecision ? (
                    <div
                      style={{
                        padding: '16px 20px',
                        borderRadius: '6px',
                        backgroundColor:
                          bid.status === 'APPROVED'
                            ? 'var(--color-success-bg)'
                            : bid.status === 'REJECTED'
                            ? 'var(--color-danger-bg)'
                            : 'var(--color-warning-bg)',
                        border: `1px solid ${
                          bid.status === 'APPROVED'
                            ? 'var(--color-success-border)'
                            : bid.status === 'REJECTED'
                            ? 'var(--color-danger-border)'
                            : 'var(--color-warning-border)'
                        }`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '16px',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px' }}>
                          {bid.status === 'APPROVED' && 'OFFICIAL DECISION: BID APPROVED & QUALIFIED'}
                          {bid.status === 'REJECTED' && 'OFFICIAL DECISION: BID DISQUALIFIED & REJECTED'}
                          {bid.status === 'UNDER_REVIEW' && 'OFFICIAL DECISION: CLARIFICATION REQUESTED'}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          Recorded in immutable audit trail for procurement compliance.
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setIsModifyingDecision(true)}
                      >
                        <RotateCcw size={13} /> Modify Determination
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-slate-700)', marginBottom: '6px' }}>
                          Officer Remarks / Audit Justification Note
                        </label>
                        <textarea
                          className="input"
                          value={decisionNote}
                          onChange={(e) => setDecisionNote(e.target.value)}
                          placeholder="Add officer justification or compliance notes for audit trail..."
                          rows={2}
                          style={{ width: '100%', resize: 'vertical' }}
                        />
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => {
                            decisionMutation.mutate({ decision: 'APPROVED', comment: decisionNote });
                            setIsModifyingDecision(false);
                          }}
                          disabled={decisionMutation.isPending}
                        >
                          {decisionMutation.isPending ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                          Approve Bid
                        </button>

                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            decisionMutation.mutate({ decision: 'CLARIFICATION_REQUESTED', comment: decisionNote });
                            setIsModifyingDecision(false);
                          }}
                          disabled={decisionMutation.isPending}
                        >
                          {decisionMutation.isPending ? <Loader2 className="animate-spin" size={14} /> : <HelpCircle size={14} />}
                          Request Clarification
                        </button>

                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => {
                            const confirmed = window.confirm(
                              'Are you sure you want to REJECT and disqualify this bid dossier? This will be permanently recorded.'
                            );
                            if (confirmed) {
                              decisionMutation.mutate({ decision: 'REJECTED', comment: decisionNote });
                              setIsModifyingDecision(false);
                            }
                          }}
                          disabled={decisionMutation.isPending}
                        >
                          {decisionMutation.isPending ? <Loader2 className="animate-spin" size={14} /> : <Ban size={14} />}
                          Disqualify Bid
                        </button>

                        {isModifyingDecision && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => setIsModifyingDecision(false)}
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

        {/* ── TAB 4: AUDIT TRAIL ── */}
        {activeTab === 'history' && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <Activity size={16} color="var(--color-navy-500)" />
                Immutable Bid Evaluation Audit Trail
              </span>
            </div>
            <div className="card-body">
              <ActivityTimeline activities={activities || []} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
