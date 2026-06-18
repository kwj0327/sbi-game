import { GAME2_CLAW, GAME2_CLAW_POSE } from './game2Config'
import { GAME3_CLAW, GAME3_DOLLS, GAME3_GRAB, GAME3_WORLD } from './game3Config'
import type { Game3DollState } from './game3PlayArea'

type Rect = { left: number; top: number; right: number; bottom: number }

/** rig 로컬 레이아웃 — Game2Claw CSS와 동일 */
const RIG = {
  bodyTop: 0.18,
  bodyBottom: 0.42,
  bodyHalfWidth: 0.19,
  armTop: 0.37,
  armHeight: 0.76,
  armLeftX: 0.31,
  armRightX: 0.69,
  barHalfWidth: 0.025,
} as const

const MAX_IDLE_LIFT = GAME3_CLAW.cableVisualLift

export type Game3DescentStop = {
  /** 하강 종료 시 clawLiftPercent (클수록 덜 내려감) */
  clawLiftPercent: number
  /** 충돌로 잡히는 인형 (없으면 null) */
  hitDoll: Game3DollState | null
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function getGame3ClawRigHeightPercent() {
  const { rigWidth } = GAME2_CLAW
  const scale = GAME3_CLAW.rigVisualScale
  const worldAspect = GAME3_WORLD.width / GAME3_WORLD.height
  return rigWidth * scale * worldAspect * (380 / 319) * 0.52
}

function getGame3DollHeightPercent() {
  return (GAME3_DOLLS.emojiSizePx / GAME3_WORLD.height) * 100
}

function getGame3DollWidthPercent(rotateDeg: number) {
  const rad = (rotateDeg * Math.PI) / 180
  const boxPercent =
    (GAME3_DOLLS.emojiSizePx / (GAME3_WORLD.width * GAME3_WORLD.widthScale)) * 100
  return boxPercent * (Math.abs(Math.cos(rad)) + Math.abs(Math.sin(rad))) * 1.06
}

function getGame3DollVisualY(stackLevel: 0 | 1) {
  return GAME3_WORLD.floorY - stackLevel * GAME3_DOLLS.stackLiftY
}

function rectsOverlap(a: Rect, b: Rect) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
}

function getGame3OpenClawPose() {
  const open = GAME2_CLAW_POSE.open
  const lower = GAME3_CLAW.idleLowerArmDeg
  return {
    armLeft: open.armLeft,
    armRight: open.armRight,
    lowerLeft: -lower,
    lowerRight: lower,
    jointTopFrac: open.jointTop / 100,
  }
}

function getGame3RigWidthPercent() {
  return (GAME2_CLAW.rigWidth * GAME3_CLAW.rigVisualScale) / GAME3_WORLD.widthScale
}

function getRigFrame(clawXPercent: number, clawLiftPercent: number) {
  const rigH = getGame3ClawRigHeightPercent()
  const rigW = getGame3RigWidthPercent()
  const rigTopY = GAME3_CLAW.playY - clawLiftPercent - rigH * 0.88
  const rigLeftX = clawXPercent - rigW / 2
  return { rigTopY, rigH, rigW, rigLeftX }
}

function toWorld(
  frame: ReturnType<typeof getRigFrame>,
  localX: number,
  localY: number,
): { x: number; y: number } {
  return {
    x: frame.rigLeftX + localX * frame.rigW,
    y: frame.rigTopY + localY * frame.rigH,
  }
}

function rectFromPoints(points: { x: number; y: number }[], padX: number, padY: number): Rect {
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  return {
    left: Math.min(...xs) - padX,
    right: Math.max(...xs) + padX,
    top: Math.min(...ys) - padY,
    bottom: Math.max(...ys) + padY,
  }
}

/** CSS rotate(deg) — 아래(0,1)에서 시계 방향 */
function tipFromPivot(
  pivotX: number,
  pivotY: number,
  length: number,
  angleDeg: number,
): { x: number; y: number } {
  // CSS transform: rotate(deg)는 시계방향이라 아래(0,1) 벡터가 (-sin, cos)로 간다.
  // 렌더(CSS)와 좌우가 일치하도록 x는 -sin을 쓴다.
  const rad = (angleDeg * Math.PI) / 180
  return {
    x: pivotX - length * Math.sin(rad),
    y: pivotY + length * Math.cos(rad),
  }
}

function getArmSegmentRects(
  frame: ReturnType<typeof getRigFrame>,
  pivotLocalX: number,
  shoulderDeg: number,
  elbowDeg: number,
  jointTopFrac: number,
): { upper: Rect; lower: Rect } {
  const padX = frame.rigW * RIG.barHalfWidth
  const padY = frame.rigH * 0.02

  const pivot = toWorld(frame, pivotLocalX, RIG.armTop)
  const upperLen = jointTopFrac * RIG.armHeight
  const lowerLen = (1 - jointTopFrac + 0.04) * RIG.armHeight

  const jointLocal = tipFromPivot(pivotLocalX, RIG.armTop, upperLen, shoulderDeg)
  const joint = toWorld(frame, jointLocal.x, jointLocal.y)

  const tipLocal = tipFromPivot(jointLocal.x, jointLocal.y, lowerLen, shoulderDeg + elbowDeg)
  const tip = toWorld(frame, tipLocal.x, tipLocal.y)

  return {
    upper: rectFromPoints([pivot, joint], padX, padY),
    lower: rectFromPoints([joint, tip], padX, padY),
  }
}

