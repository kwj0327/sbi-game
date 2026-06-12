/** game-stage 좌표계 (576×1024 PNG 기준, %) */
export const GAME2_STAGE = {
  viewWidth: 576,
  viewHeight: 1024,
} as const

export const GAME2_CLAW = {
  defaultX: 50,
  /** 케이블 고정점 (stage %) — 확정 디폴트 */
  railY: 8.5,
  /** 집게 본체(몸통+발) 너비 — stage 대비 % (앞쪽·scale 1 기준) */
  rigWidth: 32,
  /** depth 0(뒤) ↔ 1(앞) 원근 스케일 */
  perspectiveScaleBack: 0.68,
  perspectiveScaleFront: 1,
  /** play 영역 이동량 (stage %) */
  moveStepX: 2.5,
  moveStepY: 1.6,
  /** 방향키 길게 누를 때 반복 간격 (ms) */
  moveRepeatMs: 100,
  /** 케이블 길이 보정 — 클수록 집게가 화면 위로 (stage %). 확정 디폴트 18 */
  cableVisualLift: 18,
  /** 하강 애니메이션 길이 (ms) */
  descendDurationMs: 900,
  /** 바닥 착지 후 상승까지 대기 (ms) */
  holdAtBottomMs: 1000,
  /** 상승 애니메이션 길이 (ms) */
  ascendDurationMs: 900,
  /** 상승 후 배출구(노란 영역) 중심으로 이동 (ms) */
  returnToChuteDurationMs: 2600,
  /** 배출구 도착 후 집게를 다시 벌릴 때까지 대기 (ms) */
  holdAtChuteMs: 500,
  /** 배출구에서 집게를 벌린 뒤 시작 위치로 이동하기까지 대기 (ms) */
  holdAfterOpenAtChuteMs: 500,
  /** 배출구에서 시작 위치로 복귀 (ms) */
  returnToHomeDurationMs: 2600,
} as const

/** 착지·집기 (난이도 튜닝은 추후) */
export const GAME2_GRAB = {
  /** 집게 play 좌표 기준 잡기 반경 (stage %) */
  maxRadius: 10,
} as const

export const GAME2_CLAW_POSE = {
  /** 확정 디폴트 — 벌린 집게 (open: true). 윗팔 수평 + 아랫팔 수직·살짝 바깥 */
  open: {
    armLeft: 90,
    armRight: -90,
    lowerLeft: -100,
    lowerRight: 100,
    tipShiftLeft: 0,
    tipShiftRight: 0,
    jointTop: 38,
  },
  closed: {
    /** 어깨 — open(±90°)보다 덜 펴지고, 몸통 쪽으로 접힘 */
    armLeft: 32,
    armRight: -32,
    /** 팔꿈치 — 반대 방향으로 더 안쪽 접힘. 팁이 맞닿되 교차하지 않게 */
    lowerLeft: -60,
    lowerRight: 60,
    tipShiftLeft: 0,
    tipShiftRight: 0,
    jointTop: 34,
  },
} as const

export type Game2ClawPhase =
  | 'idle'
  | 'descending'
  | 'down'
  | 'ascending'
  | 'returning'
  | 'atChute'
  | 'openAtChute'
  | 'homeward'

export type Game2ClawState = {
  /** 플레이 영역 x (stage %) */
  xPercent: number
  /** 플레이 영역 depth y (stage %, backY↔frontY) */
  playY: number
  open: boolean
  /** idle: 이동 가능 · 그 외: 하강·착지·상승 */
  phase: Game2ClawPhase
  /** 0(공중) … 1(바닥 착지) — 하강 시각 진행도 */
  descendT: number
  /** 집게에 붙어 있는 인형 id · 없으면 null */
  heldDollId: number | null
}

/**
 * Game 2 바닥 영역 (stage %)
 *
 * 🟡 GAME2_CHUTE_ZONE — 배출구 영역 (노란 가이드)
 * 🔴 GAME2_DOLL_ZONE — 인형이 있을 수 있는 영역 (빨간 가이드)
 * 🟢 GAME2_CLAW_ZONE — 집게가 움직일 수 있는 영역 (초록 가이드)
 */

/** 바닥 가이드 표시(영역 선·격자·번호) — 다시 켤 때까지 false */
export const GAME2_SHOW_FLOOR_GUIDES = false

/** @deprecated GAME2_SHOW_FLOOR_GUIDES */
export const GAME2_SHOW_ZONE_GUIDES = GAME2_SHOW_FLOOR_GUIDES

