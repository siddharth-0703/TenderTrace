import { NavLink } from 'react-router-dom';
import { ShieldAlert, LayoutDashboard, FileText, Users, Shield, Settings } from 'lucide-react';

const NAV = [
  {
    section: 'Overview',
    items: [
      { label: 'Dashboard',    to: '/',             icon: LayoutDashboard },
    ]
  },
  {
    section: 'Procurement',
    items: [
      { label: 'Tenders',  to: '/tenders', icon: FileText },
      { label: 'Bids',     to: '/bids',    icon: Users    },
    ]
  },
  {
    section: 'Intelligence',
    items: [
      { label: 'Compliance',   to: '/compliance', icon: Shield     },
      { label: 'Fraud & Risk', to: '/fraud-risk', icon: ShieldAlert },
    ]
  },
  {
    section: 'System',
    items: [
      { label: 'Settings', to: '/settings', icon: Settings },
    ]
  }
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <a href="/" className="sidebar-brand" style={{ textDecoration: 'none' }}>
        <div className="sidebar-brand__icon">
          <ShieldAlert size={18} color="white" />
        </div>
        <div>
          <div className="sidebar-brand__name">TenderTrace</div>
          <div className="sidebar-brand__sub">GeM Procurement Platform</div>
        </div>
      </a>

      <nav className="sidebar-nav">
        {NAV.map(section => (
          <div key={section.section} className="sidebar-nav-section">
            <div className="sidebar-nav-section-label">{section.section}</div>
            {section.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `sidebar-link${isActive ? ' active' : ''}`
                }
              >
                <item.icon size={16} className="sidebar-link__icon" />
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-footer__label">Problem Statement</div>
        <div className="sidebar-footer__value">SIH 2026 · ID 26100</div>
      </div>
    </aside>
  );
}
