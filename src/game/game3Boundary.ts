import {
  DOLL_ALPHA_THRESHOLD,
  getDollAlphaMask,
  getDollSilhouetteTopV,
  sampleDollAlpha,
} from './dollAlphaMask'
import { GAME3_GRAB, GAME3_PHYSICS } from './game3Config'

export type Game3BoundaryRect = {
  left: number
  right: number
  top: number
  bottom: number
}

export function sampleSilhouetteAtWorldPoint(
  xPercent: number,
  yPercent: number,
  dollRect: Game3BoundaryRect,
  maskSrc: string,
  flipX: boolean,
): boolean {
  const boxW = dollRect.right - dollRect.left
  const boxH = dollRect.bottom - dollRect.top
  if (boxW <= 0 || boxH <= 0) return false

  let u = (xPercent - dollRect.left) / boxW
  const v = (yPercent - dollRect.top) / boxH
  if (flipX) u = 1 - u
  if (u < 0 || u > 1 || v < 0 || v > 1) return false

  const mask = getDollAlphaMask(maskSrc)
  if (!mask) return false
  return sampleDollAlpha(mask, u, v) >= DOLL_ALPHA_THRESHOLD
}

export function getSilhouetteXBoundsAtY(
  dollRect: Game3BoundaryRect,
  maskSrc: string,
  flipX: boolean,
  yPercent: number,
  yBand = 0.6,
): { leftX: number; rightX: number } | null {
  let leftX: number | null = null
  let rightX: number | null = null

  for (const dy of [-yBand * 0.5, 0, yBand * 0.5]) {
    const y = yPercent + dy
    for (let x = dollRect.left - 1.5; x <= dollRect.right + 1.5; x += 0.1) {
      if (!sampleSilhouetteAtWorldPoint(x, y, dollRect, maskSrc, flipX)) continue
      if (leftX === null || x < leftX) leftX = x
      if (rightX === null || x > rightX) rightX = x
    }
  }

  if (leftX === null || rightX === null || rightX <= leftX) return null
  return { leftX, rightX }
}

export function getSilhouetteTopY(
  dollRect: Game3BoundaryRect,
  maskSrc: string,
  flipX: boolean,
  x0: number,
  x1: number,
): number | null {
  const boxW = dollRect.right - dollRect.left
  const boxH = dollRect.bottom - dollRect.top
  if (boxW <= 0 || boxH <= 0) return null

  const u0 = (Math.min(x0, x1) - dollRect.left) / boxW
  const u1 = (Math.max(x0, x1) - dollRect.left) / boxW
  const topV = getDollSilhouetteTopV(maskSrc, u0, u1, flipX)
  if (topV === null || topV >= 1) return null
  return dollRect.top + topV * boxH
}

function countOverlapSamples(
  part: Game3BoundaryRect,
  dollRect: Game3BoundaryRect,
  maskSrc: string,
  flipX: boolean,
): number {
  let count = 0
  const cols = 4
  const rows = 5
  for (let c = 0; c <= cols; c += 1) {
    const x = part.left + ((part.right - part.left) * c) / cols
    for (let r = 0; r <= rows; r += 1) {
      const y = part.top + ((part.bottom - part.top) * r) / rows
      if (sampleSilhouetteAtWorldPoint(x, y, dollRect, maskSrc, flipX)) count += 1
    }
  }
  return count
}

function partTouchesSilhouette(
  part: Game3BoundaryRect,
  dollRect: Game3BoundaryRect,
  maskSrc: string,
  flipX: boolean,
): boolean {
  return countOverlapSamples(part, dollRect, maskSrc, flipX) > 0
}

export function partTouchesDollSilhouette(
  part: Game3BoundaryRect,
  dollRect: Game3BoundaryRect,
  maskSrc: string,
  flipX: boolean,
): boolean {
  return partTouchesSilhouette(part, dollRect, maskSrc, flipX)
}

function countInnerOverlapSamples(
  part: Game3BoundaryRect,
  dollRect: Game3BoundaryRect,
  maskSrc: string,
  flipX: boolean,
): number {
  let count = 0
  const cols = 4
  const rows = 4
  for (let c = 0; c <= cols; c += 1) {
    const u = 0.2 + (0.6 * c) / cols
    const x = part.left + (part.right - part.left) * u
    for (let r = 0; r <= rows; r += 1) {
      const v = 0.2 + (0.6 * r) / rows
      const y = part.top + (part.bottom - part.top) * v
      if (sampleSilhouetteAtWorldPoint(x, y, dollRect, maskSrc, flipX)) count += 1
    }
  }
  return count
}

