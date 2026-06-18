import { GAME2_CLAW, GAME2_CLAW_POSE, type Game2ClawState } from './game2Config'
import type { Game2ClawRender } from './game2PlayArea'
import {
  resolveGame3DescentStop,
  getGame3ClawHitboxes,
  getGame3ClawTipInnerXPercent,
  getGame3LowerLegRects,
  type Game3Rect,
} from './game3ClawCollision'
import {
  DOLL_ALPHA_THRESHOLD,
  getDollAlphaMask,
  getDollOpaqueBounds,
  getDollSilhouetteTopV,
  sampleDollAlpha,
} from './dollAlphaMask'
import {
  GAME3_CLAW,
  GAME3_DOLLS,
  GAME3_CHUTE,
  GAME3_GRAB,
  GAME3_GUIDE,
  GAME3_PHYSICS,
  GAME3_WORLD,
} from './game3Config'

export { getGame3ClawHitboxes, getGame3ClawTipInnerXPercent, resolveGame3DescentStop } from './game3ClawCollision'
export type { Game3ClawHitboxes, Game3DescentStop } from './game3ClawCollision'

const G3_CLAW_RIG = {
  aspectHOverW: 380 / 319,
  pivotXFrac: 0.31,
  get armHeightFrac() {
    return GAME2_CLAW.rigArmHeightFrac
  },
  lowerExtraFrac: 0.04,
  tipHalfWidthFrac: (0.5 * 0.28 * 0.18) / 2,
} as const

export type Game3DollState = {
  id: number
  imageSrc: string
  xPercent: number
  rotateDeg: number
  faceScaleX: number
  stackLevel: 0 | 1
  supportId: number | null
  captured: boolean
  falling: boolean
  /** 배출구 낙하 시작 y (world %, 위에서 아래) */
  fallReleaseVisualY?: number
}

