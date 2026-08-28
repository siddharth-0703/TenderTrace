import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { tenderApi } from '../../services/api/tenderApi';
import type { Tender } from '../../types';
import { Plus, Search, Filter, Trash2, X, FileText } from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { StatusBadge } from '../../components/common/StatusBadge';

export default function TendersList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');

  const { data: tenders, isLoading, isError, refetch } = useQuery({
    queryKey: ['tenders'],
    queryFn: tenderApi.getTenders,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tenderApi.deleteTender(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['recentActivity'] });
      queryClient.invalidateQueries({ queryKey: ['globalActivity'] });
    },
  });

  const handleDelete = (e: React.MouseEvent, tender: Tender) => {
    e.stopPropagation();
    const confirmed = window.confirm(
      `Are you sure you want to delete tender "${tender.title}" (${tender.tenderNumber || tender.id.substring(0, 8)})?\n\nThis action will be permanently recorded in the system audit history.`
    );
    if (confirmed) {
      deleteMutation.mutate(tender.id);
    }
  };

  // Extract distinct departments from current tenders
  const uniqueDepartments = useMemo(() => {
    if (!tenders) return [];
    const set = new Set<string>();
    tenders.forEach((t) => {
      if (t.organization && t.organization.trim()) {
        set.add(t.organization.trim());
      }
    });
    return Array.from(set).sort();
  }, [tenders]);

  // Live filter tenders
  const filteredTenders = useMemo(() => {
    if (!tenders) return [];
    return tenders.filter((tender: Tender) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = tender.title?.toLowerCase().includes(q);
        const matchRef = (tender.tenderNumber || tender.id)?.toLowerCase().includes(q);
        const matchOrg = tender.organization?.toLowerCase().includes(q);
        if (!matchTitle && !matchRef && !matchOrg) return false;
      }

      if (selectedStatus !== 'ALL') {
        const currentStatus = (tender.processingStatus || tender.status || 'DRAFT').toUpperCase();
        if (selectedStatus === 'DRAFT' && currentStatus !== 'DRAFT') return false;
        if (selectedStatus === 'READY' && currentStatus !== 'READY' && currentStatus !== 'PUBLISHED') return false;
        if (selectedStatus === 'UNDER_EVALUATION' && currentStatus !== 'UNDER_EVALUATION' && currentStatus !== 'PROCESSING') return false;
        if (selectedStatus === 'EVALUATED' && currentStatus !== 'EVALUATED') return false;
        if (selectedStatus === 'AWARD_PENDING' && currentStatus !== 'AWARD_PENDING') return false;
      }

      if (selectedDepartment !== 'ALL') {
        if (tender.organization !== selectedDepartment) return false;
      }

      return true;
    });
  }, [tenders, searchQuery, selectedStatus, selectedDepartment]);

  if (isLoading) return <LoadingSpinner text="Loading procurement tender dossiers..." />;
  if (isError) return <ErrorState title="Failed to load tenders" onRetry={() => refetch()} />;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* ── Page Header ── */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Tender Dossier Management</h1>
            <div className="subtitle">
              Configure procurement packages, extract AI requirement rules, and oversee bid submissions
            </div>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/tenders/new')}
          >
            <Plus size={15} /> Create Tender Package
          </button>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', backgroundColor: 'var(--color-white)' }}>
        <div className="input-icon-wrapper" style={{ flex: '1 1 280px' }}>
          <Search size={15} className="input-icon" />
          <input
            type="text"
            className="input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by title, reference number, or ministry..."
            style={{ width: '100%' }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <Filter size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <select
            className="select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            aria-label="Filter by tender status"
          >
            <option value="ALL">All Lifecycle Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="READY">Published / Ready</option>
            <option value="UNDER_EVALUATION">Under Evaluation</option>
            <option value="EVALUATED">Evaluated / Concluded</option>
            <option value="AWARD_PENDING">Award Pending</option>
          </select>

          <select
            className="select"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            aria-label="Filter by department"
            style={{ maxWidth: '240px' }}
          >
            <option value="ALL">All Procuring Entities</option>
            {uniqueDepartments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Table / List View ── */}
      {filteredTenders.length === 0 ? (
        <EmptyState
          title="No tenders match your criteria"
          message={searchQuery ? "Try adjusting your search terms or clearing status filters." : "No procurement packages have been created yet. Click below to add your first tender."}
          action={
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/tenders/new')}>
              <Plus size={14} /> Create Tender
            </button>
          }
        />
      ) : (
        <div className="table-wrapper">
          <div className="table-toolbar">
            <span className="table-toolbar-title">
              <FileText size={15} color="var(--color-navy-500)" />
              Active Procurement Packages
              <span className="badge badge--neutral" style={{ marginLeft: '8px' }}>
                {filteredTenders.length}
              </span>
            </span>
          </div>

          <table>
            <thead>
              <tr>
                <th>Tender Title &amp; Entity</th>
                <th>Tender ID / Ref</th>
                <th style={{ textAlign: 'center' }}>Bidders</th>
                <th>Status</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenders.map((tender: Tender) => (
                <tr key={tender.id}>
                  <td>
                    <Link
                      to={`/tenders/${tender.id}`}
                      style={{ fontWeight: 600, color: 'var(--color-slate-900)', display: 'block' }}
                    >
                      {tender.title}
                    </Link>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {tender.organization || 'Government Department'}
                    </div>
                  </td>
                  <td>
                    <span className="font-mono" style={{ background: 'var(--color-slate-100)', padding: '2px 8px', borderRadius: '4px' }}>
                      {tender.tenderNumber || tender.id.substring(0, 8)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>
                    {tender._count?.bids ?? (tender.bids?.length || 0)}
                  </td>
                  <td>
                    <StatusBadge status={tender.processingStatus || tender.status || 'DRAFT'} />
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {new Date(tender.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <Link
                        to={`/tenders/${tender.id}`}
                        className="btn btn-secondary btn-sm"
                      >
                        Workspace
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, tender)}
                        disabled={deleteMutation.isPending}
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--color-danger)', padding: '5px 8px' }}
                        title="Delete tender"
                        aria-label={`Delete tender ${tender.title}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
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
