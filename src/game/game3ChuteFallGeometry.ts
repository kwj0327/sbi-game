import { GAME3_CHUTE, GAME3_DOLLS } from './game3Config'
import { getGame3ChuteCenterX } from './game3PlayArea'

export type Game3DollFallToChute = {
  fallToCenterX: number
  fallToChuteY: number
}

/** playfield px — 배출구 입구까지 인형 낙하 (Game2 chuteFallGeometry 패턴) */
export function computeGame3FallToChute(
  playfieldW: number,
  playfieldH: number,
  startXPercent: number,
  startVisualYPercent: number,
  stageScale: number,
  emojiSizePx = GAME3_DOLLS.emojiSizePx,
): Game3DollFallToChute {
  if (playfieldW <= 0 || playfieldH <= 0) {
    return { fallToCenterX: 0, fallToChuteY: 80 }
  }

  const scale = stageScale > 0 ? stageScale : 1
  const chuteCenterX = getGame3ChuteCenterX()
  const chuteMouthY = GAME3_CHUTE.bottomY - 1.5

  const unitX = (startXPercent / 100) * playfieldW
  const unitY = (startVisualYPercent / 100) * playfieldH
  const chuteCenterPx = (chuteCenterX / 100) * playfieldW
  const chuteMouthPx = (chuteMouthY / 100) * playfieldH
  const emojiBottomOffset = emojiSizePx * scale * 0.48

  return {
    fallToCenterX: chuteCenterPx - unitX,
    fallToChuteY: Math.max(8, chuteMouthPx - unitY - emojiBottomOffset),
  }
}
