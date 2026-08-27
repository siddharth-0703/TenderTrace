import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, Activity } from 'lucide-react';

export function Sidebar() {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Tenders', path: '/tenders', icon: <FileText size={20} /> },
    { name: 'Bids', path: '/bids', icon: <Users size={20} /> },
    { name: 'Activity', path: '/activity', icon: <Activity size={20} /> },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Activity size={24} style={{ color: 'var(--color-primary)' }} />
        TenderTrace
      </div>
      
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            {item.icon} {item.name}
          </NavLink>
        ))}
      </nav>
      
      <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '12px', color: '#94a3b8' }}>
        Government Workspace
      </div>
    </aside>
  );
}
