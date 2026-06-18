import type { Game2ClawState } from './game2Config'

/** 배경 PNG (1560×981) */
export const GAME3_WORLD = {
  width: 1560,
  height: 981,
  /** 바닥 인형 발 위치 (world %) — 배경 바닥선 */
  floorY: 100,
  /** 집게 레일 y (world %) — 배경 맨 위 */
  railY: 0,
  /** 가로 길이 배율 (1=원본 비율, 작을수록 가로 짧음) */
  widthScale: 0.92,
} as const

export const GAME3_CLAW = {
  defaultX: 50,
  /** world 가로 이동량 (%) */
  moveStepX: 3,
  moveRepeatMs: 80,
  /** 집게 좌우 이동 한계 (world %) */
  minX: 6,
  maxX: 94,
  /** 2D — 깊이 고정 (집게가 내려가 멈추는 바닥 높이) */
  playY: GAME3_WORLD.floorY - 4,
  descendDurationMs: 900,
  /** 바닥에서 집게 오므리는 시간 (ms) */
  closeDurationMs: 300,
  holdAtBottomMs: 500,
  ascendDurationMs: 900,
  /** 평상시 집게를 화면 위로 띄우는 양 (클수록 높이 매달림, world %) */
  cableVisualLift: 78,
  /** Game2 대비 집게 rig 시각 크기 (0–1) */
  rigVisualScale: 0.32,
  /** 상승 후 배출구(선물상자) 중심으로 이동 (ms) */
  returnToChuteDurationMs: 2200,
  /** 배출구 도착 후 집게를 벌리기까지 대기 (ms) */
  holdAtChuteMs: 450,
  /** 배출구에서 집게를 벌린 뒤 시작 위치로 이동하기까지 대기 (ms) */
  holdAfterOpenAtChuteMs: 400,
  /** 배출구에서 시작 x로 복귀 (ms) */
  returnToHomeDurationMs: 2000,
} as const

/** 배출구 낙하 연출 */
export const GAME3_CHUTE_FALL = {
  fallDurationMs: 1200,
  holdMs: 0,
  fadeMs: 0,
  scaleEnd: 0.42,
} as const

export function getGame3ChuteFallSequenceMs() {
  const { fallDurationMs, holdMs, fadeMs } = GAME3_CHUTE_FALL
  return fallDurationMs + holdMs + fadeMs
}

export const GAME3_DOLLS = {
  emojiSizePx: 280,
  /** 집게 x와 이 거리(%) 이내면 잡기 시도 */
  grabRadiusX: 7,
  /** 경계선 오른쪽 여백 (world %) */
  zoneMarginAfterBoundary: 2,
  zoneMarginRight: 3,
  /** 1층 인형 중 2층으로 올릴 확률 */
  topLayerChance: 0,
  /** 2층 — 1층 위로 올리는 높이 (world %) */
  stackLiftY: 9.5,
  /** 배치 시 바운딩 박스 사이 추가 여백 (world %) */
  minSpacingGap: 0.6,
  /** 인형 배치 회전 범위 (deg) — 작게 두어 겹침 방지 */
  placeRotateDeg: 7,
  /** 집게가 인형을 잡는 접촉 높이 (발 기준 위쪽 비율, 1=머리끝) */
  grabContactHeightFrac: 0.85,
  /** 집게가 인형 테두리에 맞춰 오므릴 때 추가 조임 (디자인 px) */
  gripSqueezePx: 8,
} as const

export function getDefaultGame3ClawState(): Game2ClawState {
  return {
    xPercent: GAME3_CLAW.defaultX,
    playY: GAME3_CLAW.playY,
    open: true,
    phase: 'idle',
    descendT: 0,
    heldDollId: null,
    gripT: 0,
    heldOffsetX: 0,
    heldOffsetY: 0,
    heldGripQuality: 1,
    clawLiftPercent: 0,
  }
}

export function isGame3ClawMovementLocked(state: Game2ClawState) {
  return state.phase !== 'idle'
}

/** 임시 가이드 — 선물 상자 / 배출구 경계 (world %) */
export const GAME3_GUIDE = {
  /** 배출구(선물상자) 오른쪽 끝 — 빨간선. 왼쪽=배출구, 오른쪽=플레이 */
  giftBoxBoundaryX: 28,
} as const

/** 🟡 배출구 영역 — 빨간선 왼쪽 (선물상자) */
export const GAME3_CHUTE = {
  leftX: 2,
  rightX: GAME3_GUIDE.giftBoxBoundaryX,
  topY: 62,
  bottomY: 98,
} as const