/**
 * 집게 부품(어깨·다리·몸통)이 인형 실루엣 **안쪽**으로 들어왔는지.
 * 바깥 경계 접촉(1~2 격자 샘플)만 허용 — 사진처럼 박스가 실루엣을 뚫으면 true.
 */
export function partInvadesDollSilhouette(
  part: Game3BoundaryRect,
  dollRect: Game3BoundaryRect,
  maskSrc: string,
  flipX: boolean,
  kind: 'body' | 'limb',
): boolean {
  const overlapX0 = Math.max(part.left, dollRect.left)
  const overlapX1 = Math.min(part.right, dollRect.right)
  if (overlapX1 <= overlapX0) return false

  const insideCount = countOverlapSamples(part, dollRect, maskSrc, flipX)
  if (insideCount === 0) return false

  if (countInnerOverlapSamples(part, dollRect, maskSrc, flipX) > 0) return true

  const maxBoundary = GAME3_GRAB.maxBoundaryOverlapSamples

  if (kind === 'body') {
    const dollTopY = getSilhouetteTopY(dollRect, maskSrc, flipX, overlapX0, overlapX1)
    if (dollTopY === null) return insideCount > maxBoundary
    const margin = GAME3_PHYSICS.penetrateMarginY
    if (part.bottom <= dollTopY + margin) {
      return insideCount > maxBoundary
    }
    return true
  }

  return insideCount > maxBoundary
}

/** @deprecated partInvadesDollSilhouette 사용 */
export function partOverlapsDollOnDescent(
  part: Game3BoundaryRect,
  dollRect: Game3BoundaryRect,
  maskSrc: string,
  flipX: boolean,
  kind: 'body' | 'limb',
): boolean {
  return partInvadesDollSilhouette(part, dollRect, maskSrc, flipX, kind)
}

/**
 * 닫힘 시 — 다리가 자기 담당 반쪽(좌/우) 실루엣을 넘어 관통했는지.
 * 인형 bbox 중심이 아니라 **접촉 높이의 실루엣 중심** 기준.
 */
export function legCrossesSilhouetteHalfOnClose(
  part: Game3BoundaryRect,
  dollRect: Game3BoundaryRect,
  maskSrc: string,
  flipX: boolean,
  side: 'left' | 'right',
  contactY: number,
): boolean {
  const bounds = getSilhouetteXBoundsAtY(dollRect, maskSrc, flipX, contactY)
  if (!bounds) return false

  const silW = bounds.rightX - bounds.leftX
  const mid = (bounds.leftX + bounds.rightX) / 2
  const margin = silW * GAME3_GRAB.silhouetteMidMarginFrac
  const innerTipX = side === 'left' ? part.right : part.left

  if (side === 'left' && innerTipX > mid + margin) return true
  if (side === 'right' && innerTipX < mid - margin) return true

  let wrongSide = 0
  const cols = 4
  const rows = 4
  for (let c = 0; c <= cols; c += 1) {
    const x = part.left + ((part.right - part.left) * c) / cols
    for (let r = 0; r <= rows; r += 1) {
      const y = part.top + ((part.bottom - part.top) * r) / rows
      if (!sampleSilhouetteAtWorldPoint(x, y, dollRect, maskSrc, flipX)) continue
      if (side === 'left' && x > mid + margin) wrongSide += 1
      if (side === 'right' && x < mid - margin) wrongSide += 1
    }
  }

  return wrongSide >= GAME3_GRAB.legWrongSideSamples
}

/** 닫힘 시 — 경계선 넘어 부피 겹침(관통) */
export function legOverlapsDollOnClose(
  part: Game3BoundaryRect,
  dollRect: Game3BoundaryRect,
  maskSrc: string,
  flipX: boolean,
  side: 'left' | 'right',
  contactY: number,
): boolean {
  if (legCrossesSilhouetteHalfOnClose(part, dollRect, maskSrc, flipX, side, contactY)) {
    return true
  }
  const insideCount = countOverlapSamples(part, dollRect, maskSrc, flipX)
  return insideCount > GAME3_GRAB.maxBoundaryOverlapSamples
}

