import { STAGE_DESIGN_H, STAGE_DESIGN_W } from '../components/claw-game/constants'

export type StageContentRect = {
  x: number
  y: number
  width: number
  height: number
  scale: number
}

/** object-fit: contain 영역 — stage 박스 안 PNG 좌표계 */
export function getContainedContentRect(
  boxW: number,
  boxH: number,
  aspectW = 576,
  aspectH = 1024,
): StageContentRect {
  if (boxW <= 0 || boxH <= 0) {
    return { x: 0, y: 0, width: boxW, height: boxH, scale: 1 }
  }

  const boxAspect = boxW / boxH
  const contentAspect = aspectW / aspectH
  let width: number
  let height: number

  if (boxAspect > contentAspect) {
    height = boxH
    width = boxH * contentAspect
  } else {
    width = boxW
    height = boxW / contentAspect
  }

  return {
    x: (boxW - width) / 2,
    y: (boxH - height) / 2,
    width,
    height,
    scale: width / STAGE_DESIGN_W,
  }
}

function toPercent(value: number, base: number) {
  return base > 0 ? (value / base) * 100 : 0
}

/** playfield·mechanism을 PNG contain 영역에 맞춤 */
export function applyStageContentVars(
  element: HTMLElement,
  boxW: number,
  boxH: number,
  aspectW = 576,
  aspectH = 1024,
): StageContentRect {
  const rect = getContainedContentRect(boxW, boxH, aspectW, aspectH)

  element.style.setProperty('--stage-content-x', `${toPercent(rect.x, boxW)}%`)
  element.style.setProperty('--stage-content-y', `${toPercent(rect.y, boxH)}%`)
  element.style.setProperty('--stage-content-w', `${toPercent(rect.width, boxW)}%`)
  element.style.setProperty('--stage-content-h', `${toPercent(rect.height, boxH)}%`)

  return rect
}

export { STAGE_DESIGN_H, STAGE_DESIGN_W }
