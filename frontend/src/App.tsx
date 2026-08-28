import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import Dashboard from './pages/Dashboard/Dashboard';
import TendersList from './pages/Tenders/TendersList';
import TenderDetails from './pages/Tenders/TenderDetails';
import CreateTender from './pages/Tenders/CreateTender';
import BidsList from './pages/Bids/BidsList';
import BidDetails from './pages/Bids/BidDetails';
import ActivityPage from './pages/History/ActivityPage';
import FraudRiskDashboard from './pages/FraudRisk/FraudRiskDashboard';
import FraudRiskAnalysis from './pages/FraudRisk/FraudRiskAnalysis';
import SettingsPage from './pages/Settings/SettingsPage';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tenders" element={<TendersList />} />
            <Route path="/tenders/new" element={<CreateTender />} />
            <Route path="/tenders/:id" element={<TenderDetails />} />
            <Route path="/bids" element={<BidsList />} />
            <Route path="/bids/:id" element={<BidDetails />} />
            <Route path="/activity" element={<ActivityPage />} />
            
            {/* Fraud & Risk Intelligence module */}
            <Route path="/fraud-risk" element={<FraudRiskDashboard />} />
            <Route path="/bids/:bidId/fraud-risk" element={<FraudRiskAnalysis />} />
            
            {/* Settings */}
            <Route path="/settings" element={<SettingsPage />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
