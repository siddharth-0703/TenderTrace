import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenderApi } from '../../services/api/tenderApi';
import {
  PlayCircle,
  Loader2,
  Plus,
  Trash2,
  FileText,
  Users,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { StatusBadge } from '../../components/common/StatusBadge';
import { FileUpload } from '../../components/common/FileUpload';
import { ActivityTimeline } from '../../components/common/ActivityTimeline';
import { RuleDisplay } from '../../components/common/RuleDisplay';
import type { TenderRequirement } from '../../types';

export default function TenderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'requirements' | 'bids' | 'compliance' | 'history'>('documents');

  const { data: tender, isLoading, isError, refetch } = useQuery({
    queryKey: ['tender', id],
    queryFn: () => tenderApi.getTenderDetails(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      const docs = query.state.data?.documents;
      const isExtracting = docs?.some(
        (d: any) =>
          d.processingStatus === 'EXTRACTING' ||
          d.processingStatus === 'PROCESSING' ||
          d.processingStatus === 'UPLOADED'
      );
      return isExtracting ? 1500 : false;
    },
  });

  const { data: activities } = useQuery({
    queryKey: ['tender', id, 'activity'],
    queryFn: async () => {
      const res = await fetch(`http://localhost:3000/api/tenders/${id}/activity`);
      if (!res.ok) return [];
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
      queryClient.invalidateQueries({ queryKey: ['tenders'] });
      setActiveTab('requirements');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => tenderApi.deleteTender(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['recentActivity'] });
      queryClient.invalidateQueries({ queryKey: ['globalActivity'] });
      navigate('/tenders');
    },
  });

  const handleDeleteTender = () => {
    if (!tender) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete this tender: "${tender.title}"?\n\nThis will remove the tender from active workspace and permanently log the deletion event in the audit trail.`
    );
    if (confirmed) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) return <LoadingSpinner text="Loading tender workspace and extracted rules..." />;
  if (isError) return <ErrorState title="Failed to load tender workspace" onRetry={() => refetch()} />;
  if (!tender) return <ErrorState title="Tender not found" message="The requested tender does not exist." />;

  const handleUpload = async (files: File[]) => {
    await uploadMutation.mutateAsync(files);
  };

  const handleAddBidder = async () => {
    try {
      const bidderRes = await fetch('http://localhost:3000/api/bidders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Bidder Partner ${Math.floor(Math.random() * 900 + 100)}`,
          email: `bidder-${Date.now()}@gem-bid.in`,
        }),
      });
      const bidder = await bidderRes.json();

      await fetch('http://localhost:3000/api/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenderId: id, bidderId: bidder.id }),
      });

      queryClient.invalidateQueries({ queryKey: ['tender', id] });
    } catch (err) {
      console.error('Failed to add mock bidder', err);
    }
  };

  const tabs = [
    { id: 'documents', label: 'Tender Documents', count: tender.documents?.length || 0 },
    { id: 'requirements', label: 'Extracted Rules', count: tender.requirements?.length || 0 },
    { id: 'bids', label: 'Bidders & Dossiers', count: tender.bids?.length || 0 },
    { id: 'compliance', label: 'Comparative Compliance' },
    { id: 'history', label: 'Audit Trail' },
    { id: 'overview', label: 'Metadata' },
  ];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* ── Breadcrumb ── */}
      <div className="breadcrumb">
        <Link to="/tenders">Tenders</Link>
        <span className="sep">›</span>
        <span className="current">{tender.tenderNumber || tender.id.substring(0, 8)}</span>
      </div>

      {/* ── Header Card ── */}
      <div className="card" style={{ marginBottom: '24px', padding: '24px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge--neutral font-mono">
                {tender.tenderNumber || tender.id}
              </span>
              <StatusBadge status={tender.processingStatus || tender.status || 'DRAFT'} />
            </div>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--color-slate-900)', marginBottom: '8px' }}>
              {tender.title}
            </h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <span><strong>Entity:</strong> {tender.organization}</span>
              <span>•</span>
              <span><strong>Created:</strong> {new Date(tender.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              {(tender as any).closingDate && (
                <>
                  <span>•</span>
                  <span><strong>Closing:</strong> {new Date((tender as any).closingDate).toLocaleDateString('en-IN')}</span>
                </>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handleDeleteTender}
              disabled={deleteMutation.isPending}
              className="btn btn-danger btn-sm"
              title="Delete tender package"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      </div>

      {/* ── Tab Navigation ── */}
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

      {/* ── Tab 1: Documents ── */}
      {activeTab === 'documents' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <FileText size={16} color="var(--color-navy-500)" />
                Upload Official Tender Dossier PDF
              </span>
            </div>
            <div className="card-body">
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Upload tender notice, technical specifications, eligibility criteria, and corrigenda files for automated OCR and rule extraction.
              </p>
              <FileUpload onUpload={handleUpload} multiple={true} accept=".pdf" />
            </div>
          </div>

          <div className="table-wrapper">
            <div className="table-toolbar">
              <span className="table-toolbar-title">
                Uploaded Package Documents
                <span className="badge badge--neutral" style={{ marginLeft: '8px' }}>
                  {tender.documents?.length || 0}
                </span>
              </span>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => processMutation.mutate()}
                disabled={processMutation.isPending || !tender.documents || tender.documents.length === 0}
              >
                {processMutation.isPending ? (
                  <>
                    <Loader2 className="animate-spin" size={14} />
                    Extracting Requirements…
                  </>
                ) : (
                  <>
                    <PlayCircle size={14} />
                    Run AI Rule Extraction
                  </>
                )}
              </button>
            </div>

            {(!tender.documents || tender.documents.length === 0) ? (
              <div style={{ padding: '32px' }}>
                <EmptyState
                  title="No documents uploaded"
                  message="Upload the official tender RFP/NIT PDF above to begin AI processing."
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
                  {tender.documents.map((doc: any) => (
                    <tr key={doc.id}>
                      <td style={{ fontWeight: 600, color: 'var(--color-slate-900)' }}>
                        {doc.filename}
                      </td>
                      <td className="font-mono" style={{ color: 'var(--text-muted)' }}>
                        {doc.pageCount || '—'}
                      </td>
                      <td>
                        {doc.documentClass ? (
                          <span className="badge badge--info">{doc.documentClass}</span>
                        ) : (
                          <span style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                            General Notice
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

      {/* ── Tab 2: Requirements ── */}
      {activeTab === 'requirements' && (
        <div className="table-wrapper">
          <div className="table-toolbar">
            <div>
              <span className="table-toolbar-title">
                <ShieldCheck size={16} color="var(--color-success)" />
                Extracted Eligibility &amp; Compliance Rules
                <span className="badge badge--neutral" style={{ marginLeft: '8px' }}>
                  {tender.requirements?.length || 0}
                </span>
              </span>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Structured rules parsed by the NLP Compliance Engine from tender documents
              </div>
            </div>
          </div>

          {(!tender.requirements || tender.requirements.length === 0) ? (
            <div style={{ padding: '32px' }}>
              <EmptyState
                title="No requirement rules extracted yet"
                message="Run AI Rule Extraction from the Tender Documents tab to automatically parse turnover, past experience, and statutory requirements."
                action={
                  <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('documents')}>
                    Go to Documents
                  </button>
                }
              />
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Category / Type</th>
                  <th>Extracted Rule Condition</th>
                  <th>Lifecycle Status</th>
                  <th>Review Determination</th>
                </tr>
              </thead>
              <tbody>
                {tender.requirements.map((req: TenderRequirement) => (
                  <tr key={req.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-slate-900)' }}>
                        {req.type}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>
                        {req.category}
                      </div>
                    </td>
                    <td>
                      <div style={{ maxWidth: '480px' }}>
                        <RuleDisplay rules={req.rules} fallbackDescription={req.description} />
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
          )}
        </div>
      )}

      {/* ── Tab 3: Bidders ── */}
      {activeTab === 'bids' && (
        <div className="table-wrapper">
          <div className="table-toolbar">
            <div>
              <span className="table-toolbar-title">
                <Users size={16} color="var(--color-navy-500)" />
                Registered Bidders &amp; Submissions
                <span className="badge badge--neutral" style={{ marginLeft: '8px' }}>
                  {tender.bids?.length || 0}
                </span>
              </span>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Bidders participating in this tender package
              </div>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleAddBidder}
            >
              <Plus size={14} /> Register Bidder
            </button>
          </div>

          {(!tender.bids || tender.bids.length === 0) ? (
            <div style={{ padding: '32px' }}>
              <EmptyState
                title="No bidders registered"
                message="Register a bidder to upload their proposal dossier and run compliance verification."
                action={
                  <button className="btn btn-primary btn-sm" onClick={handleAddBidder}>
                    <Plus size={14} /> Add First Bidder
                  </button>
                }
              />
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Bidder Legal Entity</th>
                  <th>Bid Dossier Ref</th>
                  <th>Submission Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Evaluation</th>
                </tr>
              </thead>
              <tbody>
                {tender.bids.map((bid: any) => (
                  <tr key={bid.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-slate-900)' }}>
                        {bid.bidder?.legalName || bid.bidder?.name || 'Bidder ' + bid.id.substring(0, 8)}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {bid.bidder?.contactInformation || 'Statutory records on file'}
                      </div>
                    </td>
                    <td>
                      <span className="font-mono" style={{ background: 'var(--color-slate-100)', padding: '2px 6px', borderRadius: '4px' }}>
                        {bid.id.substring(0, 8)}
                      </span>
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {bid.submittedAt || bid.submissionDate
                        ? new Date(bid.submittedAt || bid.submissionDate).toLocaleDateString('en-IN')
                        : 'Recorded'}
                    </td>
                    <td>
                      <StatusBadge status={bid.status || 'SUBMITTED'} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        to={`/bids/${bid.id}`}
                        className="btn btn-secondary btn-sm"
                      >
                        Evaluate Bid
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Tab 4: Compliance Matrix ── */}
      {activeTab === 'compliance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-slate-900)', marginBottom: '4px' }}>
                  Comparative Compliance Matrix
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                  Multi-bidder qualification summary against {tender.requirements?.length || 0} extracted rules
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span className="badge badge--neutral">
                  <strong>{tender.bids?.length || 0}</strong> Bidders
                </span>
                <span className="badge badge--info">
                  <strong>{tender.requirements?.length || 0}</strong> Requirements
                </span>
              </div>
            </div>
          </div>

          {(!tender.bids || tender.bids.length === 0) ? (
            <EmptyState
              title="No bidders to compare"
              message="Register bidders to view comparative qualification matrix."
              action={
                <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('bids')}>
                  Go to Bidders Tab
                </button>
              }
            />
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Bidder Legal Name</th>
                    <th>Bid Reference</th>
                    <th>Documents</th>
                    <th>Compliance Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tender.bids.map((bid: any) => (
                    <tr key={bid.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--color-slate-900)' }}>
                          {bid.bidder?.legalName || bid.bidder?.name || 'Bidder ' + bid.id.substring(0, 8)}
                        </div>
                      </td>
                      <td>
                        <span className="font-mono" style={{ background: 'var(--color-slate-100)', padding: '2px 6px', borderRadius: '4px' }}>
                          {bid.id.substring(0, 8)}
                        </span>
                      </td>
                      <td style={{ fontSize: '13px' }}>
                        {bid.documents?.length || 0} dossier file(s)
                      </td>
                      <td>
                        <StatusBadge status={bid.status || 'SUBMITTED'} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link
                          to={`/bids/${bid.id}`}
                          className="btn btn-primary btn-sm"
                        >
                          <PlayCircle size={13} />
                          <span>Open Evaluation</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 5: Audit Trail ── */}
      {activeTab === 'history' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <Activity size={16} color="var(--color-navy-500)" />
              Immutable Tender Audit Trail
            </span>
          </div>
          <div className="card-body">
            <ActivityTimeline activities={activities || []} />
          </div>
        </div>
      )}

      {/* ── Tab 6: Overview / Metadata ── */}
      {activeTab === 'overview' && (
        <div className="stat-grid">
          <div className="stat-card">
            <span className="stat-card__label">Total Dossier Documents</span>
            <div className="stat-card__value">{tender.documents?.length || 0}</div>
          </div>
          <div className="stat-card">
            <span className="stat-card__label">Extracted Rules</span>
            <div className="stat-card__value">{tender.requirements?.length || 0}</div>
          </div>
          <div className="stat-card">
            <span className="stat-card__label">Participating Bidders</span>
            <div className="stat-card__value">{tender.bids?.length || 0}</div>
          </div>
          <div className="stat-card">
            <span className="stat-card__label">Lifecycle State</span>
            <div className="stat-card__value" style={{ fontSize: '1.25rem', textTransform: 'capitalize' }}>
              {tender.status?.toLowerCase() || 'Draft'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
