
import { Loader2 } from 'lucide-react';

interface Props {
  text?: string;
}

export function LoadingSpinner({ text = 'Loading...' }: Props) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-muted" style={{ minHeight: '200px' }}>
      <Loader2 className="animate-spin mb-2" size={32} />
      <span>{text}</span>
    </div>
  );
}
