interface RuleDisplayProps {
  rules: string | null | undefined;
  fallbackDescription?: string;
}

export function formatCurrencyValue(val: number | string): string {
  if (typeof val === 'number') {
    if (val >= 10000000) {
      return `₹ ${(val / 10000000).toLocaleString('en-IN', { maximumFractionDigits: 2 })} Crore`;
    }
    if (val >= 100000) {
      return `₹ ${(val / 100000).toLocaleString('en-IN', { maximumFractionDigits: 2 })} Lakh`;
    }
    return `₹ ${val.toLocaleString('en-IN')}`;
  }
  return String(val);
}

export function RuleDisplay({ rules, fallbackDescription }: RuleDisplayProps) {
  if (!rules && !fallbackDescription) {
    return <span style={{ color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic' }}>No rule condition defined</span>;
  }

  let parsed: any = null;
  if (rules) {
    try {
      parsed = typeof rules === 'string' ? JSON.parse(rules) : rules;
    } catch {
      // Not JSON, treat as plain text
      parsed = null;
    }
  }

  // If simple condition
  if (parsed && typeof parsed === 'object') {
    if (parsed.type === 'condition' || (parsed.field && parsed.operator)) {
      const field = parsed.field || 'General Requirement';
      const operator = parsed.operator || '==';
      const value = parsed.value;
      const currency = parsed.currency || parsed.unit;

      const formattedVal = (currency === 'INR' || typeof value === 'number')
        ? formatCurrencyValue(value)
        : String(value ?? 'Required');

      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
          <span className="badge badge-neutral" style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
            {field}
          </span>
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
            {operator}
          </span>
          <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
            {formattedVal}
          </span>
        </div>
      );
    }

    if (parsed.type === 'OR' && Array.isArray(parsed.conditions)) {
      return (
        <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Satisfy Any Condition:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {parsed.conditions.map((cond: any, i: number) => (
              <span key={i} className="badge badge-neutral">
                {cond.field || cond.type} {cond.operator || ''} {cond.value ?? ''}
              </span>
            ))}
          </div>
        </div>
      );
    }

    if (parsed.type === 'AND' && Array.isArray(parsed.conditions)) {
      return (
        <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Satisfy All Conditions:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {parsed.conditions.map((cond: any, i: number) => (
              <span key={i} className="badge badge-neutral">
                {cond.field || cond.type} {cond.operator || ''} {cond.value ?? ''}
              </span>
            ))}
          </div>
        </div>
      );
    }
  }

  // Fallback plain string display
  const textToShow = rules || fallbackDescription || '';
  return (
    <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
      {textToShow}
    </div>
  );
}
