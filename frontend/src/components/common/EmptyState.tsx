
import { PackageOpen } from 'lucide-react';

interface Props {
  title?: string;
  message?: string;
  action?: React.ReactNode;
}

export function EmptyState({ 
  title = 'No data found', 
  message = 'There is currently no data to display here.',
  action 
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center" style={{ minHeight: '200px' }}>
      <div className="bg-slate-100 p-4 rounded-full mb-4">
        <PackageOpen size={48} className="text-slate-400" />
      </div>
      <h3 className="text-h3 mb-2">{title}</h3>
      <p className="text-muted mb-6 max-w-md">{message}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
