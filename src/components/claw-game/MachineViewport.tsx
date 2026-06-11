import type { RefObject } from 'react'
import { ROD_REST_PX } from './constants'
import { MachineMechanismLayer } from './MachineMechanismLayer'
import { MachineVisualLayer } from './MachineVisualLayer'
import type { GamePhase, OrbitSize, VisibleDoll } from './types'
import './claw-game-machine.css'

type MachineViewportProps = {
  orbitRef: RefObject<HTMLDivElement | null>
  phase: GamePhase
  rodProgress: number
  rodTravelPx: number
  visibleDolls: VisibleDoll[]
  strikeTargetIndex: number | null
  orbitSize: OrbitSize
  orbitScale: number
}

export function MachineViewport({
  orbitRef,
  phase,
  rodProgress,
  rodTravelPx,
  visibleDolls,
  strikeTargetIndex,
  orbitSize,
  orbitScale,
}: MachineViewportProps) {
  const rodHeightPx = ROD_REST_PX * orbitScale + rodProgress * rodTravelPx

  return (
    <div className="machine-viewport">
      <div className="game-stage machine-interior">
        <MachineVisualLayer />

        <div className="game-stage__mechanism machine-mechanism-layer">
          <MachineMechanismLayer
            orbitRef={orbitRef}
            phase={phase}
            rodHeightPx={rodHeightPx}
            visibleDolls={visibleDolls}
            strikeTargetIndex={strikeTargetIndex}
            orbitSize={orbitSize}
            orbitScale={orbitScale}
          />
        </div>
      </div>
    </div>
  )
}
