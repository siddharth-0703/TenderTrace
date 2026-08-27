import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, ClipboardCheck, AlertTriangle, FileBarChart } from 'lucide-react';

export default function AppLayout() {
  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          TenderCompliance
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={20} /> Dashboard
          </NavLink>
          <NavLink to="/tenders" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <FileText size={20} /> Tenders
          </NavLink>
          <NavLink to="/bids" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Users size={20} /> Bidders & Bids
          </NavLink>
          <NavLink to="/compliance" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <ClipboardCheck size={20} /> Compliance
          </NavLink>
          <div style={{ padding: '24px 16px 8px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
            Future Modules
          </div>
          <div className="sidebar-link" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
            <AlertTriangle size={20} /> Fraud & Risk
          </div>
          <div className="sidebar-link" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
            <FileBarChart size={20} /> Reports
          </div>
        </nav>
        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '12px', color: '#94a3b8' }}>
          System Status: <span style={{ color: '#4ade80' }}>Online</span>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="topbar">
          <div style={{ fontWeight: 500 }}>Officer Portal</div>
          <div className="badge badge-neutral">Jane Doe (Reviewer)</div>
        </header>
        <div className="page-container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
