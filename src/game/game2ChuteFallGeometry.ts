import { GAME2_DOLLS, GAME2_FLOOR_CHUTE } from './game2Config'

export type Game2DollFallToChute = {
  fallToCenterX: number
  fallToChuteY: number
}

/** playfield px — chute 입구까지 emoji 낙하 (Game 1 chuteFallGeometry와 동일 패턴) */
export function computeGame2FallToChute(
  playfieldW: number,
  playfieldH: number,
  startXPercent: number,
  startYPercent: number,
  stageScale: number,
  emojiSizePx = GAME2_DOLLS.emojiSizePx,
): Game2DollFallToChute {
  if (playfieldW <= 0 || playfieldH <= 0) {
    return { fallToCenterX: 0, fallToChuteY: 80 }
  }

  const scale = stageScale > 0 ? stageScale : 1
  const { centerX, centerY, height } = GAME2_FLOOR_CHUTE
  const chuteMouthYPercent = centerY + height / 2

  const unitX = (startXPercent / 100) * playfieldW
  const unitY = (startYPercent / 100) * playfieldH
  const chuteCenterX = (centerX / 100) * playfieldW
  const chuteMouthY = (chuteMouthYPercent / 100) * playfieldH
  const emojiBottomOffset = emojiSizePx * scale * 0.52

  const fallVisualY = chuteMouthY - unitY - emojiBottomOffset
  const fallCenterVisualX = chuteCenterX - unitX

  return {
    fallToCenterX: fallCenterVisualX,
    fallToChuteY: Math.max(8, fallVisualY),
  }
}