export function legTouchesSilhouetteHalf(
  part: Game3BoundaryRect,
  dollRect: Game3BoundaryRect,
  maskSrc: string,
  flipX: boolean,
  side: 'left' | 'right',
  contactY: number,
): boolean {
  const bounds = getSilhouetteXBoundsAtY(dollRect, maskSrc, flipX, contactY)
  if (!bounds) return partTouchesSilhouette(part, dollRect, maskSrc, flipX)

  const mid = (bounds.leftX + bounds.rightX) / 2
  const cols = 4
  const rows = 4
  for (let c = 0; c <= cols; c += 1) {
    const x = part.left + ((part.right - part.left) * c) / cols
    if (side === 'left' && x > mid) continue
    if (side === 'right' && x < mid) continue
    for (let r = 0; r <= rows; r += 1) {
      const y = part.top + ((part.bottom - part.top) * r) / rows
      if (sampleSilhouetteAtWorldPoint(x, y, dollRect, maskSrc, flipX)) return true
    }
  }
  return false
}

export function measurePinchCoverageRatio(
  leftPart: Game3BoundaryRect,
  rightPart: Game3BoundaryRect,
  dollRect: Game3BoundaryRect,
  maskSrc: string,
  flipX: boolean,
  contactY: number,
): number {
  const bounds = getSilhouetteXBoundsAtY(dollRect, maskSrc, flipX, contactY)
  if (!bounds) return 0

  const leftInnerX = leftPart.right
  const rightInnerX = rightPart.left
  const dollW = bounds.rightX - bounds.leftX
  if (dollW <= 0) return 0

  const gripW =
    Math.min(rightInnerX, bounds.rightX) - Math.max(leftInnerX, bounds.leftX)
  return Math.max(0, gripW) / dollW
}

export function bodyRestsOnSilhouetteSurface(
  bodyRect: Game3BoundaryRect,
  dollRect: Game3BoundaryRect,
  maskSrc: string,
  flipX: boolean,
): boolean {
  if (partInvadesDollSilhouette(bodyRect, dollRect, maskSrc, flipX, 'body')) return false

  const overlapX0 = Math.max(bodyRect.left, dollRect.left)
  const overlapX1 = Math.min(bodyRect.right, dollRect.right)
  if (overlapX1 <= overlapX0) return false

  const dollTopY = getSilhouetteTopY(dollRect, maskSrc, flipX, overlapX0, overlapX1)
  if (dollTopY === null) return false

  const margin = GAME3_PHYSICS.penetrateMarginY
  return (
    bodyRect.bottom >= dollTopY - margin * 0.5 &&
    bodyRect.bottom <= dollTopY + margin * 1.5 &&
    partTouchesSilhouette(bodyRect, dollRect, maskSrc, flipX)
  )
}

export type Game3ValidGripResult = {
  valid: boolean
  coverageRatio: number
  leftTouches: boolean
  rightTouches: boolean
  leftPenetrates: boolean
  rightPenetrates: boolean
}

/** 닫힘·파지 — 실루엣 침범 여부 (하강과 동일 규칙) */
export function legPenetratesDollVolume(
  part: Game3BoundaryRect,
  dollRect: Game3BoundaryRect,
  maskSrc: string,
  flipX: boolean,
): boolean {
  return partInvadesDollSilhouette(part, dollRect, maskSrc, flipX, 'limb')
}

/** 닫힌 상태 — 양쪽 다리가 인형을 감싸면 성공 (경계 접촉은 침범 아님) */
export function evaluateGame3GripGrasp(
  leftLeg: Game3BoundaryRect,
  rightLeg: Game3BoundaryRect,
  dollRect: Game3BoundaryRect,
  maskSrc: string,
  flipX: boolean,
): Game3ValidGripResult {
  const contactY = (leftLeg.bottom + rightLeg.bottom) / 2

  const leftTouches = partTouchesSilhouette(leftLeg, dollRect, maskSrc, flipX)
  const rightTouches = partTouchesSilhouette(rightLeg, dollRect, maskSrc, flipX)

  const coverageRatio = measurePinchCoverageRatio(
    leftLeg,
    rightLeg,
    dollRect,
    maskSrc,
    flipX,
    contactY,
  )

  const hooked =
    leftTouches &&
    rightTouches &&
    coverageRatio >= GAME3_GRAB.minCoverageRatio

  const leftPenetrates =
    partInvadesDollSilhouette(leftLeg, dollRect, maskSrc, flipX, 'limb') && !hooked
  const rightPenetrates =
    partInvadesDollSilhouette(rightLeg, dollRect, maskSrc, flipX, 'limb') && !hooked

  return {
    valid: hooked,
    coverageRatio,
    leftTouches,
    rightTouches,
    leftPenetrates,
    rightPenetrates,
  }
}
