import { GAME2_CLAW, GAME2_CLAW_POSE, type Game2ClawState } from './game2Config'
import type { Game2ClawRender } from './game2PlayArea'
import { GAME3_CLAW, GAME3_DOLLS, GAME3_CHUTE, GAME3_GUIDE, GAME3_WORLD } from './game3Config'

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

function getGame3ClawRigHeightPercent() {
  const { rigWidth } = GAME2_CLAW
  const scale = GAME3_CLAW.rigVisualScale
  const worldAspect = GAME3_WORLD.width / GAME3_WORLD.height
  return rigWidth * scale * worldAspect * (380 / 319) * 0.52
}

function getGame3ClawRigWidthPx() {
  const worldWidth = GAME3_WORLD.width * GAME3_WORLD.widthScale
  return (
    ((GAME2_CLAW.rigWidth * GAME3_CLAW.rigVisualScale) / GAME3_WORLD.widthScale / 100) *
    worldWidth
  )
}

function getGame3ClawTipGapFrac(gripT: number): number {
  const closed = GAME2_CLAW_POSE.closed
  const opened = GAME2_CLAW_POSE.open
  const t = clamp(gripT, 0, 1)

  const armDeg = lerp(closed.armLeft, opened.armLeft, t)
  const lowerDeg = lerp(closed.lowerLeft, opened.lowerLeft, t)
  const jointTopFrac = lerp(closed.jointTop, opened.jointTop, t) / 100

  const armLen = G3_CLAW_RIG.armHeightFrac * G3_CLAW_RIG.aspectHOverW
  const upperLen = jointTopFrac * armLen
  const lowerLen = (1 - jointTopFrac + G3_CLAW_RIG.lowerExtraFrac) * armLen

  const armRad = (armDeg * Math.PI) / 180
  const tipRad = ((armDeg + lowerDeg) * Math.PI) / 180
  const offsetLeft = upperLen * -Math.sin(armRad) + lowerLen * -Math.sin(tipRad)

  const centerGap = (1 - 2 * G3_CLAW_RIG.pivotXFrac) - 2 * offsetLeft
  return centerGap - 2 * G3_CLAW_RIG.tipHalfWidthFrac
}

/** 인형 실루엣 가로 폭 (디자인 px) — 집게 오므림 계산용 */
function getGame3DollGrabWidthPx(rotateDeg: number) {
  const rad = (rotateDeg * Math.PI) / 180
  const box = GAME3_DOLLS.emojiSizePx
  const span = box * (Math.abs(Math.cos(rad)) + Math.abs(Math.sin(rad)))
  return span * 0.58
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

/** 집게 x 아래 더미 꼭대기 — 인형에 닿을 때까지 하강 (world % lift) */
export function getGame3StackLiftAt(
  dolls: readonly Game3DollState[],
  clawXPercent: number,
): number {
  const target = findGame3GrabTarget(dolls, clawXPercent)
  if (!target) return 0

  const feetY = getGame3DollVisualY(target.stackLevel)
  // 인형 상단 근처(머리)에서 집게가 멈춰 잡도록 — 바닥까지 더 내려가지 않음
  const contactY = feetY - getGame3DollHeightPercent() * GAME3_DOLLS.grabContactHeightFrac
  const rigHeightPercent = getGame3ClawRigHeightPercent()
  const rigTipOffset = rigHeightPercent * (GAME2_CLAW.rigTipYFrac - 0.88)
  const stackStopLift = GAME3_CLAW.playY + rigTipOffset - contactY

  return Math.max(0, stackStopLift)
}

/** 인형 테두리 두께에 맞는 집게 오므림 gripT (0=완전 닫힘, 1=완전 벌림) */
export function getGame3GripTForDoll(doll: Game3DollState): number {
  const widthPx = getGame3DollGrabWidthPx(doll.rotateDeg)
  const targetGapPx = Math.max(0, widthPx - GAME3_DOLLS.gripSqueezePx)
  const rigWidthPx = getGame3ClawRigWidthPx()
  const targetGapFrac = Math.max(0, targetGapPx) / rigWidthPx

  if (targetGapFrac <= getGame3ClawTipGapFrac(0)) return 0
  if (targetGapFrac >= getGame3ClawTipGapFrac(1)) return 1

  let lo = 0
  let hi = 1
  for (let i = 0; i < 24; i += 1) {
    const mid = (lo + hi) / 2
    if (getGame3ClawTipGapFrac(mid) < targetGapFrac) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

/** 집게 팁 위치 (world %) — 잡은 인형 오프셋 계산용 */
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

/** 잡는 순간 인형 위치 유지용 오프셋 (playfield %) */
export function getGame3HeldDollOffsets(
  claw: Pick<Game2ClawState, 'xPercent' | 'descendT' | 'clawLiftPercent'>,
  doll: Game3DollState,
): { heldOffsetX: number; heldOffsetY: number } {
  const attach = getGame3ClawTipPoint(claw)
  const grabY =
    getGame3DollVisualY(doll.stackLevel) -
    getGame3DollHeightPercent() * GAME3_DOLLS.grabContactHeightFrac

  return {
    heldOffsetX: doll.xPercent - attach.x,
    heldOffsetY: grabY - attach.y,
  }
}

/** 배출구에서 집게가 벌릴 때 인형 낙하 시작점 (world %) */
export function getGame3HeldDollReleasePoint(
  claw: Pick<
    Game2ClawState,
    'xPercent' | 'descendT' | 'clawLiftPercent' | 'heldOffsetX' | 'heldOffsetY'
  >,
): { xPercent: number; visualY: number } {
  const attach = getGame3ClawTipPoint(claw)
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
