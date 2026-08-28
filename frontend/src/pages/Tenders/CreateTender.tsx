import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, FilePlus, CheckCircle2 } from 'lucide-react';

export default function CreateTender() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: '',
    tenderNumber: '',
    organization: '',
    description: '',
  });

  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('http://localhost:3000/api/tenders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          tenderNumber: data.tenderNumber,
          organization: data.organization,
          description: data.description,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create tender package');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tenders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      navigate(`/tenders/${data.id}`);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.tenderNumber || !formData.organization) {
      setError('Please fill in all mandatory fields indicated with an asterisk (*).');
      return;
    }
    setError(null);
    mutation.mutate(formData);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* ── Breadcrumb & Navigation ── */}
      <div className="breadcrumb">
        <Link to="/tenders">Tenders</Link>
        <span className="sep">›</span>
        <span className="current">Create Tender Package</span>
      </div>

      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/tenders')}
            aria-label="Back to tenders list"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1>Initialize Procurement Package</h1>
            <div className="subtitle">
              Set up statutory identifiers and parameters to begin extracting requirement rules
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        {error && (
          <div className="alert-box alert-error" style={{ margin: '20px 24px 0 24px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="card-body">
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-slate-900)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FilePlus size={18} color="var(--color-navy-500)" />
              1. Statutory Procurement Details
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-slate-700)' }}>
                  Tender Title <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="input"
                  style={{ width: '100%' }}
                  placeholder="e.g. Procurement of Network Routing & Optical Switching Infrastructure"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-slate-700)' }}>
                    GeM Reference Number <span style={{ color: 'var(--color-danger)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="input font-mono"
                    style={{ width: '100%' }}
                    placeholder="e.g. GEM/2026/B/89420"
                    value={formData.tenderNumber}
                    onChange={(e) => setFormData({ ...formData, tenderNumber: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-slate-700)' }}>
                    Procuring Entity / Ministry <span style={{ color: 'var(--color-danger)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="input"
                    style={{ width: '100%' }}
                    placeholder="e.g. Ministry of Electronics & IT"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-slate-700)' }}>
                  Scope of Work &amp; Description
                </label>
                <textarea
                  className="input"
                  style={{ width: '100%', minHeight: '90px', resize: 'vertical' }}
                  placeholder="Summary of supply, delivery timelines, qualifying criteria, or special bid conditions..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '16px 24px',
              backgroundColor: 'var(--color-slate-50)',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/tenders')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Creating Package…
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  Initialize &amp; Proceed to Upload
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