function getArmTipWorld(
  frame: ReturnType<typeof getRigFrame>,
  pivotLocalX: number,
  shoulderDeg: number,
  elbowDeg: number,
  jointTopFrac: number,
): { x: number; y: number } {
  const upperLen = jointTopFrac * RIG.armHeight
  const lowerLen = (1 - jointTopFrac + 0.04) * RIG.armHeight
  const jointLocal = tipFromPivot(pivotLocalX, RIG.armTop, upperLen, shoulderDeg)
  const tipLocal = tipFromPivot(jointLocal.x, jointLocal.y, lowerLen, shoulderDeg + elbowDeg)
  return toWorld(frame, tipLocal.x, tipLocal.y)
}

/** gripTLeft/TRight 포즈에서 양쪽 팁 안쪽 x (world %) */
export function getGame3ClawTipInnerXPercent(
  clawXPercent: number,
  clawLiftPercent: number,
  gripTLeft: number,
  gripTRight: number,
): { left: number; right: number } {
  const frame = getRigFrame(clawXPercent, clawLiftPercent)
  const opened = GAME2_CLAW_POSE.open
  const tl = clamp(gripTLeft, 0, 1)
  const tr = clamp(gripTRight, 0, 1)
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t
  // 어깨·관절 고정, 다리(아랫팔)만 gripT로 움직임 (lerpClawPoseSplit와 동기)
  const jointTopFrac = opened.jointTop / 100

  const leftTip = getArmTipWorld(
    frame,
    RIG.armLeftX,
    opened.armLeft,
    lerp(GAME3_GRAB.lowerClosedLeftDeg, opened.lowerLeft, tl),
    jointTopFrac,
  )
  const rightTip = getArmTipWorld(
    frame,
    RIG.armRightX,
    opened.armRight,
    lerp(GAME3_GRAB.lowerClosedRightDeg, opened.lowerRight, tr),
    jointTopFrac,
  )

  const tipInset = frame.rigW * 0.028
  return { left: leftTip.x + tipInset, right: rightTip.x - tipInset }
}

/** gripTLeft/TRight 포즈에서 양쪽 팁 끝 (x, y) world % — 인형 실루엣 충돌 판정용 */
export function getGame3ClawTipPoints(
  clawXPercent: number,
  clawLiftPercent: number,
  gripTLeft: number,
  gripTRight: number,
): { left: { x: number; y: number }; right: { x: number; y: number } } {
  const frame = getRigFrame(clawXPercent, clawLiftPercent)
  const opened = GAME2_CLAW_POSE.open
  const tl = clamp(gripTLeft, 0, 1)
  const tr = clamp(gripTRight, 0, 1)
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t
  // 어깨·관절 고정, 다리(아랫팔)만 gripT로 움직임 (lerpClawPoseSplit와 동기)
  const jointTopFrac = opened.jointTop / 100

  const left = getArmTipWorld(
    frame,
    RIG.armLeftX,
    opened.armLeft,
    lerp(GAME3_GRAB.lowerClosedLeftDeg, opened.lowerLeft, tl),
    jointTopFrac,
  )
  const right = getArmTipWorld(
    frame,
    RIG.armRightX,
    opened.armRight,
    lerp(GAME3_GRAB.lowerClosedRightDeg, opened.lowerRight, tr),
    jointTopFrac,
  )
  return { left, right }
}

export type Game3ClawHitboxes = {
  body: Rect
  leftUpper: Rect
  leftLower: Rect
  rightUpper: Rect
  rightLower: Rect
}

/** 벌린 상태(open) 기준 — 하강 중 집게 부품 AABB (world %) */
export function getGame3ClawHitboxes(
  clawXPercent: number,
  clawLiftPercent: number,
): Game3ClawHitboxes {
  const frame = getRigFrame(clawXPercent, clawLiftPercent)
  const pose = getGame3OpenClawPose()

  const bodyLeft = 0.5 - RIG.bodyHalfWidth
  const bodyRight = 0.5 + RIG.bodyHalfWidth
  const body = rectFromPoints(
    [toWorld(frame, bodyLeft, RIG.bodyTop), toWorld(frame, bodyRight, RIG.bodyBottom)],
    frame.rigW * 0.01,
    frame.rigH * 0.01,
  )

  const left = getArmSegmentRects(
    frame,
    RIG.armLeftX,
    pose.armLeft,
    pose.lowerLeft,
    pose.jointTopFrac,
  )
  const right = getArmSegmentRects(
    frame,
    RIG.armRightX,
    pose.armRight,
    pose.lowerRight,
    pose.jointTopFrac,
  )

  return {
    body,
    leftUpper: left.upper,
    leftLower: left.lower,
    rightUpper: right.upper,
    rightLower: right.lower,
  }
}