let nextDollId = 1

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function pickRandomImage(pool: readonly string[]) {
  return pool[Math.floor(Math.random() * pool.length)] ?? pool[0]
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

/** 인형 스프라이트 높이 (world %, playfield 기준) */
export function getGame3DollHeightPercent() {
  return (GAME3_DOLLS.emojiSizePx / GAME3_WORLD.height) * 100
}

/** 회전 반영 가로 폭 (world %) */
export function getGame3DollWidthPercent(rotateDeg: number) {
  const rad = (rotateDeg * Math.PI) / 180
  const boxPercent =
    (GAME3_DOLLS.emojiSizePx / (GAME3_WORLD.width * GAME3_WORLD.widthScale)) * 100
  return boxPercent * (Math.abs(Math.cos(rad)) + Math.abs(Math.sin(rad))) * 1.06
}

/** 충돌·히트박스용 (CSS rig보다 짧게 잡는 튜닝 값) */
function getGame3ClawRigHeightPercent() {
  const { rigWidth } = GAME2_CLAW
  const scale = GAME3_CLAW.rigVisualScale
  const worldAspect = GAME3_WORLD.width / GAME3_WORLD.height
  return rigWidth * scale * worldAspect * (380 / 319) * 0.52
}

/** CSS .g2-claw__rig aspect-ratio(319/380) 기준 실제 rig 높이 (world %) */
function getGame3ClawRigHeightPercentVisual() {
  const { rigWidth } = GAME2_CLAW
  const scale = GAME3_CLAW.rigVisualScale
  const worldAspect = GAME3_WORLD.width / GAME3_WORLD.height
  return rigWidth * scale * worldAspect * (380 / 319)
}

function getGame3ClawRigWidthPx() {
  const worldWidth = GAME3_WORLD.width * GAME3_WORLD.widthScale
  return (
    ((GAME2_CLAW.rigWidth * GAME3_CLAW.rigVisualScale) / GAME3_WORLD.widthScale / 100) *
    worldWidth
  )
}

function getGame3ClawTipGapFrac(gripT: number): number {
  const opened = GAME2_CLAW_POSE.open
  const t = clamp(gripT, 0, 1)

  // 어깨·관절 고정, 다리(아랫팔)만 gripT로 움직임 (lerpClawPoseSplit와 동기)
  const armDeg = opened.armLeft
  const lowerDeg = lerp(GAME3_GRAB.lowerClosedLeftDeg, opened.lowerLeft, t)
  const jointTopFrac = opened.jointTop / 100

  const armLen = G3_CLAW_RIG.armHeightFrac * G3_CLAW_RIG.aspectHOverW
  const upperLen = jointTopFrac * armLen
  const lowerLen = (1 - jointTopFrac + G3_CLAW_RIG.lowerExtraFrac) * armLen

  const armRad = (armDeg * Math.PI) / 180
  const tipRad = ((armDeg + lowerDeg) * Math.PI) / 180
  const offsetLeft = upperLen * -Math.sin(armRad) + lowerLen * -Math.sin(tipRad)

  const centerGap = (1 - 2 * G3_CLAW_RIG.pivotXFrac) - 2 * offsetLeft
  return centerGap - 2 * G3_CLAW_RIG.tipHalfWidthFrac
}

/** 인형 실루엣 가로 폭 (디자인 px) — 마스크 미로드 시 폴백 */
function getGame3DollGrabWidthPxFallback(rotateDeg: number) {
  const rad = (rotateDeg * Math.PI) / 180
  const box = GAME3_DOLLS.emojiSizePx
  const span = box * (Math.abs(Math.cos(rad)) + Math.abs(Math.sin(rad)))
  return span * 0.58
}

function partOverlapsDollCenterX(
  part: { left: number; right: number },
  doll: Game3DollState,
): boolean {
  const halfW = getGame3DollWidthPercent(doll.rotateDeg) / 2
  return part.left < doll.xPercent + halfW && part.right > doll.xPercent - halfW
}

/** 하강 멈춤 시 집게-인형 접촉 높이 (world %) — 몸통/팔 중 가장 깊은 접촉 */
export function getGame3GrabContactY(
  claw: Pick<Game2ClawState, 'xPercent' | 'clawLiftPercent'>,
  doll: Game3DollState,
): number {
  const boxes = getGame3ClawHitboxes(claw.xPercent, claw.clawLiftPercent ?? 0)
  let contactY = boxes.body.bottom
  for (const part of [
    boxes.body,
    boxes.leftUpper,
    boxes.leftLower,
    boxes.rightUpper,
    boxes.rightLower,
  ]) {
    if (partOverlapsDollCenterX(part, doll)) {
      contactY = Math.max(contactY, part.bottom)
    }
  }
  return contactY
}

function getGame3ClawTipGapWorldPx(gripT: number) {
  return getGame3ClawTipGapFrac(gripT) * getGame3ClawRigWidthPx()
}

/** UV 밴드 [uMin,uMax]·행 v에서 uCenter를 포함하는 불투명 구간 폭 (디자인 px) */
function measureOpaqueBandWidthPx(
  mask: NonNullable<ReturnType<typeof getDollAlphaMask>>,
  uMin: number,
  uMax: number,
  v: number,
  uCenter: number,
): number | null {
  const step = 1 / mask.size
  const ua = clamp(Math.min(uMin, uMax), 0, 1)
  const ub = clamp(Math.max(uMin, uMax), 0, 1)

  type Interval = { start: number; end: number }
  const intervals: Interval[] = []
  let current: Interval | null = null
  let gapSteps = 0

  for (let u = ua; u <= ub + step * 0.5; u += step) {
    const uc = clamp(u, 0, 1)
    const opaque = sampleDollAlpha(mask, uc, v) >= DOLL_ALPHA_THRESHOLD
    if (opaque) {
      if (current) current.end = uc
      else current = { start: uc, end: uc }
      gapSteps = 0
    } else if (current) {
      gapSteps += 1
      if (gapSteps > 2) {
        intervals.push(current)
        current = null
        gapSteps = 0
      }
    }
  }
  if (current) intervals.push(current)
  if (intervals.length === 0) return null

  for (const interval of intervals) {
    if (uCenter >= interval.start && uCenter <= interval.end) {
      return (interval.end - interval.start) * GAME3_DOLLS.emojiSizePx
    }
  }

  let best: Interval | null = null
  let bestDist = Infinity
  for (const interval of intervals) {
    const dist =
      uCenter < interval.start ? interval.start - uCenter : uCenter - interval.end
    if (dist < bestDist) {
      best = interval
      bestDist = dist
    }
  }
  if (!best || bestDist > 0.1) return null
  return (best.end - best.start) * GAME3_DOLLS.emojiSizePx
}

/**
 * 접촉 행 실루엣 가로 폭 (디자인 px) — 마스크 UV + 집게 몸통 밴드.
 * world Y↔UV 오차를 피하기 위해 getDollSilhouetteTopV로 접촉 v를 구한다.
 */
function measureGame3GrabWidthPx(
  claw: Pick<Game2ClawState, 'xPercent' | 'clawLiftPercent'>,
  doll: Game3DollState,
): number {
  const mask = getDollAlphaMask(doll.imageSrc)
  if (!mask) return getGame3DollGrabWidthPxFallback(doll.rotateDeg)

  const boxes = getGame3ClawHitboxes(claw.xPercent, claw.clawLiftPercent ?? 0)
  const contactY = getGame3GrabContactY(claw, doll)

  const uAtX = (xPercent: number) =>
    worldPointToGame3DollUV(xPercent, contactY, doll)?.u ?? null

  const uBodyLeft = uAtX(boxes.body.left)
  const uBodyRight = uAtX(boxes.body.right)
  const uCenter = uAtX(claw.xPercent)

  if (uBodyLeft === null || uBodyRight === null || uCenter === null) {
    return measureGame3GrabWidthFallbackPx(doll, contactY, claw.xPercent)
  }

  const u0 = Math.min(uBodyLeft, uBodyRight) - 0.05
  const u1 = Math.max(uBodyLeft, uBodyRight) + 0.05
  // worldPointToGame3DollUV가 faceScaleX 반전을 이미 반영 — flipX 불필요
  const topV = getDollSilhouetteTopV(doll.imageSrc, u0, u1, false)

  if (topV === null || topV >= 1) {
    const bounds = getDollOpaqueBounds(doll.imageSrc)
    if (bounds) return (bounds.right - bounds.left) * GAME3_DOLLS.emojiSizePx
    return getGame3DollGrabWidthPxFallback(doll.rotateDeg)
  }

  let bestWidth = 0
  for (const dv of [0, 0.02, 0.04, 0.07]) {
    const v = clamp(topV + dv, 0, 1)
    const rowWidth = measureOpaqueBandWidthPx(mask, u0, u1, v, uCenter)
    if (rowWidth !== null) bestWidth = Math.max(bestWidth, rowWidth)
  }

  if (bestWidth > 0) return bestWidth
  return measureGame3GrabWidthFallbackPx(doll, contactY, claw.xPercent)
}

function measureGame3GrabWidthFallbackPx(
  doll: Game3DollState,
  contactYPercent: number,
  clawXPercent: number,
): number {
  const mask = getDollAlphaMask(doll.imageSrc)
  if (mask) {
    const uv = worldPointToGame3DollUV(clawXPercent, contactYPercent, doll)
    if (uv) {
      const uPad = 0.12
      for (const dv of [0, 0.025, 0.05, -0.025]) {
        const v = clamp(uv.v + dv, 0, 1)
        const rowWidth = measureOpaqueBandWidthPx(
          mask,
          uv.u - uPad,
          uv.u + uPad,
          v,
          uv.u,
        )
        if (rowWidth !== null) return rowWidth
      }
    }
    const bounds = getDollOpaqueBounds(doll.imageSrc)
    if (bounds) return (bounds.right - bounds.left) * GAME3_DOLLS.emojiSizePx
  }
  return getGame3DollGrabWidthPxFallback(doll.rotateDeg)
}

/** 월드 좌표 → 인형 스프라이트 UV (정사각 박스, 회전·좌우반전 반영) */
function worldPointToGame3DollUV(
  xPercent: number,
  yPercent: number,
  doll: Game3DollState,
): { u: number; v: number } | null {
  const feetY = getGame3DollVisualY(doll.stackLevel)
  const boxW =
    (GAME3_DOLLS.emojiSizePx / (GAME3_WORLD.width * GAME3_WORLD.widthScale)) * 100
  const boxH = getGame3DollHeightPercent()
  if (boxW <= 0 || boxH <= 0) return null

  const dx = xPercent - doll.xPercent
  const dy = yPercent - feetY
  const rad = (-doll.rotateDeg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const rx = (dx * cos - dy * sin) / doll.faceScaleX
  const ry = dx * sin + dy * cos

  const u = rx / boxW + 0.5
  const v = 1 + ry / boxH
  if (u < 0 || u > 1 || v < 0 || v > 1) return null
  return { u, v }
}

/**
 * 접촉 높이에서 집게 중심 기준 실루엣 가로 두께 (디자인 px).
 * Game2 findGrabbedPartInterval과 동일 — 알파 스캔.
 */
export function measureGame3GrabbedPartWidthPx(
  clawXPercent: number,
  contactYPercent: number,
  doll: Game3DollState,
): number | null {
  const mask = getDollAlphaMask(doll.imageSrc)
  if (!mask) return null

  const worldWidthPx = GAME3_WORLD.width * GAME3_WORLD.widthScale
  const halfRangePx = Math.max(GAME3_DOLLS.emojiSizePx * 0.42, getGame3ClawRigWidthPx() * 0.5)
  const stepPx = 1
  const gapTolerancePx = 2
  const tipRadiusPx = GAME3_DOLLS.gripTipRadiusPx
  const dyOffsetsPx = [0, -3, 3, -6, 6]

  const isOpaqueAt = (dxPx: number) =>
    dyOffsetsPx.some((dyPx) => {
      const x = clawXPercent + (dxPx / worldWidthPx) * 100
      const y = contactYPercent + (dyPx / GAME3_WORLD.height) * 100
      const uv = worldPointToGame3DollUV(x, y, doll)
      if (!uv) return false
      return sampleDollAlpha(mask, uv.u, uv.v) >= DOLL_ALPHA_THRESHOLD
    })

  type Interval = { start: number; end: number }
  const intervals: Interval[] = []
  let current: Interval | null = null
  let gap = 0

  for (let dx = -halfRangePx; dx <= halfRangePx; dx += stepPx) {
    if (isOpaqueAt(dx)) {
      if (current) current.end = dx
      else current = { start: dx, end: dx }
      gap = 0
    } else if (current) {
      gap += stepPx
      if (gap > gapTolerancePx) {
        intervals.push(current)
        current = null
        gap = 0
      }
    }
  }
  if (current) intervals.push(current)
  if (intervals.length === 0) return null

  let best: Interval | null = null
  let bestDist = Infinity
  for (const interval of intervals) {
    const dist =
      interval.start > 0 ? interval.start : interval.end < 0 ? -interval.end : 0
    if (dist <= tipRadiusPx && dist < bestDist) {
      best = interval
      bestDist = dist
    }
  }
  if (!best) return null
  return best.end - best.start
}

export function getGame3DollVisualY(stackLevel: 0 | 1) {
  return GAME3_WORLD.floorY - stackLevel * GAME3_DOLLS.stackLiftY
}

export function moveGame3ClawX(xPercent: number, direction: 'left' | 'right') {
  const step = direction === 'left' ? -GAME3_CLAW.moveStepX : GAME3_CLAW.moveStepX
  return clamp(xPercent + step, GAME3_CLAW.minX, GAME3_CLAW.maxX)
}

/** 🟡 배출구 영역 bounds (world %) */
export function getGame3ChuteBounds() {
  return { ...GAME3_CHUTE }
}

/** 배출구 중심 x — 집게 자동 이동 목표 */
export function getGame3ChuteCenterX() {
  return (GAME3_CHUTE.leftX + GAME3_CHUTE.rightX) / 2
}

/** 집게 x가 배출구 안인지 */
export function isGame3ClawInChute(xPercent: number) {
  return xPercent >= GAME3_CHUTE.leftX && xPercent <= GAME3_CHUTE.rightX
}

export function lerpGame3ClawX(from: number, to: number, t: number) {
  return lerp(from, to, clamp(t, 0, 1))
}

/** viewport 높이 기준 world 픽셀 너비 */
export function getGame3WorldWidthPx(viewportHeightPx: number) {
  return (
    viewportHeightPx *
    (GAME3_WORLD.width / GAME3_WORLD.height) *
    GAME3_WORLD.widthScale
  )
}

/** 집게 x(world %)를 중심에 두도록 가로 스크롤(px) */
export function getGame3ScrollLeftPx(
  clawXPercent: number,
  viewportWidthPx: number,
  worldWidthPx: number,
) {
  if (worldWidthPx <= viewportWidthPx) return 0
  const clawPx = (clawXPercent / 100) * worldWidthPx
  const target = clawPx - viewportWidthPx * 0.5
  return clamp(target, 0, worldWidthPx - viewportWidthPx)
}

/** 빨간 경계선 오른쪽부터 배경 끝까지 균등하게 한 줄 채우기 */
export function createRandomGame3Dolls(
  imagePool: readonly string[],
  boundaryX = GAME3_GUIDE.giftBoxBoundaryX,
): Game3DollState[] {
  if (imagePool.length === 0) return []

  const zoneLeft = boundaryX + GAME3_DOLLS.zoneMarginAfterBoundary
  const zoneRight = 100 - GAME3_DOLLS.zoneMarginRight
  const zoneWidth = zoneRight - zoneLeft

  const gap = GAME3_DOLLS.minSpacingGap
  // 회전 최대치 기준 폭으로 간격을 잡아 겹침을 방지
  const dollW = getGame3DollWidthPercent(GAME3_DOLLS.placeRotateDeg)
  const halfDollW = dollW / 2

  // 영역에 들어가는 최대 개수 (양 끝이 영역 안에 들어오도록)
  const count = Math.max(1, Math.floor((zoneWidth + gap) / (dollW + gap)))

  const usableSpan = zoneWidth - dollW
  const step = count > 1 ? usableSpan / (count - 1) : 0
  const startX = count > 1 ? zoneLeft + halfDollW : zoneLeft + zoneWidth / 2

  const floorDolls: Game3DollState[] = []

  for (let i = 0; i < count; i += 1) {
    const rotateDeg = randomBetween(
      -GAME3_DOLLS.placeRotateDeg,
      GAME3_DOLLS.placeRotateDeg,
    )
    floorDolls.push({
      id: nextDollId++,
      imageSrc: pickRandomImage(imagePool),
      xPercent: startX + step * i,
      rotateDeg,
      faceScaleX: Math.random() < 0.5 ? -1 : 1,
      stackLevel: 0,
      supportId: null,
      captured: false,
      falling: false,
    })
  }

  return floorDolls
}

export function getGame3DollById(dolls: readonly Game3DollState[], id: number | null) {
  if (id === null) return null
  return dolls.find((doll) => doll.id === id) ?? null
}

/** 집게 발 아래 — 노출된(2층 우선) 인형 */
export function findGame3GrabTarget(
  dolls: readonly Game3DollState[],
  clawXPercent: number,
): Game3DollState | null {
  const candidates = dolls.filter(
    (doll) =>
      !doll.captured &&
      !doll.falling &&
      Math.abs(doll.xPercent - clawXPercent) <= GAME3_DOLLS.grabRadiusX,
  )

  if (candidates.length === 0) return null

  return candidates.reduce((best, doll) => {
    if (doll.stackLevel > best.stackLevel) return doll
    if (doll.stackLevel < best.stackLevel) return best
    const dollDist = Math.abs(doll.xPercent - clawXPercent)
    const bestDist = Math.abs(best.xPercent - clawXPercent)
    return dollDist < bestDist ? doll : best
  })
}

/** @deprecated 2D 충돌 기반 — resolveGame3DescentStop 사용 */
export function getGame3StackLiftAt(
  dolls: readonly Game3DollState[],
  clawXPercent: number,
): number {
  return resolveGame3DescentStop(clawXPercent, dolls).clawLiftPercent
}

export type Game3GripTSplit = {
  left: number
  right: number
}

/** 접촉 행에서 인형 실루엣 좌·우 가장자리 (world %) */
function measureGame3GrabSilhouetteXBounds(
  clawXPercent: number,
  contactYPercent: number,
  doll: Game3DollState,
): { leftX: number; rightX: number } | null {
  const mask = getDollAlphaMask(doll.imageSrc)
  if (!mask) return null

  const worldWidthPx = GAME3_WORLD.width * GAME3_WORLD.widthScale
  const halfRangePx = Math.max(GAME3_DOLLS.emojiSizePx * 0.45, getGame3ClawRigWidthPx() * 0.55)
  const dyOffsetsPct = [0, -0.4, 0.4]

  let leftX: number | null = null
  let rightX: number | null = null

  for (const dyPct of dyOffsetsPct) {
    const y = contactYPercent + dyPct
    for (let dx = -halfRangePx; dx <= halfRangePx; dx += 1) {
      const x = clawXPercent + (dx / worldWidthPx) * 100
      const uv = worldPointToGame3DollUV(x, y, doll)
      if (!uv) continue
      if (sampleDollAlpha(mask, uv.u, uv.v) >= DOLL_ALPHA_THRESHOLD) {
        if (leftX === null || x < leftX) leftX = x
        if (rightX === null || x > rightX) rightX = x
      }
    }
  }

  if (leftX === null || rightX === null || rightX <= leftX) return null
  return { leftX, rightX }
}

function solveGame3GripTForTipTarget(
  side: 'left' | 'right',
  claw: Pick<Game2ClawState, 'xPercent' | 'clawLiftPercent'>,
  targetInnerX: number,
): number {
  const lift = claw.clawLiftPercent ?? 0
  const openTips = getGame3ClawTipInnerXPercent(claw.xPercent, lift, 1, 1)
  const closedTips = getGame3ClawTipInnerXPercent(claw.xPercent, lift, 0, 0)

  if (side === 'left') {
    if (targetInnerX <= openTips.left) return 1
    if (targetInnerX >= closedTips.left) return 0
    let lo = 0
    let hi = 1
    for (let i = 0; i < 24; i += 1) {
      const mid = (lo + hi) / 2
      const tips = getGame3ClawTipInnerXPercent(claw.xPercent, lift, mid, 1)
      if (tips.left < targetInnerX) lo = mid
      else hi = mid
    }
    return (lo + hi) / 2
  }

  if (targetInnerX >= openTips.right) return 1
  if (targetInnerX <= closedTips.right) return 0
  let lo = 0
  let hi = 1
  for (let i = 0; i < 24; i += 1) {
    const mid = (lo + hi) / 2
    const tips = getGame3ClawTipInnerXPercent(claw.xPercent, lift, 1, mid)
    if (tips.right > targetInnerX) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

/**
 * 다리(아랫팔) 박스 영역 안에 인형 실루엣(불투명 픽셀)이 있는지 — 빨강 점선 ↔ 흰 윤곽 기준.
 * 박스 안을 격자로 훑어 한 점이라도 불투명하면 닿은 것으로 본다.
 */
function boxTouchesDollSilhouette(
  box: Game3Rect,
  doll: Game3DollState,
  cols: number,
  rows: number,
): boolean {
  const mask = getDollAlphaMask(doll.imageSrc)
  if (!mask) return false

  for (let c = 0; c <= cols; c += 1) {
    const x = box.left + ((box.right - box.left) * c) / cols
    for (let r = 0; r <= rows; r += 1) {
      const y = box.top + ((box.bottom - box.top) * r) / rows
      const uv = worldPointToGame3DollUV(x, y, doll)
      if (uv && sampleDollAlpha(mask, uv.u, uv.v) >= DOLL_ALPHA_THRESHOLD) {
        return true
      }
    }
  }
  return false
}

function legBoxTouchesDollSilhouette(box: Game3Rect, doll: Game3DollState): boolean {
  return boxTouchesDollSilhouette(box, doll, 5, 6)
}

/**
 * 한쪽 다리를 벌림(1)→닫힘(0)으로 닫으며, 그 다리 박스가 인형 실루엣에 처음 닿는 gripT를 찾는다.
 * 닿은 뒤 살짝 더 파고들어(squeeze) 단단히 쥔다. 끝까지 안 닿으면 완전히 닫는다(0).
 * 좌·우를 따로 풀므로 인형이 치우치거나 좌우 폭이 다르면 서로 다른 양만큼 닫힌다.
 */
function solveGame3LegGripT(
  side: 'left' | 'right',
  claw: Pick<Game2ClawState, 'xPercent' | 'clawLiftPercent'>,
  doll: Game3DollState,
): number | null {
  const mask = getDollAlphaMask(doll.imageSrc)
  if (!mask) return null

  const lift = claw.clawLiftPercent ?? 0
  const STEPS = 60
  /** 닿은 뒤 추가로 더 닫아 파고드는 양 (gripT) */
  const squeezeT = 0.05

  const legTouches = (gt: number): boolean => {
    const legs = getGame3LowerLegRects(
      claw.xPercent,
      lift,
      side === 'left' ? gt : 1,
      side === 'right' ? gt : 1,
    )
    const box = side === 'left' ? legs.left : legs.right
    return legBoxTouchesDollSilhouette(box, doll)
  }

  for (let i = 0; i <= STEPS; i += 1) {
    const gt = 1 - i / STEPS // 벌림(1) → 닫힘(0)
    if (legTouches(gt)) {
      return clamp(gt - squeezeT, 0, 1)
    }
  }

  // 끝까지 안 닿음 — 완전히 닫아 감싼다
  return 0
}

/** 좌·우 다리 독립 — 각 다리가 인형 실루엣에 닿을 때까지 따로 오므리는 gripT */
export function getGame3GripTForDollSplit(
  doll: Game3DollState,
  claw: Pick<Game2ClawState, 'xPercent' | 'descendT' | 'clawLiftPercent'>,
): Game3GripTSplit {
  const left = solveGame3LegGripT('left', claw, doll)
  const right = solveGame3LegGripT('right', claw, doll)

  if (left !== null && right !== null) {
    return { left, right }
  }

  // 마스크 미로드 등 — 실루엣 가장자리 기반 폴백
  const contactY = getGame3GrabContactY(claw, doll)
  const bounds = measureGame3GrabSilhouetteXBounds(claw.xPercent, contactY, doll)
  if (!bounds) {
    const symmetric = getGame3GripTForDoll(doll, claw)
    return { left: symmetric, right: symmetric }
  }

  const worldWidthPx = GAME3_WORLD.width * GAME3_WORLD.widthScale
  const squeezeHalfPct = ((GAME3_DOLLS.gripSqueezePx / 2) / worldWidthPx) * 100
  return {
    left: left ?? solveGame3GripTForTipTarget('left', claw, bounds.leftX + squeezeHalfPct),
    right:
      right ?? solveGame3GripTForTipTarget('right', claw, bounds.rightX - squeezeHalfPct),
  }
}

/** 임의 사각형(world %)이 인형 실루엣과 겹치는지 — body 등 범용 */
function rectTouchesDollSilhouette(box: Game3Rect, doll: Game3DollState): boolean {
  return legBoxTouchesDollSilhouette(box, doll)
}

/** 하강 시 빨간 다리가 바닥을 넘지 않는 최저 lift (인형 무시) */
export function getGame3DescentFloorLift(clawXPercent: number): number {
  return resolveGame3DescentStop(clawXPercent, []).clawLiftPercent
}

/** 몸통(초록)이 인형 실루엣을 뚫지 않도록, 겹치기 직전(경계 접촉)에서 멈추는 가장 깊은 lift */
function bodyOverlapsAnyDoll(
  clawXPercent: number,
  lift: number,
  dolls: readonly Game3DollState[],
): boolean {
  const boxes = getGame3ClawHitboxes(clawXPercent, lift)
  return dolls.some((doll) => boxTouchesDollSilhouette(boxes.body, doll, 10, 8))
}

export function getGame3BodyRestLift(
  clawXPercent: number,
  floorLift: number,
  dolls: readonly Game3DollState[],
): number {
  const active = dolls.filter((doll) => !doll.captured && !doll.falling)
  if (active.length === 0) return floorLift

  // 바닥까지 내려도 몸통이 안 겹치면 바닥까지
  if (!bodyOverlapsAnyDoll(clawXPercent, floorLift, active)) return floorLift
  // 최상단에서도 겹치면(드묾) 더 내릴 수 없음
  if (bodyOverlapsAnyDoll(clawXPercent, GAME3_CLAW.cableVisualLift, active)) {
    return GAME3_CLAW.cableVisualLift
  }

  let lo = floorLift // 겹침
  let hi: number = GAME3_CLAW.cableVisualLift // 안 겹침
  for (let i = 0; i < 26; i += 1) {
    const mid = (lo + hi) / 2
    if (bodyOverlapsAnyDoll(clawXPercent, mid, active)) lo = mid
    else hi = mid
  }
  return hi // 겹치지 않는 가장 깊은(작은) lift
}

export type Game3DescentDollUpdate = {
  id: number
  xPercent: number
  rotateDeg: number
}

/** 인형 중심이 머물 수 있는 가로 한계 (world %) */
function getGame3DollPushBounds(): { min: number; max: number } {
  const half = getGame3DollWidthPercent(0) / 2
  return {
    min: GAME3_GUIDE.giftBoxBoundaryX + GAME3_PHYSICS.pushBoundMargin + half,
    max: 100 - GAME3_PHYSICS.pushBoundMargin - half,
  }
}

/**
 * 하강 한 스텝 — 현재 lift에서 다리(어깨+아랫팔) 박스가 인형 실루엣에 닿으면
 * 그 인형을 다리 반대쪽(중심 방향)으로 밀고 살짝 회전시킨다.
 * 양쪽 다리가 동시에 닿으면(인형이 가운데) 밀리지 않고 그대로 — 잡기 후보가 된다.
 */
export function stepGame3DescentPush(
  clawXPercent: number,
  lift: number,
  dolls: readonly Game3DollState[],
  dtMs: number,
): Game3DescentDollUpdate[] {
  const boxes = getGame3ClawHitboxes(clawXPercent, lift)
  const bounds = getGame3DollPushBounds()
  const updates: Game3DescentDollUpdate[] = []

  for (const doll of dolls) {
    if (doll.captured || doll.falling) continue

    const leftContact =
      rectTouchesDollSilhouette(boxes.leftLower, doll) ||
      rectTouchesDollSilhouette(boxes.leftUpper, doll)
    const rightContact =
      rectTouchesDollSilhouette(boxes.rightLower, doll) ||
      rectTouchesDollSilhouette(boxes.rightUpper, doll)

    if (!leftContact && !rightContact) continue

    // 왼쪽 다리는 인형을 오른쪽(+)으로, 오른쪽 다리는 왼쪽(-)으로 민다.
    let dir = 0
    if (leftContact) dir += 1
    if (rightContact) dir -= 1
    if (dir === 0) continue // 양쪽 straddle — 가운데, 그대로 둠

    const newX = clamp(
      doll.xPercent + dir * GAME3_PHYSICS.pushSpeedPctPerMs * dtMs,
      bounds.min,
      bounds.max,
    )
    const newRot = clamp(
      doll.rotateDeg + dir * GAME3_PHYSICS.rotSpeedDegPerMs * dtMs,
      -GAME3_PHYSICS.maxRotateDeg,
      GAME3_PHYSICS.maxRotateDeg,
    )

    if (newX !== doll.xPercent || newRot !== doll.rotateDeg) {
      updates.push({ id: doll.id, xPercent: newX, rotateDeg: newRot })
    }
  }

  return updates
}

export type Game3DescentRest = {
  /** 더 내려갈 수 없음 (몸통이 인형 위에 얹힘) */
  resting: boolean
  /** 잡기 후보 인형 */
  hitDoll: Game3DollState | null
}

/**
 * 현재 lift에서 하강을 멈춰야 하는지 — 몸통(초록)이 인형 실루엣에 얹히면 정지.
 * 멈출 때/바닥 도달 시 다리 사이에 든 인형을 잡기 후보로 고른다.
 */
export function resolveGame3DescentRest(
  clawXPercent: number,
  lift: number,
  dolls: readonly Game3DollState[],
): Game3DescentRest {
  const boxes = getGame3ClawHitboxes(clawXPercent, lift)
  const active = dolls.filter((doll) => !doll.captured && !doll.falling)

  // 몸통(초록)이 인형 위에 얹힘 → 정지
  let bodyDoll: Game3DollState | null = null
  for (const doll of active) {
    if (rectTouchesDollSilhouette(boxes.body, doll)) {
      if (
        bodyDoll === null ||
        Math.abs(doll.xPercent - clawXPercent) <
          Math.abs(bodyDoll.xPercent - clawXPercent)
      ) {
        bodyDoll = doll
      }
    }
  }

  return { resting: bodyDoll !== null, hitDoll: bodyDoll }
}

/** 다리 박스 사이에 실루엣이 걸린, 중심에 가장 가까운 잡기 후보 */
export function findGame3DescentCandidate(
  clawXPercent: number,
  lift: number,
  dolls: readonly Game3DollState[],
): Game3DollState | null {
  const boxes = getGame3ClawHitboxes(clawXPercent, lift)
  const parts = [
    boxes.body,
    boxes.leftLower,
    boxes.rightLower,
    boxes.leftUpper,
    boxes.rightUpper,
  ]
  let best: Game3DollState | null = null
  for (const doll of dolls) {
    if (doll.captured || doll.falling) continue
    if (!parts.some((box) => rectTouchesDollSilhouette(box, doll))) continue
    if (
      best === null ||
      Math.abs(doll.xPercent - clawXPercent) < Math.abs(best.xPercent - clawXPercent)
    ) {
      best = doll
    }
  }
  return best
}

/**
 * 닫힌 상태에서 양쪽 다리 박스가 모두 인형 실루엣에 닿아 실제로 감쌌는지 — 최종 파지 판정.
 * 한쪽이라도 인형에 못 닿으면 헛잡음(놓침)으로 본다.
 */
export function doesGame3GripGraspDoll(
  claw: Pick<Game2ClawState, 'xPercent' | 'clawLiftPercent'>,
  gripTLeft: number,
  gripTRight: number,
  doll: Game3DollState,
): boolean {
  const legs = getGame3LowerLegRects(
    claw.xPercent,
    claw.clawLiftPercent ?? 0,
    gripTLeft,
    gripTRight,
  )
  return (
    legBoxTouchesDollSilhouette(legs.left, doll) &&
    legBoxTouchesDollSilhouette(legs.right, doll)
  )
}

/** 접촉 지점 실루엣 두께 → 집게 오므림 gripT (0=완전 닫힘, 1=완전 벌림) — 양팔 동일 */
export function getGame3GripTForDoll(
  doll: Game3DollState,
  claw: Pick<Game2ClawState, 'xPercent' | 'descendT' | 'clawLiftPercent'>,
): number {
  const widthPx = measureGame3GrabWidthPx(claw, doll)
  const targetGapPx = Math.max(0, widthPx - GAME3_DOLLS.gripSqueezePx)
  const gapClosedPx = getGame3ClawTipGapWorldPx(0)
  const gapOpenPx = getGame3ClawTipGapWorldPx(1)

  if (targetGapPx <= gapClosedPx) return 0
  if (targetGapPx >= gapOpenPx) return 1

  let lo = 0
  let hi = 1
  for (let i = 0; i < 24; i += 1) {
    const mid = (lo + hi) / 2
    if (getGame3ClawTipGapWorldPx(mid) < targetGapPx) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

/** 집게 팁 위치 (world %) */
export function getGame3ClawTipPoint(
  claw: Pick<Game2ClawState, 'xPercent' | 'descendT' | 'clawLiftPercent'>,
): { x: number; y: number } {
  const descendT = clamp(claw.descendT ?? 0, 0, 1)
  const stackStopLift = claw.clawLiftPercent ?? 0
  const liftAboveFootprint = lerp(GAME3_CLAW.cableVisualLift, stackStopLift, descendT)
  const rigHeightPercent = getGame3ClawRigHeightPercent()
  const rigTopY = GAME3_CLAW.playY - liftAboveFootprint - rigHeightPercent * 0.88
  const tipY = rigTopY + rigHeightPercent * GAME2_CLAW.rigTipYFrac

  return { x: claw.xPercent, y: tipY }
}

/** 바닥 인형 렌더 중심 y (발 위치 − 높이/2, world %) */
export function getGame3DollCenterY(stackLevel: 0 | 1) {
  return getGame3DollVisualY(stackLevel) - getGame3DollHeightPercent() / 2
}

/**
 * 잡는 순간 집게에 붙는 인형 기본 중심 (world %).
 * CSS(.g2-claw--carrying.g2-claw--closed: top rigTipYFrac, translate -42%)와 동기.
 * 히트박스용 rig 높이(×0.52)가 아니라 실제 렌더 rig 높이를 쓴다.
 */
export function getGame3HeldDollAttachCenter(
  claw: Pick<Game2ClawState, 'xPercent' | 'descendT' | 'clawLiftPercent'>,
): { x: number; y: number } {
  const render = getGame3ClawRender(
    claw.xPercent,
    clamp(claw.descendT ?? 0, 0, 1),
    claw.clawLiftPercent ?? 0,
  )
  const rigHeightVisual = getGame3ClawRigHeightPercentVisual()
  const dollHeightPercent = getGame3DollHeightPercent()
  const rigTopY = render.cableLengthPercent

  return {
    x: claw.xPercent,
    y:
      rigTopY +
      rigHeightVisual * GAME2_CLAW.rigTipYFrac +
      dollHeightPercent * 0.08 * GAME3_CLAW.rigVisualScale,
  }
}

/** 잡는 순간 인형 위치 유지용 오프셋 (playfield %) */
export function getGame3HeldDollOffsets(
  claw: Pick<Game2ClawState, 'xPercent' | 'descendT' | 'clawLiftPercent'>,
  doll: Game3DollState,
): { heldOffsetX: number; heldOffsetY: number } {
  const attach = getGame3HeldDollAttachCenter(claw)

  return {
    heldOffsetX: doll.xPercent - attach.x,
    heldOffsetY: getGame3DollCenterY(doll.stackLevel) - attach.y,
  }
}

/** 배출구에서 집게가 벌릴 때 인형 낙하 시작점 (world %) */
export function getGame3HeldDollReleasePoint(
  claw: Pick<
    Game2ClawState,
    'xPercent' | 'descendT' | 'clawLiftPercent' | 'heldOffsetX' | 'heldOffsetY'
  >,
): { xPercent: number; visualY: number } {
  const attach = getGame3HeldDollAttachCenter(claw)
  return {
    xPercent: attach.x + claw.heldOffsetX,
    visualY: attach.y + claw.heldOffsetY,
  }
}

/** 2D 가로 world — Game2Claw 렌더 보정 */
export function getGame3ClawRender(
  xPercent: number,
  descendT: number,
  liftPercent = 0,
): Game2ClawRender {
  const { rigWidth } = GAME2_CLAW
  const scale = GAME3_CLAW.rigVisualScale
  const { cableVisualLift, playY } = GAME3_CLAW
  const depthScale = 1
  const rigWidthPercent = (rigWidth * scale) / GAME3_WORLD.widthScale
  const rigHeightPercent = getGame3ClawRigHeightPercent()
  const stackStopLift = liftPercent
  const liftAboveFootprint = lerp(cableVisualLift, stackStopLift, descendT)
  const rigTopY = playY - liftAboveFootprint - rigHeightPercent * 0.88
  const cableLengthPercent = Math.max(1.5, rigTopY)

  return {
    xPercent,
    cableLengthPercent,
    depthScale,
    rigWidthPercent,
    depthT: 1,
  }
}
