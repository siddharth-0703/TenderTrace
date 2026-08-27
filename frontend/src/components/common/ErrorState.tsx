
import { AlertCircle } from 'lucide-react';

interface Props {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ 
  title = 'Something went wrong', 
  message = 'An unexpected error occurred. Please try again later.',
  onRetry 
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center" style={{ minHeight: '200px' }}>
      <AlertCircle className="mb-4" size={48} color="var(--color-error)" />
      <h3 className="text-h3 mb-2">{title}</h3>
      <p className="text-muted mb-4 max-w-md">{message}</p>
      {onRetry && (
        <button className="btn btn-primary" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
}
