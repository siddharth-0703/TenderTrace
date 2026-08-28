import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Users,
  Activity,
  ShieldCheck,
  ShieldAlert,
  Settings,
  Shield
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const overviewItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={17} />, end: true },
  ];

  const procurementItems = [
    { name: 'Tenders', path: '/tenders', icon: <FileText size={17} /> },
    { name: 'Bids & Bidders', path: '/bids', icon: <Users size={17} /> },
  ];

  const verificationItems = [
    { name: 'Compliance Engine', path: '/tenders', icon: <ShieldCheck size={17} /> },
    { name: 'Fraud & Anomaly', path: '/fraud-risk', icon: <ShieldAlert size={17} /> },
    { name: 'Audit Trail', path: '/activity', icon: <Activity size={17} /> },
  ];

  const systemItems = [
    { name: 'Settings & Rules', path: '/settings', icon: <Settings size={17} /> },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Brand Header */}
      <NavLink to="/" className="sidebar-header" onClick={onClose}>
        <div className="sidebar-brand__icon">
          <Shield size={19} />
        </div>
        <div>
          <div className="sidebar-brand__name">TenderTrace</div>
          <div className="sidebar-brand__sub">Procurement Intelligence</div>
        </div>
      </NavLink>

      {/* Navigation Sections */}
      <nav className="sidebar-nav" aria-label="Main Navigation">
        <div className="sidebar-section-label">Overview</div>
        {overviewItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.end}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}

        <div className="sidebar-section-label">Procurement</div>
        {procurementItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}

        <div className="sidebar-section-label">Verification</div>
        {verificationItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}

        <div className="sidebar-section-label">System</div>
        {systemItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Officer Identity Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-avatar">PO</div>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Procurement Officer
          </div>
          <div style={{ fontSize: '10px', color: '#94a3b8' }}>
            GeM Evaluation Board
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
