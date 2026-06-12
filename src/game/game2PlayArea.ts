import {
  GAME2_CLAW,
  GAME2_CLAW_ZONE,
  GAME2_CLAW_ZONE_CHUTE_CUTOUT,
  GAME2_CHUTE_ZONE,
  GAME2_DOLLS,
  GAME2_DEV_CENTER_SPAWN,
  GAME2_DOLL_ZONE_CHUTE_CUTOUT,
  GAME2_FLOOR,
  GAME2_CLAW_POSE,
  GAME2_CLOSE_SIM,
  GAME2_GRAB,
  GAME2_GRIP,
  GAME2_PLAY_GRID,
  GAME2_STAGE,
  type Game2ClawState,
} from './game2Config'
import { getDollAlphaMask, sampleDollAlpha } from './dollAlphaMask'

/**
 * Game 2 바닥 영역 geometry
 *
 * 🟡 GAME2_CHUTE_ZONE — 배출구
 * 🔴 GAME2_DOLL_ZONE — 인형 배치·존재·집기
 * 🟢 GAME2_CLAW_ZONE — 집게 idle 이동·좌표 클램프
 */
export type Game2Point = { x: number; y: number }

export type Game2PlayGridCell = {
  id: number
  row: number
  col: number
  corners: [Game2Point, Game2Point, Game2Point, Game2Point]
  center: Game2Point
}

export type Game2PlayPosition = Game2Point

export type Game2ClawRender = {
  xPercent: number
  cableLengthPercent: number
  depthScale: number
  rigWidthPercent: number
  depthT: number
}

/** 바닥 착지 위치 표시 (테트리스 고스트) */
export type Game2ClawFloorMarker = {
  xPercent: number
  yPercent: number
  widthPercent: number
  heightPercent: number
}

type ChuteConfig = {
  centerX: number
  centerY: number
  width: number
  height: number
}