/**
 * 임의 그립(gripTLeft/Right)에서 좌·우 다리(아랫팔) 박스 (world %).
 * 어깨·관절 고정, 다리만 gripT로 움직임 — 렌더(lerpClawPoseSplit)와 동기.
 */
export function getGame3LowerLegRects(
  clawXPercent: number,
  clawLiftPercent: number,
  gripTLeft: number,
  gripTRight: number,
): { left: Rect; right: Rect } {
  const frame = getRigFrame(clawXPercent, clawLiftPercent)
  const opened = GAME2_CLAW_POSE.open
  const tl = clamp(gripTLeft, 0, 1)
  const tr = clamp(gripTRight, 0, 1)
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t
  const jointTopFrac = opened.jointTop / 100

  const left = getArmSegmentRects(
    frame,
    RIG.armLeftX,
    opened.armLeft,
    lerp(GAME3_GRAB.lowerClosedLeftDeg, opened.lowerLeft, tl),
    jointTopFrac,
  )
  const right = getArmSegmentRects(
    frame,
    RIG.armRightX,
    opened.armRight,
    lerp(GAME3_GRAB.lowerClosedRightDeg, opened.lowerRight, tr),
    jointTopFrac,
  )
  return { left: left.lower, right: right.lower }
}

export type Game3Rect = Rect

function getRedPartRects(boxes: Game3ClawHitboxes): Rect[] {
  return [boxes.leftUpper, boxes.leftLower, boxes.rightUpper, boxes.rightLower]
}

function getGrabPartRects(boxes: Game3ClawHitboxes): Rect[] {
  return [boxes.body, ...getRedPartRects(boxes)]
}

function getDollRect(doll: Game3DollState): Rect {
  const halfW = getGame3DollWidthPercent(doll.rotateDeg) / 2
  const feetY = getGame3DollVisualY(doll.stackLevel)
  const height = getGame3DollHeightPercent()
  return {
    left: doll.xPercent - halfW,
    right: doll.xPercent + halfW,
    top: feetY - height,
    bottom: feetY,
  }
}

function redPartsWithinFloor(clawXPercent: number, clawLiftPercent: number) {
  const boxes = getGame3ClawHitboxes(clawXPercent, clawLiftPercent)
  const floorY = GAME3_WORLD.floorY
  return getRedPartRects(boxes).every((rect) => rect.bottom <= floorY + 0.05)
}

function findFloorLimitLift(clawXPercent: number) {
  if (redPartsWithinFloor(clawXPercent, 0)) return 0

  let lo = 0
  let hi: number = MAX_IDLE_LIFT
  while (hi - lo > 0.05) {
    const mid = (lo + hi) / 2
    if (redPartsWithinFloor(clawXPercent, mid)) hi = mid
    else lo = mid
  }
  return hi
}

function clawTouchesDoll(clawXPercent: number, clawLiftPercent: number, doll: Game3DollState) {
  const boxes = getGame3ClawHitboxes(clawXPercent, clawLiftPercent)
  const dollRect = getDollRect(doll)
  return getGrabPartRects(boxes).some((rect) => rectsOverlap(rect, dollRect))
}

/** 하강 시 가장 먼저 닿는 인형의 멈춤 lift (없으면 null) */
function findDollContactLift(
  clawXPercent: number,
  dolls: readonly Game3DollState[],
  minLift: number,
): { lift: number; doll: Game3DollState } | null {
  const candidates = dolls.filter((doll) => !doll.captured && !doll.falling)
  let best: { lift: number; doll: Game3DollState } | null = null

  for (const doll of candidates) {
    if (!clawTouchesDoll(clawXPercent, minLift, doll)) continue

    let lo = minLift
    let hi: number = MAX_IDLE_LIFT

    while (hi - lo > 0.05) {
      const mid = (lo + hi) / 2
      if (clawTouchesDoll(clawXPercent, mid, doll)) lo = mid
      else hi = mid
    }

    if (!best || lo > best.lift) {
      best = { lift: lo, doll }
    } else if (lo === best.lift) {
      if (doll.stackLevel > best.doll.stackLevel) best = { lift: lo, doll }
      else if (
        doll.stackLevel === best.doll.stackLevel &&
        Math.abs(doll.xPercent - clawXPercent) <
          Math.abs(best.doll.xPercent - clawXPercent)
      ) {
        best = { lift: lo, doll }
      }
    }
  }

  return best
}

/**
 * 2D 하강 종료점 — 빨간 다리가 바닥(floorY)을 넘지 않고,
 * 빨간/초록 부품이 인형에 닿으면 그 위치에서 멈춤.
 */
export function resolveGame3DescentStop(
  clawXPercent: number,
  dolls: readonly Game3DollState[],
): Game3DescentStop {
  const floorLift = findFloorLimitLift(clawXPercent)
  const dollHit = findDollContactLift(clawXPercent, dolls, floorLift)

  if (dollHit) {
    return {
      clawLiftPercent: clamp(dollHit.lift, floorLift, MAX_IDLE_LIFT),
      hitDoll: dollHit.doll,
    }
  }

  return {
    clawLiftPercent: floorLift,
    hitDoll: null,
  }
}
