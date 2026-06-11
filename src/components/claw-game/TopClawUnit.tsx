import type { GamePhase } from './types'

type TopClawUnitProps = {
  phase: GamePhase
  rodHeightPx: number
}

export function TopClawUnit({ phase, rodHeightPx }: TopClawUnitProps) {
  return (
    <div
      className={`machine-claw${phase !== 'spinning' ? ' machine-claw--active' : ''}`}
      aria-hidden="true"
    >
      <div className="machine-claw__body">
        <span className="machine-claw__arrow">▼</span>
      </div>
      <div className="machine-claw__rod-track">
        <div
          className="machine-claw__rod"
          style={{
            height: `${rodHeightPx}px`,
            transform: 'translateX(-50%)',
          }}
        />
      </div>
    </div>
  )
}
