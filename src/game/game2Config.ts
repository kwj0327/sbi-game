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
 * 바닥 사다리꼴 (576×1024 PNG 기준 %)
 * 원근: 뒤쪽(벽 접합) ↔ 앞쪽(출구). 플레이 영역 계산은 game2PlayArea.ts 참고.
 */
export const GAME2_FLOOR = {
  backY: 65,
  frontY: 93,
  backLeftX: 22,
  backRightX: 78,
  frontLeftX: 8,
  frontRightX: 92,
} as const

/** 플레이 영역 제외 배출구 — stage % (분홍 경계·게임플레이 기준) */
export const GAME2_PLAY_AREA_CHUTE = {
  centerX: 24,
  centerY: 89.5,
  width: 28,
  height: 9,
} as const

/** 배출구 가이드 — stage % (주황 표시용, 플레이 경계와 분리) */
export const GAME2_FLOOR_CHUTE = {
  centerX: 24,
  centerY: 89.5,
  width: 24,
  height: 7.5,
} as const

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

/** 플레이 영역 격자 — 뒤(벽) → 앞, 좌 → 우 (원근 사다리꼴 타일) */
export const GAME2_PLAY_GRID = {
  cols: 4,
  rows: 3,
} as const

/** 플레이 영역 인형 배치 */
export const GAME2_DOLLS = {
  count: 10,
  emojiSizePx: 72,
} as const

export const DEFAULT_GAME2_CLAW: Game2ClawState = {
  xPercent: GAME2_CLAW.defaultX,
  playY: (GAME2_FLOOR.backY + GAME2_FLOOR.frontY) / 2,
  open: true,
  phase: 'idle',
  descendT: 0,
  heldDollId: null,
}