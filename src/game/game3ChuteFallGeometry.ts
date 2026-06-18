import { GAME3_CHUTE, GAME3_DOLLS } from './game3Config'

export type Game3DollFallToChute = {
  fallToChuteY: number
}

/**
 * playfield px — 2D 수직 낙하.
 * 인형이 집게에 매달린 중심에서 가로 이동 없이 곧장 바닥(배출구)까지 떨어진다.
 * startCenterYPercent: 매달린 인형의 화면 중심 y (world %)
 */
export function computeGame3FallToChute(
  playfieldW: number,
  playfieldH: number,
  startCenterYPercent: number,
  stageScale: number,
  emojiSizePx = GAME3_DOLLS.emojiSizePx,
): Game3DollFallToChute {
  if (playfieldW <= 0 || playfieldH <= 0) {
    return { fallToChuteY: 80 }
  }

  const scale = stageScale > 0 ? stageScale : 1
  // 인형 중심이 바닥 근처에 닿도록 — 스프라이트 절반 높이만큼 위에서 멈춤
  const emojiHalfHeight = emojiSizePx * scale * 0.42
  const startCenterPx = (startCenterYPercent / 100) * playfieldH
  const chuteFloorPx = (GAME3_CHUTE.bottomY / 100) * playfieldH

  return {
    fallToChuteY: Math.max(8, chuteFloorPx - emojiHalfHeight - startCenterPx),
  }
}