/** 🟡 배출구 영역 — 낙하·집게 배출 이동 목표 */
export const GAME2_CHUTE_ZONE = {
  centerX: 24,
  centerY: 89.5,
  width: 24,
  height: 7.5,
} as const

/** @deprecated GAME2_CHUTE_ZONE */
export const GAME2_FLOOR_CHUTE = GAME2_CHUTE_ZONE

/**
 * 🔴 인형 영역 — 바닥 인형 배치·존재·집기 판정 (확정).
 * 시각: `.g2-floor-guide__edge--doll-zone` · `getGame2DollZoneOutline()`
 */
export const GAME2_DOLL_ZONE = {
  floor: {
    backY: 67,
    frontY: 89,
    backLeftX: 22,
    backRightX: 78,
    frontLeftX: 8,
    /** 12번 격자·앞쪽 빨간 테두리 오른쪽 끝 (작을수록 테두리·12번 칸이 왼쪽으로) */
    frontRightX: 87,
  },
  chuteClearance: {
    top: 5.5,
    left: 10,
    right: 6.5,
    bottom: 3.8,
  },
} as const

/**
 * 🟢 집게 이동 영역 — idle 이동·하강·좌표 클램프 (확정).
 * 시각: `.g2-floor-guide__edge--claw-zone` · `getGame2ClawZoneOutline()`
 */
export const GAME2_CLAW_ZONE = {
  floor: {
    backY: 65,
    frontY: 93,
    backLeftX: 22,
    backRightX: 78,
    frontLeftX: 8,
    frontRightX: 92,
  },
  chuteCutout: {
    centerX: 24,
    centerY: 89.5,
    width: 28,
    height: 9,
  },
} as const

export const GAME2_CLAW_ZONE_CHUTE_CUTOUT = GAME2_CLAW_ZONE.chuteCutout

/** @deprecated GAME2_CLAW_ZONE */
export const GAME2_DOLL_ZONE_ORIGINAL = GAME2_CLAW_ZONE

/** @deprecated GAME2_DOLL_ZONE.floor */
export const GAME2_FLOOR = GAME2_DOLL_ZONE.floor

/** 인형 영역에서 제외하는 배출구 컷아웃 (빨간 경계 계산) */
export const GAME2_DOLL_ZONE_CHUTE_CUTOUT = {
  centerX: GAME2_CHUTE_ZONE.centerX,
  centerY: GAME2_CHUTE_ZONE.centerY,
  width:
    GAME2_CHUTE_ZONE.width +
    GAME2_DOLL_ZONE.chuteClearance.left +
    GAME2_DOLL_ZONE.chuteClearance.right,
  height:
    GAME2_CHUTE_ZONE.height +
    GAME2_DOLL_ZONE.chuteClearance.top +
    GAME2_DOLL_ZONE.chuteClearance.bottom,
} as const

/** @deprecated GAME2_DOLL_ZONE.chuteClearance */
export const GAME2_CHUTE_CLEARANCE = GAME2_DOLL_ZONE.chuteClearance

/** @deprecated GAME2_DOLL_ZONE_CHUTE_CUTOUT */
export const GAME2_PLAY_AREA_CHUTE = GAME2_DOLL_ZONE_CHUTE_CUTOUT

/** 배출구 낙하 연출 */
export const GAME2_CHUTE_FALL = {
  fallDurationMs: 1400,
  holdMs: 0,
  fadeMs: 0,
  scaleEnd: 0.38,
} as const

export function getGame2ChuteFallSequenceMs() {
  const { fallDurationMs, holdMs, fadeMs } = GAME2_CHUTE_FALL
  return fallDurationMs + holdMs + fadeMs
}

/** 인형 영역 격자 — 뒤(벽) → 앞, 좌 → 우 (원근 사다리꼴 타일) */
export const GAME2_PLAY_GRID = {
  cols: 4,
  rows: 3,
} as const

/** 인형 영역 안 인형 수·표시 크기 */
export const GAME2_DOLLS = {
  count: 10,
  emojiSizePx: 72,
} as const

export const DEFAULT_GAME2_CLAW: Game2ClawState = {
  xPercent: GAME2_CLAW.defaultX,
  playY: (GAME2_CLAW_ZONE.floor.backY + GAME2_CLAW_ZONE.floor.frontY) / 2,
  open: true,
  phase: 'idle',
  descendT: 0,
  heldDollId: null,
}