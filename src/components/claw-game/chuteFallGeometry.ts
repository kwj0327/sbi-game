import { ARC } from '../../game/clawGameConfig'

import {
  DOLL_EMOJI_LEAD_PX,
  DOLL_EMOJI_SIZE_PX,
} from './constants'

/** claw-game-machine.css `--ix-*` 와 동기화 */
const CEILING_STACK = 0.1
const FLOOR_STACK = 0.28
const STAGE_HEIGHT_RATIO = 1 - CEILING_STACK - FLOOR_STACK

/** 배출구 입구·출구 면이 맞닿는 경계 (--ix-y-gap6-top = 90%) */
const CHUTE_MOUTH_Y = 1 - 0.1

function interiorYToStagePx(interiorY: number, orbitH: number) {
  return ((interiorY - CEILING_STACK) / STAGE_HEIGHT_RATIO) * orbitH
}

/** machine-orbit-scaler transform-origin(50%, ringY) + scale(s) 반영 */
function visualPointFromLocal(
  localX: number,
  localY: number,
  orbitW: number,
  orbitH: number,
  scale: number,
) {
  const railY = ARC.ringY / 100
  return {
    x: (0.5 + (localX - 0.5) * scale) * orbitW,
    y: (railY + (localY - railY) * scale) * orbitH,
  }
}

export type DollFallToChute = {
  fallToCenterX: number
  fallToChuteY: number
}

/**
 * scaler 내부 애니메이션 px — chute 입구에 emoji 하단이 닿도록.
 * orbitScale=1 이면 기존 orbit 좌표와 동일.
 */
export function computeFallToChute(
  orbitW: number,
  orbitH: number,
  dollXPercent: number,
  dollYPercent: number,
  orbitScale = 1,
): DollFallToChute {
  if (orbitW <= 0 || orbitH <= 0) {
    return { fallToCenterX: 0, fallToChuteY: 80 }
  }

  const scale = orbitScale > 0 ? orbitScale : 1
  const localX = dollXPercent / 100
  const localY = dollYPercent / 100
  const unitTop = visualPointFromLocal(localX, localY, orbitW, orbitH, scale)
  const chuteMouthY = interiorYToStagePx(CHUTE_MOUTH_Y, orbitH)
  const chuteCenterX = orbitW * 0.5
  const emojiBottomOffset = (DOLL_EMOJI_LEAD_PX + DOLL_EMOJI_SIZE_PX) * scale

  const fallVisualY = chuteMouthY - unitTop.y - emojiBottomOffset
  const fallCenterVisualX = chuteCenterX - unitTop.x

  return {
    fallToCenterX: fallCenterVisualX / scale,
    fallToChuteY: Math.max(8, fallVisualY / scale),
  }
}
