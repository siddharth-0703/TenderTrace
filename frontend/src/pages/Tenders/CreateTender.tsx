import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save, X } from 'lucide-react';

export default function CreateTender() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    tenderNumber: '',
    organization: '',
    description: ''
  });

  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('http://localhost:3000/api/tenders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
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
    if (!formData.title || !formData.tenderNumber || !formData.organization) {
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
          style={{ padding: '8px' }} 
          onClick={() => navigate('/tenders')}
        >
           <X size={20} />
        </button>
        <div>
          <h1 className="text-h1" style={{ marginBottom: 0 }}>Create New Tender</h1>
          <p className="text-muted">Initialize a new tender workspace for compliance tracking.</p>
        </div>
      </div>

      <div className="card">
        {error && (
          <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: 'var(--color-error)', color: 'white', borderRadius: '4px', opacity: 0.9 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
              Tender Title <span style={{ color: 'var(--color-error)' }}>*</span>
            </label>
            <input 
              type="text" 
              style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
              placeholder="e.g. Construction of National Highway"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                Reference Number <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <input 
                type="text" 
                style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '4px', fontFamily: 'monospace' }}
                placeholder="e.g. TND-2026-001"
                value={formData.tenderNumber}
                onChange={(e) => setFormData({...formData, tenderNumber: e.target.value})}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                Organization / Department <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <input 
                type="text" 
                style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                placeholder="e.g. Ministry of Roads"
                value={formData.organization}
                onChange={(e) => setFormData({...formData, organization: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
              Description (Optional)
            </label>
            <textarea 
              style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '4px', minHeight: '100px' }}
              placeholder="Brief summary of the tender requirements..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div style={{ paddingTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--color-border)' }}>
            <button 
              type="button" 
              className="btn btn-outline" 
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
              {mutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {mutation.isPending ? 'Creating...' : 'Create Tender'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
