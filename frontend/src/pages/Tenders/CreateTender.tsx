import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, ArrowRight, ArrowLeft } from 'lucide-react';

export default function CreateTender() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    title: '',
    referenceNo: '',
    department: '',
    description: ''
  });

  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('http://localhost:3000/api/tenders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          referenceNo: data.referenceNo,
          department: data.department,
          description: data.description
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create tender');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tenders'] });
      navigate(`/tenders/${data.id}`);
    },
    onError: (err: Error) => {
      setError(err.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.referenceNo || !formData.department) {
      setError('Please fill in all required fields.');
      return;
    }
    mutation.mutate(formData);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="flex items-center gap-4 mb-6">
        <button 
          className="btn btn-outline" 
          style={{ padding: '8px', border: 'none', background: 'none' }} 
          onClick={() => navigate('/tenders')}
        >
           <ArrowLeft size={20} color="var(--text-secondary)" />
        </button>
        <div>
          <h1 className="text-h1" style={{ marginBottom: 0 }}>Create Tender</h1>
          <p className="text-muted">Initialize a new procurement case file.</p>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {error && (
          <div className="alert-box alert-error" style={{ margin: '16px', borderRadius: '4px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Section 1: Tender Information */}
          <div style={{ padding: '32px', borderBottom: '1px solid var(--color-border)' }}>
            <h2 className="text-h3" style={{ marginBottom: '24px', fontSize: '16px', color: 'var(--color-primary)' }}>1. Tender Information</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                  Tender Title <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <input 
                  type="text" 
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '14px' }}
                  placeholder="e.g. Procurement of Network Infrastructure"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                    Reference Number <span style={{ color: 'var(--color-error)' }}>*</span>
                  </label>
                  <input 
                    type="text" 
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: '4px', fontFamily: 'monospace', fontSize: '14px' }}
                    placeholder="e.g. GEM/2026/IT/042"
                    value={formData.referenceNo}
                    onChange={(e) => setFormData({...formData, referenceNo: e.target.value})}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                    Issuing Department <span style={{ color: 'var(--color-error)' }}>*</span>
                  </label>
                  <input 
                    type="text" 
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '14px' }}
                    placeholder="e.g. Department of Electronics"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                  Description (Optional)
                </label>
                <textarea 
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: '4px', minHeight: '80px', fontSize: '14px' }}
                  placeholder="Brief summary of the tender scope..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Procurement Timeline (Stubbed) */}
          <div style={{ padding: '32px', borderBottom: '1px solid var(--color-border)', opacity: 0.5 }}>
            <h2 className="text-h3" style={{ marginBottom: '8px', fontSize: '16px', color: 'var(--color-primary)' }}>2. Procurement Timeline</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>Timeline management will be available in a future update.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                    Publication Date
                  </label>
                  <input type="date" disabled style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '14px', backgroundColor: 'var(--color-background)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                    Closing Date
                  </label>
                  <input type="date" disabled style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '14px', backgroundColor: 'var(--color-background)' }} />
                </div>
            </div>
          </div>

          <div style={{ padding: '24px 32px', display: 'flex', justifyContent: 'flex-end', gap: '16px', backgroundColor: 'var(--color-background)' }}>
            <button 
              type="button" 
              className="btn btn-outline" 
              style={{ backgroundColor: 'white' }}
              onClick={() => navigate('/tenders')}
              disabled={mutation.isPending}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? <Loader2 className="animate-spin" size={16} /> : null}
              {mutation.isPending ? 'Creating...' : 'Create Tender Workspace'}
              {!mutation.isPending && <ArrowRight size={16} />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
