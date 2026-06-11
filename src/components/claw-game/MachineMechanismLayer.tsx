import type { RefObject } from 'react'
import { FallingDollLayer } from './FallingDollLayer'
import { HangingDolls } from './HangingDolls'
import { RotatingRail } from './RotatingRail'
import { TopClawUnit } from './TopClawUnit'
import type { GamePhase, OrbitSize, VisibleDoll } from './types'

type MachineMechanismLayerProps = {
  orbitRef: RefObject<HTMLDivElement | null>
  phase: GamePhase
  rodHeightPx: number
  visibleDolls: VisibleDoll[]
  strikeTargetIndex: number | null
  orbitSize: OrbitSize
  orbitScale: number
}

/** claw · rod · rail · dolls — 기존 렌더/좌표 유지 */
export function MachineMechanismLayer({
  orbitRef,
  phase,
  rodHeightPx,
  visibleDolls,
  strikeTargetIndex,
  orbitSize,
  orbitScale,
}: MachineMechanismLayerProps) {
  return (
    <>
      <TopClawUnit phase={phase} rodHeightPx={rodHeightPx} />

      <div className="machine-viewport__stage" ref={orbitRef}>
        <div className="machine-orbit-scaler">
          <RotatingRail />
          <HangingDolls
            dolls={visibleDolls}
            strikeTargetIndex={strikeTargetIndex}
            phase={phase}
          />
        </div>
      </div>

      <FallingDollLayer dolls={visibleDolls} orbitSize={orbitSize} orbitScale={orbitScale} />
    </>
  )
}
