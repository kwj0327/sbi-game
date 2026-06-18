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
  /** 집게 기본 위치 — 배출구(선물상자) 중심 (world %) */
  defaultX: 15,
  /** world 가로 이동량 (%) */
  moveStepX: 3,
  moveRepeatMs: 80,
  /** 집게 좌우 이동 한계 (world %) — 왼쪽은 디폴트(배출구) 위치까지만 */
  minX: 15,
  maxX: 94,
  /** 2D — 깊이 고정 (집게가 내려가 멈추는 바닥 높이) */
  playY: GAME3_WORLD.floorY - 4,
  descendDurationMs: 900,
  /** 바닥에서 집게 오므리는 시간 (ms) */
  closeDurationMs: 360,
  holdAtBottomMs: 500,
  ascendDurationMs: 900,
  /** 잡을 때 집게가 닫히는 최대 정도 (0=완전 닫힘 … 1=벌림). 작을수록 더 많이 닫힘 */
  maxGrabGripT: 0.4,
  /** 평상시(벌린 상태) 아랫팔(다리) 각도 — 90=수직, 90보다 크면 안쪽으로 살짝 몰림 */
  idleLowerArmDeg: 95,
  /** 평상시 집게를 화면 위로 띄우는 양 (클수록 높이 매달림, world %) */
  cableVisualLift: 78,
  /** Game2 대비 집게 rig 시각 크기 (0–1) */
  rigVisualScale: 0.54,
  /** 상승 후 배출구(선물상자) 중심으로 이동 (ms) */
  returnToChuteDurationMs: 2200,
  /** 배출구 도착 후 집게를 벌리기까지 대기 (ms) */
  holdAtChuteMs: 450,
  /** 배출구에서 집게를 벌린 뒤 시작 위치로 이동하기까지 대기 (ms) */
  holdAfterOpenAtChuteMs: 400,
  /** 배출구에서 시작 x로 복귀 (ms) */
  returnToHomeDurationMs: 2000,
} as const

/** 배출구 낙하 연출 — 2D 수직 낙하 */
export const GAME3_CHUTE_FALL = {
  fallDurationMs: 650,
  holdMs: 0,
  fadeMs: 0,
} as const

export function getGame3ChuteFallSequenceMs() {
  const { fallDurationMs, holdMs, fadeMs } = GAME3_CHUTE_FALL
  return fallDurationMs + holdMs + fadeMs
}

export const GAME3_DOLLS = {
  emojiSizePx: 220,
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
  /** 오므림 시 집게 중심에서 인식할 실루엣 반경 (디자인 px) */
  gripTipRadiusPx: 10,
} as const

/**
 * 잡기 닫힘 — 어깨(윗팔)는 벌린 상태로 고정하므로, 다리(아랫팔)가 인형까지 닿도록
 * Game2(±60°)보다 훨씬 깊이 안쪽으로 접는 각도. (open 다리 각도는 ±100°)
 */
export const GAME3_GRAB = {
  lowerClosedLeftDeg: -125,
  lowerClosedRightDeg: 125,
} as const

/** 하강 충돌 반응 — 다리/몸통이 인형에 부딪히면 인형이 밀리고 회전 (의사물리) */
export const GAME3_PHYSICS = {
  /** 한쪽 다리에 닿은 인형이 옆으로 밀리는 속도 (world % / ms) */
  pushSpeedPctPerMs: 0.045,
  /** 밀릴 때 같이 도는 회전 속도 (deg / ms) */
  rotSpeedDegPerMs: 0.05,
  /** 충돌로 누적될 수 있는 최대 회전 (deg) */
  maxRotateDeg: 28,
  /** 인형 중심이 머물 수 있는 좌측 한계 여백 (배출구 경계 기준 world %) */
  pushBoundMargin: 1.5,
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
