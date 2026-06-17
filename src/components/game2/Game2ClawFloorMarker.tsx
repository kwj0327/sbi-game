import type { Game2ClawState } from '../../game/game2Config'
import {
  getClawFloorMarkerFromPlayPosition,
  getClawLandingMarkerTipY,
  getDefaultGame2ClawState,
  shouldShowClawFloorMarker,
  type Game2DollState,
} from '../../game/game2PlayArea'
import './game2-claw-floor-marker.css'

type Game2ClawFloorMarkerProps = {
  claw?: Game2ClawState
  dolls?: readonly Game2DollState[]
}

/** 집게 착지 예상 위치(참고용) — 더미 높이 포함, 잡을 대상 없으면 idle에서 숨김 */
export function Game2ClawFloorMarker({ claw, dolls = [] }: Game2ClawFloorMarkerProps) {
  const state = claw ?? getDefaultGame2ClawState()

  if (!shouldShowClawFloorMarker(state, dolls)) return null

  const tipY = getClawLandingMarkerTipY(state, dolls)
  const marker = getClawFloorMarkerFromPlayPosition(
    { x: state.xPercent, y: state.playY },
    tipY,
  )

  return (
    <div className="g2-claw-floor-marker" aria-hidden="true">
      <div
        className="g2-claw-floor-marker__ghost"
        style={{
          left: `${marker.xPercent}%`,
          top: `${marker.yPercent}%`,
          width: `${marker.widthPercent}%`,
          height: `${marker.heightPercent}%`,
        }}
      >
        <span className="g2-claw-floor-marker__corner g2-claw-floor-marker__corner--tl" />
        <span className="g2-claw-floor-marker__corner g2-claw-floor-marker__corner--tr" />
        <span className="g2-claw-floor-marker__corner g2-claw-floor-marker__corner--bl" />
        <span className="g2-claw-floor-marker__corner g2-claw-floor-marker__corner--br" />
      </div>
    </div>
  )
}
