import {
  GAME2_CLAW,
  GAME2_DOLLS,
  GAME2_FLOOR,
  GAME2_FLOOR_CHUTE,
  GAME2_GRAB,
  GAME2_PLAY_AREA_CHUTE,
  GAME2_PLAY_GRID,
  GAME2_STAGE,
  type Game2ClawState,
} from './game2Config'

/**
 * Game 2 핵심 플레이 영역 — 인형뽑기 **안쪽** 바닥 (배출구 제외).
 * 집게 이동·인형 배치·낙하·판정 등 모든 게임플레이는 이 영역 기준.
 * 경계: GAME2_FLOOR 사다리꼴 − GAME2_PLAY_AREA_CHUTE (stage 좌표 %).
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

/** y 높이에서 플레이 영역 좌·우 x (원근) */
function getPlayAreaSpanAtY(y: number) {
  const { backY, frontY, backLeftX, backRightX, frontLeftX, frontRightX } = GAME2_FLOOR
  const { topY, rightX: chuteRightX } = getGame2PlayAreaChuteBounds()
  const leftMeetX = lerpX(backLeftX, backY, frontLeftX, frontY, topY)
  const rightX = lerpX(backRightX, backY, frontRightX, frontY, y)
  const leftX = y <= topY ? lerpX(backLeftX, backY, leftMeetX, topY, y) : chuteRightX

  return { leftX, rightX }
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

export function isPointInPlayArea(point: Game2Point) {
  return isPointInPolygon(point, getGame2PlayAreaOutline())
}

/** depth y → 0(뒤) … 1(앞) */
export function getPlayDepthT(y: number) {
  const { backY, frontY } = GAME2_FLOOR
  return clamp((y - backY) / (frontY - backY), 0, 1)
}

/** 이동 경로상 마지막 유효 좌표 — 경계에서 멈춤 (튕김 없음) */
function slideToPlayArea(from: Game2PlayPosition, to: Game2PlayPosition): Game2PlayPosition {
  if (isPointInPlayArea(to)) return to
  if (!isPointInPlayArea(from)) return nearestPlayPositionOnY(from)

  let t0 = 0
  let t1 = 1

  for (let i = 0; i < 14; i += 1) {
    const tm = (t0 + t1) / 2
    const probe = {
      x: lerp(from.x, to.x, tm),
      y: lerp(from.y, to.y, tm),
    }

    if (isPointInPlayArea(probe)) t0 = tm
    else t1 = tm
  }

  return {
    x: lerp(from.x, to.x, t0),
    y: lerp(from.y, to.y, t0),
  }
}

/** 같은 y에서 x만 조정해 가장 가까운 유효 좌표 */
function nearestPlayPositionOnY(position: Game2PlayPosition): Game2PlayPosition {
  const { backY, frontY } = GAME2_FLOOR
  const y = clamp(position.y, backY, frontY)
  const { leftX, rightX } = getPlayAreaSpanAtY(y)

  if (isPointInPlayArea({ x: position.x, y })) {
    return { x: position.x, y }
  }

  let best: Game2PlayPosition | null = null
  let bestDist = Infinity

  for (let x = leftX; x <= rightX; x += 0.4) {
    const candidate = { x, y }
    if (!isPointInPlayArea(candidate)) continue

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

/** 플레이 영역 안으로 좌표 고정 */
export function clampPlayPosition(position: Game2PlayPosition): Game2PlayPosition {
  if (isPointInPlayArea(position)) return position
  return nearestPlayPositionOnY(position)
}

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

  return slideToPlayArea(position, next)
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

/** 플레이 영역 계산용 배출구 (분홍 경계) */
export function getGame2PlayAreaChuteBounds() {
  return getChuteBounds(GAME2_PLAY_AREA_CHUTE)
}

/** 주황 가이드용 배출구 */
export function getGame2ChuteBounds() {
  return getChuteBounds(GAME2_FLOOR_CHUTE)
}

/** 배출구 제외 — 인형뽑기 안쪽 플레이 영역 외곽 (시계 방향, stage %) */
export function getGame2PlayAreaOutline(): Game2Point[] {
  const { backY, frontY, backLeftX, backRightX, frontLeftX, frontRightX } = GAME2_FLOOR
  const { leftX, topY, rightX } = getGame2PlayAreaChuteBounds()

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

/**
 * 플레이 영역 격자 — 원근 사다리꼴 타일 (stage %).
 * 중심이 플레이 폴리곤 안에 있는 칸만 번호 부여.
 */
export function getGame2PlayGridCells(): Game2PlayGridCell[] {
  const { backY, frontY } = GAME2_FLOOR
  const { cols, rows } = GAME2_PLAY_GRID
  const outline = getGame2PlayAreaOutline()
  const cells: Game2PlayGridCell[] = []
  let id = 1

  for (let row = 0; row < rows; row += 1) {
    const y0 = lerp(backY, frontY, row / rows)
    const y1 = lerp(backY, frontY, (row + 1) / rows)
    const span0 = getPlayAreaSpanAtY(y0)
    const span1 = getPlayAreaSpanAtY(y1)

    for (let col = 0; col < cols; col += 1) {
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

/** 집게 시작 위치 — 분홍 격자 1번 칸 중심 */
export function getDefaultGame2ClawState(): Game2ClawState {
  const cell = getGame2PlayGridCell(1)

  if (!cell) {
    return {
      xPercent: GAME2_CLAW.defaultX,
      playY: (GAME2_FLOOR.backY + GAME2_FLOOR.frontY) / 2,
      open: true,
      phase: 'idle',
      descendT: 0,
      heldDollId: null,
    }
  }

  const position = clampPlayPosition({
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

/** 주황(노란) 배출구 가이드 중심 — stage % */
export function getGame2ChuteCenter(): Game2Point {
  const { centerX, centerY } = getGame2ChuteBounds()
  return { x: centerX, y: centerY }
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

/** 배출구 사각형 꼭짓점 — 주황 가이드 (시계 방향, stage %) */
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
  emoji: string
  xPercent: number
  playY: number
  depthScale: number
  rotateDeg: number
}

export type Game2DollState = Game2DollPlacement & {
  captured: boolean
  falling: boolean
}

export function createInitialGame2Dolls(emojis: readonly string[]): Game2DollState[] {
  return generateGame2DollPlacements(GAME2_DOLLS.count, emojis).map((doll) => ({
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

export function getGame2DollById(
  dolls: readonly Game2DollState[],
  id: number | null,
): Game2DollState | null {
  if (id === null) return null
  return dolls.find((doll) => doll.id === id) ?? null
}

/** 집게에 붙은 인형 depth scale — 현재 play y 기준 */
export function getHeldDollDepthScale(playY: number) {
  const { perspectiveScaleBack, perspectiveScaleFront } = GAME2_CLAW
  const depthT = getPlayDepthT(playY)
  return lerp(perspectiveScaleBack, perspectiveScaleFront, depthT)
}

/** 핑크 플레이 영역 격자 칸 중심에 인형 배치 (칸당 1개, 균일 분포) */
export function generateGame2DollPlacements(
  count: number,
  emojis: readonly string[],
): Game2DollPlacement[] {
  const { perspectiveScaleBack, perspectiveScaleFront } = GAME2_CLAW
  const shuffledEmojis = [...emojis].sort(() => Math.random() - 0.5)
  const shuffledCells = [...getGame2PlayGridCells()].sort(() => Math.random() - 0.5)
  const placements: Game2DollPlacement[] = []

  for (const cell of shuffledCells) {
    if (placements.length >= count) break

    const point = clampPlayPosition(cell.center)
    const depthT = getPlayDepthT(point.y)

    placements.push({
      id: placements.length + 1,
      emoji: shuffledEmojis[placements.length % shuffledEmojis.length],
      xPercent: point.x,
      playY: point.y,
      depthScale: lerp(perspectiveScaleBack, perspectiveScaleFront, depthT),
      rotateDeg: (Math.random() - 0.5) * 28,
    })
  }

  if (placements.length >= count) return placements

  const marginY = 1.4
  const marginX = 3
  const minDist = 8
  let attempts = 0
  const maxAttempts = (count - placements.length) * 120

  while (placements.length < count && attempts < maxAttempts) {
    attempts += 1
    const { backY, frontY } = GAME2_FLOOR
    const y = backY + marginY + Math.random() * (frontY - backY - marginY * 2)
    const { leftX, rightX } = getPlayAreaSpanAtY(y)
    if (rightX - leftX <= marginX * 2) continue

    const x = leftX + marginX + Math.random() * (rightX - leftX - marginX * 2)
    const point = { x, y }
    if (!isPointInPlayArea(point)) continue

    const crowded = placements.some((doll) => {
      const dx = doll.xPercent - x
      const dy = doll.playY - y
      return Math.hypot(dx, dy) < minDist
    })
    if (crowded) continue

    const depthT = getPlayDepthT(y)
    placements.push({
      id: placements.length + 1,
      emoji: shuffledEmojis[placements.length % shuffledEmojis.length],
      xPercent: x,
      playY: y,
      depthScale: lerp(perspectiveScaleBack, perspectiveScaleFront, depthT),
      rotateDeg: (Math.random() - 0.5) * 28,
    })
  }

  return placements
}
