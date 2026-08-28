import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import Dashboard from './pages/Dashboard';
import FraudRiskDashboard from './pages/FraudRisk/FraudRiskDashboard';
import FraudRiskAnalysis from './pages/FraudRisk/FraudRiskAnalysis';
import SettingsPage from './pages/Settings/SettingsPage';

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="state-box" style={{ paddingTop: 'var(--space-16)' }}>
      <div className="state-box__title">{title}</div>
      <div className="state-box__desc">This module is under development by the compliance team.</div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Sidebar />
        <div className="app-main">
          <Topbar />
          <main className="app-content">
            <Routes>
              <Route path="/"              element={<Dashboard />} />
              <Route path="/tenders"       element={<PlaceholderPage title="Tenders" />} />
              <Route path="/bids"          element={<PlaceholderPage title="Bids" />} />
              <Route path="/compliance"    element={<PlaceholderPage title="Compliance Engine" />} />
              <Route path="/settings"      element={<SettingsPage />} />

              {/* Fraud & Risk module */}
              <Route path="/fraud-risk"                element={<FraudRiskDashboard />} />
              <Route path="/bids/:bidId/fraud-risk"    element={<FraudRiskAnalysis />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