type TrapezoidFloorConfig = {
  backY: number
  frontY: number
  backLeftX: number
  backRightX: number
  frontLeftX: number
  frontRightX: number
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function lerpX(x1: number, y1: number, x2: number, y2: number, y: number) {
  return x1 + ((x2 - x1) * (y - y1)) / (y2 - y1)
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function getChuteBounds(chute: ChuteConfig) {
  const { centerX, centerY, width, height } = chute
  const leftX = centerX - width / 2
  const rightX = centerX + width / 2
  const topY = centerY - height / 2
  const bottomY = centerY + height / 2

  return { leftX, topY, rightX, bottomY, width, height, centerX, centerY }
}

function buildTrapezoidZoneOutline(
  floor: TrapezoidFloorConfig,
  chuteCutout: ChuteConfig,
): Game2Point[] {
  const { backY, frontY, backLeftX, backRightX, frontLeftX, frontRightX } = floor
  const { leftX, topY, rightX } = getChuteBounds(chuteCutout)

  const leftMeetX = lerpX(backLeftX, backY, frontLeftX, frontY, topY)

  const points: Game2Point[] = [
    { x: backLeftX, y: backY },
    { x: backRightX, y: backY },
    { x: frontRightX, y: frontY },
    { x: rightX, y: frontY },
    { x: rightX, y: topY },
    { x: leftX, y: topY },
  ]

  if (leftMeetX > leftX) {
    points.push({ x: leftMeetX, y: topY })
  }

  points.push({ x: backLeftX, y: backY })

  return points
}

function isPointInPolygon(point: Game2Point, polygon: Game2Point[]) {
  let inside = false

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const xi = polygon[i].x
    const yi = polygon[i].y
    const xj = polygon[j].x
    const yj = polygon[j].y
    const intersects =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi

    if (intersects) inside = !inside
  }

  return inside
}

/** 🔴 인형 영역 안인지 */
export function isPointInDollZone(point: Game2Point) {
  return isPointInPolygon(point, getGame2DollZoneOutline())
}

/** 🟢 집게 이동 영역 안인지 */
export function isPointInClawZone(point: Game2Point) {
  return isPointInPolygon(point, getGame2ClawZoneOutline())
}

/** @deprecated isPointInDollZone 사용 */
export function isPointInPlayArea(point: Game2Point) {
  return isPointInDollZone(point)
}

function getZoneSpanAtY(
  y: number,
  floor: TrapezoidFloorConfig,
  chuteCutout: ChuteConfig,
) {
  const { backY, frontY, backLeftX, backRightX, frontLeftX, frontRightX } = floor
  const { topY, rightX: chuteRightX } = getChuteBounds(chuteCutout)
  const leftMeetX = lerpX(backLeftX, backY, frontLeftX, frontY, topY)
  const rightX = lerpX(backRightX, backY, frontRightX, frontY, y)
  const leftX = y <= topY ? lerpX(backLeftX, backY, leftMeetX, topY, y) : chuteRightX

  return { leftX, rightX }
}

/** 🔴 인형 영역 — y 높이에서 좌·우 x (원근) */
function getDollZoneSpanAtY(y: number) {
  return getZoneSpanAtY(y, GAME2_FLOOR, GAME2_DOLL_ZONE_CHUTE_CUTOUT)
}

/** 🟢 집게 이동 영역 — y 높이에서 좌·우 x (원근) */
function getClawZoneSpanAtY(y: number) {
  return getZoneSpanAtY(y, GAME2_CLAW_ZONE.floor, GAME2_CLAW_ZONE_CHUTE_CUTOUT)
}

/** depth y → 0(뒤) … 1(앞). 집게 렌더 기본은 claw zone, 인형은 doll zone floor 전달 */
export function getPlayDepthT(y: number, floor: TrapezoidFloorConfig = GAME2_CLAW_ZONE.floor) {
  const { backY, frontY } = floor
  return clamp((y - backY) / (frontY - backY), 0, 1)
}

function slideWithinZone(
  from: Game2PlayPosition,
  to: Game2PlayPosition,
  isInside: (point: Game2Point) => boolean,
  nearestOnY: (position: Game2PlayPosition) => Game2PlayPosition,
): Game2PlayPosition {
  if (isInside(to)) return to
  if (!isInside(from)) return nearestOnY(from)

  let t0 = 0
  let t1 = 1

  for (let i = 0; i < 14; i += 1) {
    const tm = (t0 + t1) / 2
    const probe = {
      x: lerp(from.x, to.x, tm),
      y: lerp(from.y, to.y, tm),
    }

    if (isInside(probe)) t0 = tm
    else t1 = tm
  }

  return {
    x: lerp(from.x, to.x, t0),
    y: lerp(from.y, to.y, t0),
  }
}

function nearestPositionOnYInZone(
  position: Game2PlayPosition,
  floor: TrapezoidFloorConfig,
  getSpanAtY: (y: number) => { leftX: number; rightX: number },
  isInside: (point: Game2Point) => boolean,
): Game2PlayPosition {
  const { backY, frontY } = floor
  const y = clamp(position.y, backY, frontY)
  const { leftX, rightX } = getSpanAtY(y)

  if (isInside({ x: position.x, y })) {
    return { x: position.x, y }
  }

  let best: Game2PlayPosition | null = null
  let bestDist = Infinity

  for (let x = leftX; x <= rightX; x += 0.4) {
    const candidate = { x, y }
    if (!isInside(candidate)) continue

    const dist = Math.abs(x - position.x)
    if (dist < bestDist) {
      bestDist = dist
      best = candidate
    }
  }

  if (best) return best

  const x = clamp(position.x, leftX, rightX)
  return { x, y }
}

function nearestClawPositionOnY(position: Game2PlayPosition): Game2PlayPosition {
  return nearestPositionOnYInZone(
    position,
    GAME2_CLAW_ZONE.floor,
    getClawZoneSpanAtY,
    isPointInClawZone,
  )
}

function nearestDollPositionOnY(position: Game2PlayPosition): Game2PlayPosition {
  return nearestPositionOnYInZone(
    position,
    GAME2_FLOOR,
    getDollZoneSpanAtY,
    isPointInDollZone,
  )
}

/** 🟢 집게 이동 영역 안으로 좌표 고정 */
export function clampClawPosition(position: Game2PlayPosition): Game2PlayPosition {
  if (isPointInClawZone(position)) return position
  return nearestClawPositionOnY(position)
}

/** 🔴 인형 영역 안으로 좌표 고정 */
export function clampDollPosition(position: Game2PlayPosition): Game2PlayPosition {
  if (isPointInDollZone(position)) return position
  return nearestDollPositionOnY(position)
}

/** @deprecated clampDollPosition — 인형용 */
export function clampPlayPosition(position: Game2PlayPosition): Game2PlayPosition {
  return clampDollPosition(position)
}

/** 🟢 집게 idle 이동 — claw zone 경계에서 멈춤 */
export function movePlayPosition(
  position: Game2PlayPosition,
  direction: 'up' | 'down' | 'left' | 'right',
): Game2PlayPosition {
  const { moveStepX, moveStepY } = GAME2_CLAW
  const next = { ...position }

  switch (direction) {
    case 'left':
      next.x -= moveStepX
      break
    case 'right':
      next.x += moveStepX
      break
    case 'up':
      next.y -= moveStepY
      break
    case 'down':
      next.y += moveStepY
      break
  }

  return slideWithinZone(position, next, isPointInClawZone, nearestClawPositionOnY)
}

type ClawRenderOptions = {
  /** 0(공중) … 1(바닥). cableVisualLift를 보간해 하강 표현 */
  descendT?: number
}

/** play 좌표 → 집게 렌더링 (케이블·원근 스케일) */
export function getClawRenderFromPlayPosition(
  position: Game2PlayPosition,
  options: ClawRenderOptions = {},
): Game2ClawRender {
  const { railY, rigWidth, perspectiveScaleBack, perspectiveScaleFront, cableVisualLift } =
    GAME2_CLAW
  const { viewWidth, viewHeight } = GAME2_STAGE
  const descendT = clamp(options.descendT ?? 0, 0, 1)
  const depthT = getPlayDepthT(position.y)
  const depthScale = lerp(perspectiveScaleBack, perspectiveScaleFront, depthT)

  const rigHeightPercent =
    rigWidth * depthScale * (viewWidth / viewHeight) * (380 / 319)
  const rigTopY = position.y - rigHeightPercent * 0.88
  const effectiveLift = cableVisualLift * (1 - descendT)
  const cableLengthPercent = Math.max(1.5, rigTopY - railY - effectiveLift)

  return {
    xPercent: position.x,
    cableLengthPercent,
    depthScale,
    rigWidthPercent: rigWidth,
    depthT,
  }
}

export type Game2HeldDollReleasePoint = Game2PlayPosition & {
  depthScale: number
}

/**
 * 잡는 순간 집게에 붙는 인형의 기본 중심 (playfield %).
 * CSS(.g2-claw__held-doll: carrying·closed 시 top 96%, translate -42%)와 동기.
 * 인형이 바닥 위치에서 움직이지 않도록 보정 오프셋을 계산할 때 사용.
 */
export function getHeldDollAttachCenter(
  claw: Pick<Game2ClawState, 'xPercent' | 'playY' | 'descendT'>,
): Game2PlayPosition {
  const render = getClawRenderFromPlayPosition(
    { x: claw.xPercent, y: claw.playY },
    { descendT: claw.descendT },
  )
  const { railY, rigWidth } = GAME2_CLAW
  const { viewWidth, viewHeight } = GAME2_STAGE
  const depthScale = render.depthScale

  const rigHeightPercent =
    rigWidth * depthScale * (viewWidth / viewHeight) * (380 / 319)
  const rigTopYPercent = railY + render.cableLengthPercent
  const dollHeightPercent = ((GAME2_DOLLS.emojiSizePx * depthScale) / viewHeight) * 100

  return {
    x: render.xPercent,
    // top 96% + translate(-42%) → 중심 = rigTop + 96%rigH + 8%dollH
    y: rigTopYPercent + rigHeightPercent * 0.96 + dollHeightPercent * 0.08,
  }
}

/** 집게에 붙은 인형 중심 — 낙하 시작점 (playfield %). DOM 측정 불가 시 폴백 */
export function getGame2HeldDollReleasePoint(
  claw: Pick<Game2ClawState, 'xPercent' | 'playY' | 'descendT'>,
  playfield?: { width: number; height: number; stageScale: number },
): Game2HeldDollReleasePoint {
  const render = getClawRenderFromPlayPosition(
    { x: claw.xPercent, y: claw.playY },
    { descendT: claw.descendT },
  )
  const { railY, rigWidth } = GAME2_CLAW
  const { viewWidth, viewHeight } = GAME2_STAGE
  const { emojiSizePx } = GAME2_DOLLS

  const depthScale = render.depthScale
  const rigHeightPercent =
    rigWidth * depthScale * (viewWidth / viewHeight) * (380 / 319)
  const rigTopYPercent = railY + render.cableLengthPercent
  /** .g2-claw--carrying.g2-claw--closed .g2-claw__held-doll top 96% */
  const heldTopRatio = 0.96

  if (playfield && playfield.width > 0 && playfield.height > 0) {
    const scale = playfield.stageScale > 0 ? playfield.stageScale : 1
    const rigTopPx = (rigTopYPercent / 100) * playfield.height
    const rigHeightPx = (rigHeightPercent / 100) * playfield.height
    const emojiPx = emojiSizePx * scale * depthScale
    const centerYPx = rigTopPx + rigHeightPx * heldTopRatio + emojiPx * 0.08

    return {
      x: render.xPercent,
      y: (centerYPx / playfield.height) * 100,
      depthScale,
    }
  }

  return {
    x: render.xPercent,
    y: rigTopYPercent + rigHeightPercent * (heldTopRatio + 0.02),
    depthScale,
  }
}

/** 렌더 직후 집게에 붙은 인형의 화면 중심 → playfield % (가장 정확) */
export function measureGame2HeldDollReleasePoint(
  playfieldEl: HTMLElement,
): Game2HeldDollReleasePoint | null {
  const held = playfieldEl.querySelector('.g2-claw__held-doll')
  if (!(held instanceof HTMLElement)) return null

  const playfieldRect = playfieldEl.getBoundingClientRect()
  if (playfieldRect.width <= 0 || playfieldRect.height <= 0) return null

  const heldRect = held.getBoundingClientRect()
  const centerX = heldRect.left + heldRect.width / 2
  const centerY = heldRect.top + heldRect.height / 2

  const stageScaleRaw = getComputedStyle(playfieldEl).getPropertyValue('--g2-stage-scale').trim()
  const stageScale = Number.parseFloat(stageScaleRaw) || 1
  const depthScale =
    heldRect.height > 0
      ? heldRect.height / (GAME2_DOLLS.emojiSizePx * stageScale)
      : getHeldDollDepthScale(
          ((centerY - playfieldRect.top) / playfieldRect.height) * 100,
        )

  return {
    x: ((centerX - playfieldRect.left) / playfieldRect.width) * 100,
    y: ((centerY - playfieldRect.top) / playfieldRect.height) * 100,
    depthScale,
  }
}

/** play 좌표 → 바닥 착지 마커 (원근에 맞춘 발자국 크기) */
export function getClawFloorMarkerFromPlayPosition(
  position: Game2PlayPosition,
): Game2ClawFloorMarker {
  const render = getClawRenderFromPlayPosition(position)
  const { viewWidth, viewHeight } = GAME2_STAGE
  const widthPercent = render.rigWidthPercent * render.depthScale * 0.4
  const heightPercent = widthPercent * (viewWidth / viewHeight) * 0.32

  return {
    xPercent: position.x,
    yPercent: position.y,
    widthPercent,
    heightPercent,
  }
}

/** 🔴 인형 영역 컷아웃(배출구) — stage % */
export function getGame2DollZoneChuteCutout() {
  return getChuteBounds(GAME2_DOLL_ZONE_CHUTE_CUTOUT)
}

/** @deprecated getGame2DollZoneChuteCutout */
export function getGame2PlayAreaChuteBounds() {
  return getGame2DollZoneChuteCutout()
}

/** 🟡 배출구 영역 bounds */
export function getGame2ChuteBounds() {
  return getChuteBounds(GAME2_CHUTE_ZONE)
}

/** 🔴 인형 영역 외곽 — stage % 시계 방향 */
export function getGame2DollZoneOutline(): Game2Point[] {
  return buildTrapezoidZoneOutline(GAME2_FLOOR, GAME2_DOLL_ZONE_CHUTE_CUTOUT)
}

/** 🟢 집게 이동 영역 외곽 — stage % 시계 방향 */
export function getGame2ClawZoneOutline(): Game2Point[] {
  return buildTrapezoidZoneOutline(GAME2_CLAW_ZONE.floor, GAME2_CLAW_ZONE_CHUTE_CUTOUT)
}

/** @deprecated getGame2ClawZoneOutline */
export function getGame2DollZoneOriginalOutline(): Game2Point[] {
  return getGame2ClawZoneOutline()
}

/** @deprecated getGame2DollZoneOutline */
export const getGame2PlayAreaOutline = getGame2DollZoneOutline

/**
 * 🔴 인형 영역 격자 — 원근 사다리꼴 타일 (stage %).
 * 중심이 인형 영역 다각형 안에 있는 칸만 번호 부여.
 */
export function getGame2PlayGridCells(): Game2PlayGridCell[] {
  const { backY, frontY } = GAME2_FLOOR
  const { cols, rows, rowSplits, chuteColCount, chuteColRowSplits } = GAME2_PLAY_GRID
  const outline = getGame2DollZoneOutline()
  const cells: Game2PlayGridCell[] = []
  let id = 1

  const depthToY = (depth: number) => lerp(backY, frontY, depth)

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const splits = col < chuteColCount ? chuteColRowSplits : rowSplits
      const y0 = depthToY(splits[row])
      const y1 = depthToY(splits[row + 1])
      const span0 = getDollZoneSpanAtY(y0)
      const span1 = getDollZoneSpanAtY(y1)

      const x0a = lerp(span0.leftX, span0.rightX, col / cols)
      const x1a = lerp(span0.leftX, span0.rightX, (col + 1) / cols)
      const x0b = lerp(span1.leftX, span1.rightX, col / cols)
      const x1b = lerp(span1.leftX, span1.rightX, (col + 1) / cols)

      const corners: [Game2Point, Game2Point, Game2Point, Game2Point] = [
        { x: x0a, y: y0 },
        { x: x1a, y: y0 },
        { x: x1b, y: y1 },
        { x: x0b, y: y1 },
      ]

      const center = {
        x: (x0a + x1a + x0b + x1b) / 4,
        y: (y0 + y1) / 2,
      }

      if (!isPointInPolygon(center, outline)) continue

      cells.push({ id, row, col, corners, center })
      id += 1
    }
  }

  return cells
}

