import type { Game2ClawState } from '../../game/game2Config'
import {
  getClawFloorMarkerFromPlayPosition,
  getDefaultGame2ClawState,
} from '../../game/game2PlayArea'
import './game2-claw-floor-marker.css'

type Game2ClawFloorMarkerProps = {
  claw?: Pick<Game2ClawState, 'xPercent' | 'playY'>
}

/** 집게 바닥 착지 위치 — 테트리스 고스트처럼 표시 */
export function Game2ClawFloorMarker({ claw }: Game2ClawFloorMarkerProps) {
  const defaults = getDefaultGame2ClawState()
  const xPercent = claw?.xPercent ?? defaults.xPercent
  const playY = claw?.playY ?? defaults.playY
  const marker = getClawFloorMarkerFromPlayPosition({ x: xPercent, y: playY })

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
