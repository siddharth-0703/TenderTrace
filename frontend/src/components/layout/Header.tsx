export function Header() {
  return (
    <header className="topbar">
      <div style={{ fontWeight: 500 }}>Officer Portal</div>
      <div className="badge badge-neutral" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
         <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>O</div>
         Officer
      </div>
    </header>
  );
}
