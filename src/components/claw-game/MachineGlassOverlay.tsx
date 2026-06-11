/** 유리 반사 · 글로우 — static visual layer */
export function MachineGlassOverlay() {
  return (
    <div className="machine-glass-overlay" aria-hidden="true">
      <div className="machine-glass-overlay__sheen" />
      <div className="machine-glass-overlay__glare" />
    </div>
  )
}
