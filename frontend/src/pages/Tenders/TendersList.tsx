import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { tenderApi } from '../../services/api/tenderApi';
import type { Tender } from '../../types';
import { Plus, Search, Filter, Trash2, X } from 'lucide-react';
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
      `Are you sure you want to delete "${tender.title}" (${tender.tenderNumber || tender.id.substring(0, 8)})?\n\nThis action will be permanently recorded in the system audit history.`
    );
    if (confirmed) {
      deleteMutation.mutate(tender.id);
    }
  };

  // Extract distinct departments from current tenders
  const uniqueDepartments = useMemo(() => {
    if (!tenders) return [];
    const set = new Set<string>();
    tenders.forEach(t => {
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
        if (selectedStatus === 'PROCESSING' && !currentStatus.includes('PROCESSING') && !currentStatus.includes('EVALUAT')) return false;
      }

      if (selectedDepartment !== 'ALL') {
        if (tender.organization !== selectedDepartment) return false;
      }

      return true;
    });
  }, [tenders, searchQuery, selectedStatus, selectedDepartment]);

  if (isLoading) return <LoadingSpinner text="Loading tenders..." />;
  if (isError) return <ErrorState title="Failed to load tenders" onRetry={() => refetch()} />;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Responsive Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 className="text-h1" style={{ marginBottom: '4px' }}>Tender Management</h1>
          <p className="text-muted" style={{ margin: 0 }}>Manage government tenders, requirements, and compliance.</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => navigate('/tenders/new')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '14px', whiteSpace: 'nowrap' }}
        >
          <Plus size={16} /> Create Tender
        </button>
      </div>

      {/* Responsive Filter Bar */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', backgroundColor: 'var(--color-surface)' }}>
        <div style={{ position: 'relative', flex: '1 1 260px', minWidth: '220px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tenders, ref, or dept..." 
            style={{ padding: '8px 12px 8px 36px', borderRadius: '4px', border: '1px solid var(--color-border)', width: '100%', fontSize: '14px', boxSizing: 'border-box' }} 
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', flex: '0 1 auto' }}>
          <Filter size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <select 
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '13px', backgroundColor: 'var(--color-background)', minWidth: '130px' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="READY">Published / Ready</option>
            <option value="PROCESSING">Under Evaluation</option>
          </select>

          <select 
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '13px', backgroundColor: 'var(--color-background)', maxWidth: '220px', textOverflow: 'ellipsis' }}
          >
            <option value="ALL">All Departments</option>
            {uniqueDepartments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          {(searchQuery || selectedStatus !== 'ALL' || selectedDepartment !== 'ALL') && (
            <button 
              className="btn btn-outline"
              onClick={() => {
                setSearchQuery('');
                setSelectedStatus('ALL');
                setSelectedDepartment('ALL');
              }}
              style={{ padding: '6px 10px', fontSize: '12px' }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {filteredTenders.length === 0 ? (
        <EmptyState 
          title={tenders?.length === 0 ? "No active tenders" : "No matching tenders found"} 
          message={tenders?.length === 0 ? "Create a new tender to begin the procurement process." : "Try adjusting your search query or filters."} 
        />
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tender</th>
                <th>Reference</th>
                <th>Department</th>
                <th style={{ textAlign: 'center' }}>Bidders</th>
                <th>Closing</th>
                <th>Risk</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenders.map((tender: Tender) => (
                <tr key={tender.id}>
                  <td>
                    <div style={{ fontWeight: 500, color: 'var(--color-primary)' }}>{tender.title}</div>
                  </td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                    {tender.tenderNumber || tender.id.substring(0, 8)}
                  </td>
                  <td style={{ fontSize: '13px' }}>{tender.organization}</td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{tender._count?.bids || 0}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Not Available</td>
                  <td><span className="badge badge-neutral" style={{ fontSize: '10px' }}>N/A</span></td>
                  <td>
                    <StatusBadge status={tender.processingStatus || tender.status || 'DRAFT'} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                      <button 
                        className="btn btn-outline"
                        style={{ padding: '4px 12px', fontSize: '12px' }}
                        onClick={() => navigate(`/tenders/${tender.id}`)}
                      >
                        Review
                      </button>
                      <button 
                        className="btn btn-outline"
                        title="Delete Tender"
                        style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--color-error)', borderColor: 'rgba(197,34,31,0.2)' }}
                        onClick={(e) => handleDelete(e, tender)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 size={13} />
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
