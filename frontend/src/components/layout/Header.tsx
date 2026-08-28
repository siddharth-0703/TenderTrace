import { useLocation, Link } from 'react-router-dom';
import { Search, Bell, ChevronRight, Menu } from 'lucide-react';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const location = useLocation();

  const getBreadcrumbs = (): { label: string; path?: string }[] => {
    const path = location.pathname;
    if (path === '/') return [{ label: 'Dashboard' }];
    if (path === '/tenders/new') return [{ label: 'Tenders', path: '/tenders' }, { label: 'New Tender' }];
    if (path.startsWith('/tenders/')) return [{ label: 'Tenders', path: '/tenders' }, { label: 'Tender Workspace' }];
    if (path === '/tenders') return [{ label: 'Tenders' }];
    if (path.startsWith('/bids/') && path.includes('/fraud-risk')) {
      return [{ label: 'Fraud & Risk', path: '/fraud-risk' }, { label: 'Forensic Analysis' }];
    }
    if (path.startsWith('/bids/')) return [{ label: 'Bids & Bidders', path: '/bids' }, { label: 'Bid Evaluation' }];
    if (path === '/bids') return [{ label: 'Bids & Bidders' }];
    if (path === '/fraud-risk') return [{ label: 'Fraud & Risk Intelligence' }];
    if (path === '/settings') return [{ label: 'Settings & Rules' }];
    if (path === '/activity') return [{ label: 'Audit Trail' }];
    return [{ label: 'TenderTrace' }];
  };

  const crumbs = getBreadcrumbs();

  return (
    <header className="topbar">
      <div className="topbar-left">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="btn btn-ghost btn-sm"
            style={{ padding: '6px', marginRight: '4px' }}
            aria-label="Toggle navigation menu"
          >
            <Menu size={18} />
          </button>
        )}

        <nav aria-label="Breadcrumb" className="breadcrumb" style={{ margin: 0 }}>
          {crumbs.map((crumb, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              {i > 0 && <span className="sep"><ChevronRight size={13} /></span>}
              {crumb.path && i < crumbs.length - 1 ? (
                <Link to={crumb.path}>{crumb.label}</Link>
              ) : (
                <span className="current">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      </div>

      <div className="topbar-right">
        {/* System Engine Health Indicator */}
        <div
          className="badge badge-success"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 8px',
            fontSize: '11px',
            fontWeight: 600,
            background: '#f0fdf4',
            borderColor: '#bbf7d0',
            color: '#15803d'
          }}
          title="Compliance & Fraud Detection Engines Active"
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16a34a', display: 'inline-block' }} />
          <span>Engines Active</span>
        </div>

        {/* Global Quick Search */}
        <div className="input-icon-wrapper" style={{ display: 'flex' }}>
          <Search size={14} className="input-icon" />
          <input
            type="text"
            className="input"
            placeholder="Search tenders, bids, GSTIN..."
            style={{ width: '220px', padding: '6px 12px 6px 30px', fontSize: '12px' }}
          />
        </div>

        {/* Notifications Icon */}
        <button
          className="btn btn-ghost"
          style={{ padding: '6px', borderRadius: '50%', position: 'relative' }}
          aria-label="Notifications"
          title="System Notifications"
        >
          <Bell size={17} color="var(--text-secondary)" />
          <span
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              width: '7px',
              height: '7px',
              backgroundColor: 'var(--color-navy-500)',
              borderRadius: '50%',
            }}
          />
        </button>
      </div>
    </header>
  );
}

export default Header;
