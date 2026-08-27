import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, Activity, Shield, Bell, HelpCircle, Settings } from 'lucide-react';

export function Sidebar() {
  const workspaceItems = [
    { name: 'Overview', path: '/', icon: <LayoutDashboard size={18} />, end: true },
    { name: 'Tenders', path: '/tenders', icon: <FileText size={18} /> },
    { name: 'Bids', path: '/bids', icon: <Users size={18} /> },
    { name: 'Compliance', path: '/tenders', icon: <Shield size={18} /> },
    { name: 'Audit Log', path: '/activity', icon: <Activity size={18} /> },
  ];

  const systemItems = [
    { name: 'Notifications', path: '#', icon: <Bell size={18} /> },
    { name: 'Help', path: '#', icon: <HelpCircle size={18} /> },
    { name: 'Settings', path: '#', icon: <Settings size={18} /> },
  ];

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '20px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px',
          background: 'linear-gradient(135deg, #1a73e8, #4285f4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Shield size={18} color="white" />
        </div>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.02em', color: '#f1f5f9' }}>TenderTrace</div>
          <div style={{ fontSize: '10px', fontWeight: 500, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Procurement Intelligence
          </div>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        <div style={{ padding: '12px 20px 6px 20px', fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Workspace
        </div>
        {workspaceItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.end}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={(e) => {
              if (item.path === '#') e.preventDefault();
            }}
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}

        <div style={{ padding: '20px 20px 6px 20px', fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          System
        </div>
        {systemItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className="sidebar-link"
            style={{ opacity: 0.6 }}
            onClick={(e) => {
              if (item.path === '#') e.preventDefault();
            }}
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
      
      {/* Footer */}
      <div style={{ 
        padding: '16px 20px', 
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '12px', fontWeight: 700, color: '#94a3b8',
          flexShrink: 0,
        }}>
          PO
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Procurement Officer
          </div>
          <div style={{ fontSize: '10px', color: '#64748b' }}>
            Gov. of India
          </div>
        </div>
      </div>
    </aside>
  );
}
