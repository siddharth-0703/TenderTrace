import { useLocation } from 'react-router-dom';
import { Search, Bell, ChevronRight } from 'lucide-react';

export function Header() {
  const location = useLocation();
  
  const getBreadcrumbs = (): string[] => {
    const path = location.pathname;
    if (path === '/') return ['Overview'];
    if (path === '/tenders/new') return ['Tenders', 'New Tender'];
    if (path.startsWith('/tenders/')) return ['Tenders', 'Tender Details'];
    if (path === '/tenders') return ['Tenders'];
    if (path.startsWith('/bids/')) return ['Bids', 'Bid Evaluation'];
    if (path === '/bids') return ['Bids'];
    if (path === '/activity') return ['Audit Log'];
    return ['Workspace'];
  };

  const crumbs = getBreadcrumbs();

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
        {crumbs.map((crumb, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {i > 0 && <ChevronRight size={14} color="var(--text-muted)" />}
            <span style={{ 
              fontWeight: i === crumbs.length - 1 ? 600 : 400,
              color: i === crumbs.length - 1 ? 'var(--text-primary)' : 'var(--text-muted)',
            }}>
              {crumb}
            </span>
          </span>
        ))}
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search tenders, bids..." 
            style={{ 
              padding: '7px 12px 7px 32px', 
              borderRadius: 'var(--radius-sm)', 
              border: '1px solid var(--color-border)', 
              backgroundColor: 'var(--color-background)',
              fontSize: '13px',
              width: '240px',
              outline: 'none',
              transition: 'border-color 200ms ease',
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-accent)'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
          />
        </div>
        
        {/* Notifications */}
        <button style={{ 
          background: 'none', border: 'none', cursor: 'pointer', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '36px', height: '36px', borderRadius: '50%',
          transition: 'background-color 120ms ease',
          color: 'var(--text-secondary)',
        }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-background)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <Bell size={18} />
        </button>
      </div>
    </header>
  );
}
