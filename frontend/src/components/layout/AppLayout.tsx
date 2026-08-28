import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export default function AppLayout() {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content" style={{ marginLeft: '260px' }}>
        <Header />
        <main className="page-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
