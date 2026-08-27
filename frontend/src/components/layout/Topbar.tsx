import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

const TITLES: Record<string, string> = {
  '/':            'Dashboard',
  '/tenders':     'Tenders',
  '/bids':        'Bids',
  '/compliance':  'Compliance',
  '/fraud-risk':  'Fraud & Risk',
  '/settings':    'Settings',
};

function getTitle(pathname: string): string {
  if (pathname.includes('/fraud-risk')) return 'Fraud & Risk';
  if (pathname.includes('/bids/'))      return 'Bid Analysis';
  return TITLES[pathname] ?? 'TenderTrace';
}

interface TopbarProps {
  actions?: ReactNode;
}

export default function Topbar({ actions }: TopbarProps) {
  const { pathname } = useLocation();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="topbar-title">{getTitle(pathname)}</span>
      </div>
      <div className="topbar-right">
        {actions}
        <div className="topbar-user">
          <div className="topbar-avatar">PO</div>
          <span>Procurement Officer</span>
        </div>
      </div>
    </header>
  );
}
