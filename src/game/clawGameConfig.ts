export const DOLL_COUNT = 10
export const SPIN_SPEED = 0.12
export const HIT_TOLERANCE_RAD = 0.065
export const ROD_STRIKE_DURATION_MS = 450
export const RESULT_DELAY_MS = 1200
export const STRIKE_ANGLE = 0

export const DOLL_EMOJIS = [
  '🧸',
  '🐰',
  '🐻',
  '🐱',
  '🐶',
  '🐼',
  '🦊',
  '🐨',
  '🐯',
  '🐷',
] as const

/**
 * 정면 뷰: 상단 레일 위 집게, 인형은 아래로 매달림
 * cos(angle): 1=정면(가깝·크게), -1=뒤(멀·작게) — 사라지지 않음
 */
export const ARC = {
  viewWidth: 100,
  viewHeight: 100,
  centerX: 50,
  ringY: 34,
  radiusX: 36,
  arcDepth: 6,
} as const

export type DollVisual = {
  angle: number
  xPercent: number
  yPercent: number
  scale: number
  opacity: number
  zIndex: number
}

const TAU = Math.PI * 2

export function normalizeAngle(angle: number) {
  return ((angle % TAU) + TAU) % TAU
}

export function getDollAngle(index: number, trackOffset: number) {
  const slotAngle = TAU / DOLL_COUNT
  return normalizeAngle(index * slotAngle + trackOffset * TAU)
}

export function angularDistance(a: number, b: number) {
  const diff = Math.abs(normalizeAngle(a) - normalizeAngle(b))
  return Math.min(diff, TAU - diff)
}

/** 레일 경로 위 걸림점 — angle=0 정면(아래 볼록), angle=π 뒤(위 볼록) */
export function getClipPoint(angle: number) {
  return {
    x: ARC.centerX + ARC.radiusX * Math.sin(angle),
    y: ARC.ringY + ARC.arcDepth * Math.cos(angle),
  }
}

export function isOnFrontArc(angle: number) {
  return Math.cos(angle) >= 0
}

function getDepthFactor(angle: number) {
  return (Math.cos(angle) + 1) / 2
}

/** 앞쪽 레일 호 (타격·정면) */
export function getFrontArcPath() {
  const { centerX, ringY, radiusX, arcDepth } = ARC
  const leftX = centerX - radiusX
  const rightX = centerX + radiusX

  return `M ${leftX} ${ringY} A ${radiusX} ${arcDepth} 0 0 1 ${rightX} ${ringY}`
}

/** 뒤쪽 레일 호 */
export function getBackArcPath() {
  const { centerX, ringY, radiusX, arcDepth } = ARC
  const leftX = centerX - radiusX
  const rightX = centerX + radiusX

  return `M ${rightX} ${ringY} A ${radiusX} ${arcDepth} 0 0 1 ${leftX} ${ringY}`
}

export function getDollVisual(index: number, trackOffset: number): DollVisual {
  const angle = getDollAngle(index, trackOffset)
  const depth = getDepthFactor(angle)
  const clip = getClipPoint(angle)

  return {
    angle,
    xPercent: clip.x,
    yPercent: clip.y,
    scale: 0.46 + 0.54 * depth,
    opacity: 0.42 + 0.58 * depth,
    zIndex: Math.round(depth * 100),
  }
}

export function getStrikeTarget(
  trackOffset: number,
  captured: readonly boolean[] = Array.from({ length: DOLL_COUNT }, () => false),
) {
  let bestIndex = 0
  let bestDistance = Infinity

  for (let index = 0; index < DOLL_COUNT; index += 1) {
    const angle = getDollAngle(index, trackOffset)
    if (!isOnFrontArc(angle)) continue

    const distance = angularDistance(angle, STRIKE_ANGLE)
    if (distance < bestDistance) {
      bestDistance = distance
      bestIndex = index
    }
  }

  const atStrikeSlot =
    bestDistance !== Infinity && bestDistance <= HIT_TOLERANCE_RAD
  const slotEmpty = captured[bestIndex] === true

  return {
    index: bestIndex,
    distance: bestDistance,
    isEmptySlot: atStrikeSlot && slotEmpty,
    isHit:
      atStrikeSlot &&
      !slotEmpty &&
      isOnFrontArc(getDollAngle(bestIndex, trackOffset)),
  }
}
