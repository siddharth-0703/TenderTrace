import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export default function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="app-container">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            zIndex: 55,
          }}
          aria-hidden="true"
        />
      )}
      <div className="main-content">
        <Header onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />
        <main className="page-container animate-fadeIn">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