export function getGame2PlayGridCell(id: number) {
  return getGame2PlayGridCells().find((cell) => cell.id === id)
}

/** 🔴 인형 영역 기하학적 중앙 (알고리즘·디버그용) */
export function getGame2DollZoneCenter(): Game2Point {
  const { backY, frontY } = GAME2_FLOOR
  const y = (backY + frontY) / 2
  const { leftX, rightX } = getDollZoneSpanAtY(y)
  return clampDollPosition({ x: (leftX + rightX) / 2, y })
}

/** 집게 시작 위치 — 분홍 격자 1번 칸 중심 (claw zone 기준) */
export function getDefaultGame2ClawState(): Game2ClawState {
  const cell = getGame2PlayGridCell(1)

  if (!cell) {
    return {
      xPercent: GAME2_CLAW.defaultX,
      playY: (GAME2_CLAW_ZONE.floor.backY + GAME2_CLAW_ZONE.floor.frontY) / 2,
      open: true,
      phase: 'idle',
      descendT: 0,
      heldDollId: null,
      gripT: 0,
      heldOffsetX: 0,
      heldOffsetY: 0,
      heldGripQuality: 1,
    }
  }

  const position = clampClawPosition({
    x: cell.center.x,
    y: cell.center.y,
  })

  return {
    xPercent: position.x,
    playY: position.y,
    open: true,
    phase: 'idle',
    descendT: 0,
    heldDollId: null,
    gripT: 0,
    heldOffsetX: 0,
    heldOffsetY: 0,
    heldGripQuality: 1,
  }
}

