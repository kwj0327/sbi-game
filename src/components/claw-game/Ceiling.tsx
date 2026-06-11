/** 윗면(1) + 상단 여백(7) — interior 공유 꼭짓점 clip-path */
export function Ceiling() {
  return (
    <>
      <div className="machine-ceiling__gap" aria-hidden="true">
        <span className="machine-gap-bulge machine-gap-bulge--bl" />
        <span className="machine-gap-bulge machine-gap-bulge--br" />
      </div>
      <div className="machine-ceiling" aria-hidden="true">
        <span className="machine-ceiling__surface" />
      </div>
    </>
  )
}
