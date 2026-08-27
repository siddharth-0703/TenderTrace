import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard/Dashboard';
import TendersList from './pages/Tenders/TendersList';
import TenderDetails from './pages/Tenders/TenderDetails';
import CreateTender from './pages/Tenders/CreateTender';
import BidsList from './pages/Bids/BidsList';
import BidDetails from './pages/Bids/BidDetails';
import ActivityPage from './pages/History/ActivityPage';

export default function App() {
  return (
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
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