/** 집게 디폴트 play 좌표 (격자 1번 중심) */
export function getDefaultGame2PlayPosition(): Game2PlayPosition {
  const defaults = getDefaultGame2ClawState()
  return { x: defaults.xPercent, y: defaults.playY }
}

export function isClawMovementLocked(state: Game2ClawState) {
  return state.phase !== 'idle'
}

/** 🟡 배출구 영역 중심 — stage % */
export function getGame2ChuteCenter(): Game2Point {
  const { centerX, centerY } = getGame2ChuteBounds()
  return { x: centerX, y: centerY }
}

/**
 * 배출구 근접도 — 1: 배출구 바로 위 … 0: 인형 영역에서 가장 먼 곳.
 * 운반 중 낙하 확률 가중치에 사용 (가까울수록 잘 떨어짐).
 */
export function getChuteProximityT(point: Game2Point): number {
  const chute = getGame2ChuteCenter()
  const { viewWidth, viewHeight } = GAME2_STAGE

  const toPx = (p: Game2Point) => ({
    x: ((p.x - chute.x) / 100) * viewWidth,
    y: ((p.y - chute.y) / 100) * viewHeight,
  })

  const d = toPx(point)
  const dist = Math.hypot(d.x, d.y)

  // 기준 최대 거리 — 배출구에서 가장 먼 인형 영역 뒤쪽 모서리
  const { backY, backLeftX, backRightX, frontY, frontRightX } = GAME2_FLOOR
  let maxDist = 1
  for (const corner of [
    { x: backLeftX, y: backY },
    { x: backRightX, y: backY },
    { x: frontRightX, y: frontY },
  ]) {
    const c = toPx(corner)
    maxDist = Math.max(maxDist, Math.hypot(c.x, c.y))
  }

  return clamp(1 - dist / maxDist, 0, 1)
}

export function lerpPlayPosition(
  from: Game2PlayPosition,
  to: Game2PlayPosition,
  t: number,
): Game2PlayPosition {
  return {
    x: lerp(from.x, to.x, t),
    y: lerp(from.y, to.y, t),
  }
}

/** ease-out cubic — 0…1 */
export function easeOutCubic(t: number) {
  const clamped = clamp(t, 0, 1)
  return 1 - (1 - clamped) ** 3
}

/** 🟡 배출구 영역 사각형 꼭짓점 — 시계 방향, stage % */
export function getGame2ChuteOutline(): Game2Point[] {
  const { leftX, topY, rightX, bottomY } = getGame2ChuteBounds()

  return [
    { x: leftX, y: topY },
    { x: rightX, y: topY },
    { x: rightX, y: bottomY },
    { x: leftX, y: bottomY },
    { x: leftX, y: topY },
  ]
}

export type Game2DollPlacement = {
  id: number
  imageSrc: string
  xPercent: number
  playY: number
  depthScale: number
  rotateDeg: number
  faceScaleX: number
}

export type Game2DollState = Game2DollPlacement & {
  captured: boolean
  falling: boolean
  /** 낙하 종류 — 'chute': 배출구로 사라짐, 'floor': 바닥에 떨어져 남음 */
  fallKind?: 'chute' | 'floor'
  /** 바닥 낙하 목표 (playfield %) */
  fallTargetXPercent?: number
  fallTargetPlayY?: number
  /** 바닥 착지 시 최종 회전 (deg) */
  fallEndRotateDeg?: number
}

export function createInitialGame2Dolls(images: readonly string[]): Game2DollState[] {
  return generateGame2DollPlacements(images.length, images).map((doll) => ({
    ...doll,
    captured: false,
    falling: false,
  }))
}

/** 착지 시 가장 가까운 미배출 인형 id (반경 밖이면 null) */
export function tryGrabNearestDoll(
  claw: Game2PlayPosition,
  dolls: readonly Game2DollState[],
  maxRadius = GAME2_GRAB.maxRadius,
): number | null {
  let best: { id: number; dist: number } | null = null

  for (const doll of dolls) {
    if (doll.captured) continue

    const dx = doll.xPercent - claw.x
    const dy = doll.playY - claw.y
    const dist = Math.hypot(dx, dy)
    if (dist > maxRadius) continue

    if (!best || dist < best.dist) {
      best = { id: doll.id, dist }
    }
  }

  return best?.id ?? null
}

