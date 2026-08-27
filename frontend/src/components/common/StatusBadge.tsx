
import { clsx } from 'clsx';
import { CheckCircle2, XCircle, AlertTriangle, Clock, HelpCircle, FileText } from 'lucide-react';

interface Props {
  status: string;
}

export function StatusBadge({ status }: Props) {
  let bgColor = 'bg-slate-100';
  let textColor = 'text-slate-700';
  let Icon = HelpCircle;

  switch (status.toUpperCase()) {
    // COMPLIANCE STATUSES
    case 'COMPLIANT':
    case 'SUCCESS':
    case 'APPROVED':
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
      Icon = CheckCircle2;
      break;
    case 'NON_COMPLIANT':
    case 'FAILED':
    case 'REJECTED':
      bgColor = 'bg-red-100';
      textColor = 'text-red-800';
      Icon = XCircle;
      break;
    case 'CONFLICTING':
    case 'CONFLICTING_EVIDENCE':
    case 'INSUFFICIENT_EVIDENCE':
    case 'PARTIAL':
      bgColor = 'bg-amber-100';
      textColor = 'text-amber-800';
      Icon = AlertTriangle;
      break;
    
    // PROCESSING STATUSES
    case 'UPLOADED':
    case 'PENDING':
    case 'DETECTED':
    case 'REVIEW_REQUIRED':
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-800';
      Icon = Clock;
      break;
    case 'EXTRACTING':
    case 'PROCESSING':
      bgColor = 'bg-purple-100';
      textColor = 'text-purple-800';
      Icon = Clock;
      break;
    case 'TEXT_AVAILABLE':
    case 'OCR_REQUIRED':
      bgColor = 'bg-slate-200';
      textColor = 'text-slate-800';
      Icon = FileText;
      break;
  }

  // Format the text nicely: NON_COMPLIANT -> Non Compliant
  const formattedText = status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());

  return (
    <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap', bgColor, textColor)}>
      <Icon size={14} />
      {formattedText}
    </span>
  );
}
