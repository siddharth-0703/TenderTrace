import { ShieldAlert, FileText } from 'lucide-react';

export default function Dashboard() {
  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <div className="subtitle">TenderTrace — GeM Procurement Intelligence Platform</div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card__label">Platform</div>
          <div className="stat-card__value" style={{ fontSize: 'var(--text-xl)' }}>SIH 2026</div>
          <div className="stat-card__sub">Problem Statement ID 26100</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Organization</div>
          <div className="stat-card__value" style={{ fontSize: 'var(--text-xl)' }}>CPCL</div>
          <div className="stat-card__sub">Ministry of Petroleum & Natural Gas</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Engines Active</div>
          <div className="stat-card__value stat-card--success">2</div>
          <div className="stat-card__sub">Compliance · Fraud & Risk</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)' }}>
        {[
          { icon: FileText,    title: 'Compliance Engine',  desc: 'Deterministic requirement verification against bid documents.',  link: '/compliance',  label: 'View Compliance' },
          { icon: ShieldAlert, title: 'Fraud & Risk Engine', desc: 'Probabilistic anomaly detection across bids and documents.',   link: '/fraud-risk',  label: 'View Fraud & Risk' },
        ].map(item => (
          <a key={item.link} href={item.link} className="card" style={{ textDecoration: 'none', display: 'block' }}>
            <div className="card-body" style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
              <div style={{ width: 40, height: 40, background: 'var(--color-navy-50)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <item.icon size={20} style={{ color: 'var(--color-navy-500)' }} />
              </div>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 'var(--space-1)' }}>{item.title}</div>
                <div className="text-sm text-muted">{item.desc}</div>
                <div style={{ marginTop: 'var(--space-3)' }}>
                  <span className="btn btn--secondary btn--sm">{item.label}</span>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
