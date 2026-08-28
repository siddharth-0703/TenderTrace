import { Info } from 'lucide-react';

export default function ReviewNotice() {
  return (
    <div className="alert alert--info" role="note" aria-label="Officer review required">
      <Info size={16} className="alert__icon" aria-hidden="true" />
      <div>
        <div className="alert__title">Officer Review Required</div>
        <span>
          Fraud &amp; Anomaly Risk is a decision-support assessment. The system identifies
          suspicious indicators but does not determine fraud or make the final procurement
          decision. All findings must be reviewed and verified by a qualified Procurement
          Officer before any action is taken.
        </span>
      </div>
    </div>
  );
}