/**
 * stage % 좌표 → 인형 렌더 박스 내 (u, v) ∈ [0,1]².
 *
 * 렌더와 동일한 변환을 역으로 적용:
 * translate(center) → scale(depthScale·faceScaleX, depthScale) → rotate(rotateDeg)
 * (CSS 행렬 T·S·R이므로 역은 R⁻¹·S⁻¹·T⁻¹ 순)
 */
function stagePointToDollBoxUV(
  point: Game2Point,
  doll: Game2DollPlacement,
): { u: number; v: number } {
  const { viewWidth, viewHeight } = GAME2_STAGE
  const boxPx = GAME2_DOLLS.emojiSizePx

  // stage % → 디자인 px (가로·세로 비율이 달라 px로 통일)
  const dx = ((point.x - doll.xPercent) / 100) * viewWidth
  const dy = ((point.y - doll.playY) / 100) * viewHeight

  const sx = dx / (doll.depthScale * doll.faceScaleX)
  const sy = dy / doll.depthScale

  const rad = (-doll.rotateDeg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const lx = sx * cos - sy * sin
  const ly = sx * sin + sy * cos

  return {
    u: lx / boxPx + 0.5,
    v: ly / boxPx + 0.5,
  }
}

/** 착지점 기준 부위의 가로 구간 (디자인 px, 0 = 집게 중심) */
export type GrabbedPartInterval = {
  startPx: number
  endPx: number
}

/**
 * 착지점의 y 높이에서 x축을 따라 알파 마스크를 스캔해,
 * 착지점이 속한(또는 팁 반경 안에서 가장 가까운) 불투명 구간을 찾는다.
 * 집게가 가로로 오므리므로 이 구간이 곧 "물게 되는 부위"다.
 */
export function findGrabbedPartInterval(
  claw: Game2PlayPosition,
  doll: Game2DollPlacement,
): GrabbedPartInterval | null {
  const mask = getDollAlphaMask(doll.imageSrc)
  if (!mask) return null

  const { alphaThreshold, tipRadiusPx } = GAME2_GRAB
  const { viewWidth, viewHeight } = GAME2_STAGE

  // 팁이 닿는 높이 근처 3줄을 함께 봐서 한 줄짜리 노이즈를 줄임
  const dyOffsetsPx = [0, -4, 4]
  // 벌린 팁 간격(최전방 ~123px)까지 부위 가장자리를 봐야 감싸기 판정 가능
  const halfRangePx = 80
  const stepPx = 1
  const gapTolerancePx = 2

  const isOpaqueAt = (dxPx: number) =>
    dyOffsetsPx.some((dyPx) => {
      const point = {
        x: claw.x + (dxPx / viewWidth) * 100,
        y: claw.y + (dyPx / viewHeight) * 100,
      }
      const { u, v } = stagePointToDollBoxUV(point, doll)
      return sampleDollAlpha(mask, u, v) >= alphaThreshold
    })

  // x축 스캔 → 불투명 구간 목록 (작은 끊김은 이어 붙임)
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

  // 착지점(0)을 포함하거나 팁 반경 안에서 가장 가까운 구간
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

  return { startPx: best.start, endPx: best.end }
}

/** 잡은 지점에서 인형 부위의 가로 두께(디자인 px). 측정 실패 시 null */
export function measureGrabbedPartWidthPx(
  claw: Game2PlayPosition,
  doll: Game2DollPlacement,
): number | null {
  const interval = findGrabbedPartInterval(claw, doll)
  return interval ? interval.endPx - interval.startPx : null
}

/**
 * 집게 rig 기하 비율 — game2-claw.css와 동기.
 * (팔 피벗 left 31%/69%, 팔 높이 54%H, 팁 폭 = 0.5×0.28×0.18W)
 */
const CLAW_RIG = {
  aspectHOverW: 380 / 319,
  pivotXFrac: 0.31,
  armHeightFrac: 0.54,
  lowerExtraFrac: 0.04,
  tipHalfWidthFrac: (0.5 * 0.28 * 0.18) / 2,
} as const

/** gripT 포즈에서 양쪽 팁 안쪽 간격 (rig 너비 W에 대한 비율) */
function getClawTipGapFrac(gripT: number): number {
  const closed = GAME2_CLAW_POSE.closed
  const opened = GAME2_CLAW_POSE.open
  const t = clamp(gripT, 0, 1)

  const armDeg = lerp(closed.armLeft, opened.armLeft, t)
  const lowerDeg = lerp(closed.lowerLeft, opened.lowerLeft, t)
  const jointTopFrac = lerp(closed.jointTop, opened.jointTop, t) / 100

  const armLen = CLAW_RIG.armHeightFrac * CLAW_RIG.aspectHOverW
  const upperLen = jointTopFrac * armLen
  const lowerLen = (1 - jointTopFrac + CLAW_RIG.lowerExtraFrac) * armLen

  // CSS rotate(θ): 아래 방향 (0,1) → (−sinθ, cosθ). 왼팔 기준 팁 x 오프셋
  const armRad = (armDeg * Math.PI) / 180
  const tipRad = ((armDeg + lowerDeg) * Math.PI) / 180
  const offsetLeft = upperLen * -Math.sin(armRad) + lowerLen * -Math.sin(tipRad)

  const centerGap = (1 - 2 * CLAW_RIG.pivotXFrac) - 2 * offsetLeft
  return centerGap - 2 * CLAW_RIG.tipHalfWidthFrac
}

/** gripT 포즈에서 양쪽 팁 안쪽 간격 (월드 디자인 px, 해당 깊이의 원근 반영) */
export function getClawTipGapWorldPx(gripT: number, playY: number): number {
  const { rigWidth, perspectiveScaleBack, perspectiveScaleFront } = GAME2_CLAW
  const depthScale = lerp(
    perspectiveScaleBack,
    perspectiveScaleFront,
    getPlayDepthT(playY),
  )
  const rigWidthPx = (rigWidth / 100) * GAME2_STAGE.viewWidth * depthScale
  return getClawTipGapFrac(gripT) * rigWidthPx
}

/**
 * 잡은 부위 두께 → 집게 오므림 보간값 gripT.
 *
 * 팁 사이 간격(월드 px)이 측정된 부위 두께 − squeezePx와 같아지도록
 * 포즈를 역산한다. 부위가 최소 간격보다 가늘면 완전 오므림(0).
 */
export function getGripTForGrab(
  claw: Game2PlayPosition,
  doll: Game2DollPlacement,
): number {
  const { squeezePx, fallbackWidthPx } = GAME2_GRIP
  const widthPx = measureGrabbedPartWidthPx(claw, doll) ?? fallbackWidthPx

  // 집게 rig 실제 폭 (디자인 px) — 렌더와 동일하게 depth 스케일 반영
  const { rigWidth, perspectiveScaleBack, perspectiveScaleFront } = GAME2_CLAW
  const depthScale = lerp(
    perspectiveScaleBack,
    perspectiveScaleFront,
    getPlayDepthT(claw.y),
  )
  const rigWidthPx = (rigWidth / 100) * GAME2_STAGE.viewWidth * depthScale

  const targetGapFrac = Math.max(0, widthPx - squeezePx) / rigWidthPx

  if (targetGapFrac <= getClawTipGapFrac(0)) return 0
  if (targetGapFrac >= getClawTipGapFrac(1)) return 1

  // 간격은 gripT에 단조 증가 → 이분 탐색
  let lo = 0
  let hi = 1
  for (let i = 0; i < 24; i += 1) {
    const mid = (lo + hi) / 2
    if (getClawTipGapFrac(mid) < targetGapFrac) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

/** 팁(세로 프로브)이 인형 실루엣에 닿았는지 — innerSign: 안쪽 방향 (왼팁 +1, 오른팁 −1) */
function tipTouchesDoll(
  tipXPercent: number,
  playY: number,
  innerSign: 1 | -1,
  doll: Game2DollPlacement,
): boolean {
  const mask = getDollAlphaMask(doll.imageSrc)
  if (!mask) return false

  const { probeHalfHeightPx, probeInsetPx } = GAME2_CLOSE_SIM
  const { alphaThreshold } = GAME2_GRAB
  const { viewWidth, viewHeight } = GAME2_STAGE

  for (let dy = -probeHalfHeightPx; dy <= probeHalfHeightPx; dy += 3) {
    for (const insetPx of [0, probeInsetPx]) {
      const point = {
        x: tipXPercent + ((innerSign * insetPx) / viewWidth) * 100,
        y: playY + (dy / viewHeight) * 100,
      }
      const { u, v } = stagePointToDollBoxUV(point, doll)
      if (sampleDollAlpha(mask, u, v) >= alphaThreshold) return true
    }
  }
  return false
}

/** 닫힘 세션 동안 인형별 시뮬레이션 상태 */
export type ClawCloseDollSim = {
  /** 깊이 방향 탈출 부호 — 세션 시작 시 무작위 고정 */
  escapeSign: 1 | -1
  /** 누적 기울기 (쓰러짐 판정용) */
  accumTiltDeg: number
  /** 미끄러짐·쓰러짐 확정 — 이번 닫힘에서는 잡을 수 없음 */
  slipped: boolean
  /** 쓰러짐 목표 각도 (도달할 때까지 프레임마다 회전) */
  toppleTargetDeg: number | null
}

export type ClawCloseSimContext = Map<number, ClawCloseDollSim>

export function createClawCloseSimContext(): ClawCloseSimContext {
  return new Map()
}

function getDollSim(ctx: ClawCloseSimContext, id: number): ClawCloseDollSim {
  let sim = ctx.get(id)
  if (!sim) {
    sim = {
      escapeSign: Math.random() < 0.5 ? -1 : 1,
      accumTiltDeg: 0,
      slipped: false,
      toppleTargetDeg: null,
    }
    ctx.set(id, sim)
  }
  return sim
}

function rotateToward(current: number, target: number, maxDeltaDeg: number) {
  const diff = target - current
  if (Math.abs(diff) <= maxDeltaDeg) return target
  return current + Math.sign(diff) * maxDeltaDeg
}

function randomToppleDelta(dir: number) {
  const { toppleExtraDegMin, toppleExtraDegMax } = GAME2_CLOSE_SIM
  return dir * (toppleExtraDegMin + Math.random() * (toppleExtraDegMax - toppleExtraDegMin))
}

export type ClawCloseStepResult = {
  gripT: number
  /** 오므림 종료 (잡았거나 끝까지 닫힘) */
  done: boolean
  grabbedId: number | null
  /** 물림 품질 0–1 (1 = 정중앙) — 이동 중 낙하 확률에 사용 */
  grabQuality: number
  /** 밀리거나 쓰러진 인형들의 새 위치·기울기 */
  dollUpdates: Array<{
    id: number
    xPercent: number
    playY: number
    rotateDeg: number
  }>
}

/**
 * 오므림 시뮬레이션 한 스텝 — 사전 판정 없음, 잡기는 보장되지 않음.
 *
 * - 한쪽 팁 접촉 → 밀리면서 깊이 방향으로도 빠져나감 + 기울어짐.
 *   누적 기울기가 한계를 넘으면 쓰러지고, 그 인형은 이번엔 못 잡음
 * - 양쪽 팁 동시 접촉 → 물림 품질 검사: 부위 중심에서 벗어난 물림이거나
 *   기본 미끄러짐 확률에 걸리면 튕겨 나가고, 통과해야 잡힘 확정
 * - 접촉 없이 끝까지 닫힘 → 빈 집게 (밀리고 쓰러진 인형들은 그대로 남음)
 */
export function stepClawClose(
  claw: { x: number; y: number; gripT: number },
  dolls: readonly Game2DollState[],
  dtMs: number,
  ctx: ClawCloseSimContext,
): ClawCloseStepResult {
  const cfg = GAME2_CLOSE_SIM
  const { viewWidth, viewHeight } = GAME2_STAGE

  const nextGripT = Math.max(0, claw.gripT - dtMs / cfg.closeDurationMs)
  const prevHalfGapPx = getClawTipGapWorldPx(claw.gripT, claw.y) / 2
  const halfGapPx = getClawTipGapWorldPx(nextGripT, claw.y) / 2
  const tipTravelPx = Math.max(0, prevHalfGapPx - halfGapPx)

  const leftTipX = claw.x - (halfGapPx / viewWidth) * 100
  const rightTipX = claw.x + (halfGapPx / viewWidth) * 100

  const dollUpdates: ClawCloseStepResult['dollUpdates'] = []
  let grabbedId: number | null = null
  let grabQuality = 1
  let pinchSlippedNow = false

  for (const doll of dolls) {
    if (doll.captured || doll.falling) continue

    const sim = getDollSim(ctx, doll.id)

    // 이미 빠져나간 인형 — 드리프트·쓰러짐 회전만 진행
    if (sim.slipped) {
      const drifted = clampDollPosition({
        x: doll.xPercent,
        y:
          doll.playY +
          ((sim.escapeSign * cfg.slipDriftPxPerMs * dtMs) / viewHeight) * 100,
      })
      const rotated =
        sim.toppleTargetDeg !== null
          ? rotateToward(doll.rotateDeg, sim.toppleTargetDeg, cfg.toppleSpeedDegPerMs * dtMs)
          : doll.rotateDeg

      if (drifted.y !== doll.playY || rotated !== doll.rotateDeg) {
        dollUpdates.push({
          id: doll.id,
          xPercent: drifted.x,
          playY: drifted.y,
          rotateDeg: rotated,
        })
      }
      continue
    }

    const leftContact = tipTouchesDoll(leftTipX, claw.y, 1, doll)
    const rightContact = tipTouchesDoll(rightTipX, claw.y, -1, doll)

    if (leftContact && rightContact) {
      // 물림 품질 — 어설픈 물림은 미끄러져 빠져나감
      const interval = findGrabbedPartInterval({ x: claw.x, y: claw.y }, doll)
      let offsetRatio = cfg.pinchOffsetSlipRatio
      if (interval) {
        const centerPx = (interval.startPx + interval.endPx) / 2
        const halfWidthPx = Math.max(1, (interval.endPx - interval.startPx) / 2)
        offsetRatio = Math.abs(centerPx) / halfWidthPx
      }
      const slip =
        Math.random() < cfg.pinchSlipBaseChance ||
        offsetRatio > cfg.pinchOffsetSlipRatio

      if (!slip) {
        grabbedId = doll.id
        grabQuality = clamp(1 - offsetRatio / cfg.pinchOffsetSlipRatio, 0, 1)
        break
      }

      sim.slipped = true
      pinchSlippedNow = true
      if (Math.random() < cfg.slipToppleChance) {
        const dir = Math.random() < 0.5 ? -1 : 1
        sim.toppleTargetDeg = doll.rotateDeg + randomToppleDelta(dir)
      }
      const kicked = clampDollPosition({
        x: doll.xPercent,
        y: doll.playY + ((sim.escapeSign * cfg.slipKickPx) / viewHeight) * 100,
      })
      dollUpdates.push({
        id: doll.id,
        xPercent: kicked.x,
        playY: kicked.y,
        rotateDeg: doll.rotateDeg,
      })
      continue
    }

    if (leftContact || rightContact) {
      // 한쪽 팁이 밀어냄 — 옆 + 깊이 방향으로 밀리며 기울어짐
      const dir = leftContact ? 1 : -1
      const pushPx = tipTravelPx * cfg.pushFactor
      const escapePx = tipTravelPx * cfg.escapeFactor

      sim.accumTiltDeg += pushPx * cfg.tiltDegPerPx
      let rotateDeg = doll.rotateDeg + dir * pushPx * cfg.tiltDegPerPx

      if (
        sim.toppleTargetDeg === null &&
        Math.abs(sim.accumTiltDeg) > cfg.toppleThresholdDeg
      ) {
        // 쓰러짐 확정 — 이번 닫힘에서는 잡을 수 없음
        sim.toppleTargetDeg = rotateDeg + randomToppleDelta(dir)
        sim.slipped = true
      }

      const pushed = clampDollPosition({
        x: doll.xPercent + ((dir * pushPx) / viewWidth) * 100,
        y: doll.playY + ((sim.escapeSign * escapePx) / viewHeight) * 100,
      })
      dollUpdates.push({
        id: doll.id,
        xPercent: pushed.x,
        playY: pushed.y,
        rotateDeg,
      })
    }
  }

  if (grabbedId !== null) {
    // 물림 확정 — 살짝 더 조여서 꽉 잡는 느낌
    return {
      gripT: Math.max(0, claw.gripT - GAME2_CLOSE_SIM.squeezeT),
      done: true,
      grabbedId,
      grabQuality,
      dollUpdates,
    }
  }

  if (pinchSlippedNow) {
    // 물고 있던 인형이 빠져나감 — 끝까지 오므리지 않고 도로 살짝 벌어진 채 종료
    return {
      gripT: Math.min(1, claw.gripT + cfg.slipReopenT),
      done: true,
      grabbedId: null,
      grabQuality: 1,
      dollUpdates,
    }
  }

  return {
    gripT: nextGripT,
    done: nextGripT <= 0,
    grabbedId: null,
    grabQuality: 1,
    dollUpdates,
  }
}

export function getGame2DollById(
  dolls: readonly Game2DollState[],
  id: number | null,
): Game2DollState | null {
  if (id === null) return null
  return dolls.find((doll) => doll.id === id) ?? null
}

/** 집게에 붙은 인형 depth scale — doll zone floor 기준 */
export function getHeldDollDepthScale(playY: number) {
  const { perspectiveScaleBack, perspectiveScaleFront } = GAME2_CLAW
  const depthT = getPlayDepthT(playY, GAME2_FLOOR)
  return lerp(perspectiveScaleBack, perspectiveScaleFront, depthT)
}

function randomInRange(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function randomPointInGridCell(cell: Game2PlayGridCell): Game2Point {
  const u = Math.random()
  const v = Math.random()
  const [a, b, c, d] = cell.corners

  return {
    x: (1 - u) * (1 - v) * a.x + u * (1 - v) * b.x + u * v * c.x + (1 - u) * v * d.x,
    y: (1 - u) * (1 - v) * a.y + u * (1 - v) * b.y + u * v * c.y + (1 - u) * v * d.y,
  }
}

function randomDollRotationDeg() {
  const roll = Math.random()
  if (roll < 0.14) return randomInRange(-42, 42)
  if (roll < 0.42) return randomInRange(-26, 26)
  return randomInRange(-12, 12)
}

function randomDollFaceScaleX() {
  return Math.random() < 0.44 ? -1 : 1
}

function isTooCloseToPlacements(
  point: Game2Point,
  placements: readonly Game2DollPlacement[],
  minDist: number,
) {
  return placements.some((doll) => {
    const dx = doll.xPercent - point.x
    const dy = doll.playY - point.y
    return Math.hypot(dx, dy) < minDist
  })
}

function getDollPlacementMinDist(count: number): number {
  // 인형 렌더 크기(stage %) 기준 — 겹쳐 보이지 않을 최소 간격
  const dollSpan =
    (GAME2_DOLLS.emojiSizePx / GAME2_STAGE.viewHeight) * 100 * 0.92
  if (count <= 10) return Math.max(dollSpan, 9.5)
  return Math.max(4.2, dollSpan * 0.72 - (count - 10) * 0.25)
}

/** 격자 칸 중심 근처 — 칸 전체 랜덤보다 퍼짐 유지 */
function randomPointNearGridCellCenter(
  cell: Game2PlayGridCell,
  spread = 0.38,
): Game2Point {
  const random = randomPointInGridCell(cell)
  return {
    x: cell.center.x + (random.x - cell.center.x) * spread,
    y: cell.center.y + (random.y - cell.center.y) * spread,
  }
}

function tryPlaceDollInZone(
  placements: Game2DollPlacement[],
  imageSrc: string,
  point: Game2Point,
  minDist: number,
  perspectiveScaleBack: number,
  perspectiveScaleFront: number,
): Game2DollPlacement | null {
  if (!isPointInDollZone(point)) return null
  if (isTooCloseToPlacements(point, placements, minDist)) return null
  return createDollPlacementFromPoint(
    placements.length + 1,
    imageSrc,
    point,
    perspectiveScaleBack,
    perspectiveScaleFront,
  )
}

function createDollPlacementFromPoint(
  id: number,
  imageSrc: string,
  point: Game2Point,
  perspectiveScaleBack: number,
  perspectiveScaleFront: number,
): Game2DollPlacement {
  const clamped = clampDollPosition(point)
  const depthT = getPlayDepthT(clamped.y, GAME2_FLOOR)
  const baseDepth = lerp(perspectiveScaleBack, perspectiveScaleFront, depthT)

  return {
    id,
    imageSrc,
    xPercent: clamped.x,
    playY: clamped.y,
    depthScale: baseDepth * randomInRange(0.9, 1.08),
    rotateDeg: randomDollRotationDeg(),
    faceScaleX: randomDollFaceScaleX(),
  }
}

/** 🔴 인형 영역 안에 count개 배치 — 격자 구역 + 랜덤 위치·각도 */
export function generateGame2DollPlacements(
  count: number,
  images: readonly string[],
): Game2DollPlacement[] {
  const { perspectiveScaleBack, perspectiveScaleFront } = GAME2_CLAW

  if (GAME2_DEV_CENTER_SPAWN && count > 0) {
    const center = getGame2DollZoneCenter()
    // 여러 마리면 중앙 기준 가로로 나란히 (겹침 방지)
    const spacingX = 15
    return Array.from({ length: count }, (_, index) =>
      createDollPlacementFromPoint(
        index + 1,
        images[index % images.length],
        { x: center.x + (index - (count - 1) / 2) * spacingX, y: center.y },
        perspectiveScaleBack,
        perspectiveScaleFront,
      ),
    )
  }

  const shuffledImages = [...images].sort(() => Math.random() - 0.5)
  const shuffledCells = [...getGame2PlayGridCells()].sort(() => Math.random() - 0.5)
  const placements: Game2DollPlacement[] = []
  let minDist = getDollPlacementMinDist(count)

  // 1) 격자 칸마다 최대 1마리 — 칸 중심 근처에 배치해 자연스럽게 퍼뜨림
  for (const cell of shuffledCells) {
    if (placements.length >= count) break

    let placed: Game2DollPlacement | null = null
    for (let attempt = 0; attempt < 24; attempt += 1) {
      placed = tryPlaceDollInZone(
        placements,
        shuffledImages[placements.length % shuffledImages.length],
        randomPointNearGridCellCenter(cell, 0.32 + Math.random() * 0.28),
        minDist,
        perspectiveScaleBack,
        perspectiveScaleFront,
      )
      if (placed) break
    }

    if (placed) placements.push(placed)
  }

  // 2) 남은 마리 — 영역 전체 랜덤 (간격 조건 유지)
  const marginY = 1.8
  const marginX = 4
  let attempts = 0
  const maxAttempts = Math.max(400, (count - placements.length) * 160)

  while (placements.length < count && attempts < maxAttempts) {
    attempts += 1
    const { backY, frontY } = GAME2_FLOOR
    const y = backY + marginY + Math.random() * (frontY - backY - marginY * 2)
    const { leftX, rightX } = getDollZoneSpanAtY(y)
    if (rightX - leftX <= marginX * 2) continue

    const x = leftX + marginX + Math.random() * (rightX - leftX - marginX * 2)
    const placed = tryPlaceDollInZone(
      placements,
      shuffledImages[placements.length % shuffledImages.length],
      { x, y },
      minDist,
      perspectiveScaleBack,
      perspectiveScaleFront,
    )
    if (placed) placements.push(placed)
  }

  // 3) 그래도 부족하면 간격만 조금 완화 (강제 겹침 배치는 하지 않음)
  if (placements.length < count) {
    minDist *= 0.82
    attempts = 0
    while (placements.length < count && attempts < maxAttempts) {
      attempts += 1
      const { backY, frontY } = GAME2_FLOOR
      const y = backY + marginY + Math.random() * (frontY - backY - marginY * 2)
      const { leftX, rightX } = getDollZoneSpanAtY(y)
      if (rightX - leftX <= marginX * 2) continue
      const x = leftX + marginX + Math.random() * (rightX - leftX - marginX * 2)
      const placed = tryPlaceDollInZone(
        placements,
        shuffledImages[placements.length % shuffledImages.length],
        { x, y },
        minDist,
        perspectiveScaleBack,
        perspectiveScaleFront,
      )
      if (placed) placements.push(placed)
    }
  }

  return placements
}
