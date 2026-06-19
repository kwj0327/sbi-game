/** game-stage 좌표계 (576×1024 PNG 기준, %) */
export const GAME2_STAGE = {
  viewWidth: 576,
  viewHeight: 1024,
} as const

/** 배경 PNG 레일 위치 — 케이블이 보이기 시작하는 y (stage %) */
const GAME2_CLAW_CABLE_ANCHOR_Y = 8.5

const GAME2_CLAW_RAIL_Y = 3
const GAME2_CLAW_LIFT = 40

export const GAME2_CLAW = {
  defaultX: 50,
  /** 케이블 고정점 (stage %) — 작을수록 화면 위 */
  railY: GAME2_CLAW_RAIL_Y,
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
  /** 케이블 길이 보정 — 클수록 집게가 화면 위로 (stage %). */
  cableVisualLift: GAME2_CLAW_LIFT,
  /**
   * 집게를 올린 만큼 줄 아래쪽을 잘라 숨김 — 배경 레일(anchor)에서 집게까지만 표시.
   * (anchor − railY)
   */
  cableVisualTrim: GAME2_CLAW_CABLE_ANCHOR_Y - GAME2_CLAW_RAIL_Y,
  /** 케이블 시각 연장 — 집게 위치 유지, stem과 겹침 (stage %) */
  cableVisualExtend: 4,
  /** CSS·시뮬 집게발 컨테이너 높이 (rig 높이 대비, 0–1) */
  rigArmHeightFrac: 0.76,
  /** rig 높이 대비 팁 y — game2-claw.css 팔 길이와 동기 */
  rigTipYFrac: 1.08,
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
  /** 집게 play 좌표 기준 잡기 반경 (stage %) — 알파 마스크 미로드 시 폴백 */
  maxRadius: 10,
  /** 더미 꼭대기 탐지 — 발자국 x (뒤쪽일수록 정렬 오차↑ → 넓게) */
  stackRadiusXBack: 16,
  stackRadiusXFront: 11,
  /** 더미 꼭대기 탐지 — 발자국 y */
  stackRadiusYBack: 10,
  stackRadiusYFront: 11,
  /** 착지점이 부위에서 이 거리 안에 있어야 함 (stage 디자인 px) */
  tipRadiusPx: 8,
  /** 잡힘으로 인정할 최소 알파 (0–255) */
  alphaThreshold: 40,
  /** 감싸기 판정 — 부위 가장자리가 벌린 팁 안쪽으로 이만큼 여유가 있어야 함 (디자인 px) */
  straddleMarginPx: 2,
  /** 물림 판정 — 완전 오므림 간격보다 부위가 이만큼 이상 얇으면 미끄러져 실패 (디자인 px) */
  slipTolerancePx: 4,
} as const

/**
 * 잡은 부위 두께 → 집게 오므림 정도.
 * 집게 팁 사이 실제 간격이 부위 두께와 일치하도록 포즈를 역산한다.
 */
export const GAME2_GRIP = {
  /** 팁이 부위 표면을 파고드는 양 (디자인 px) — 클수록 더 꽉 잡는 느낌 */
  squeezePx: 4,
  /** 마스크 미로드 등으로 측정 실패 시 가정할 두께 (디자인 px) */
  fallbackWidthPx: 28,
} as const

/**
 * 오므림 시뮬레이션 — 사전 판정 없음.
 * 집게는 그냥 닫히고, 닫히는 과정에서 팁이 인형에 닿으면 인형이 밀리거나
 * 기울거나 쓰러지며, 양 팁이 단단히 물었을 때만 잡힌 것으로 확정된다.
 */
export const GAME2_CLOSE_SIM = {
  /** 완전히 오므리는 데 걸리는 시간 (ms) */
  closeDurationMs: 550,
  /** 팁 접촉 시 인형이 밀리는 비율 (팁 이동량 대비, 1 미만 = 팁이 파고들며 밀림) */
  pushFactor: 0.8,
  /** 밀릴 때 앞뒤(깊이 방향)로 빠져나가는 비율 (팁 이동량 대비) */
  escapeFactor: 0.5,
  /** 밀릴 때 기울어지는 정도 (밀림 px당 deg) */
  tiltDegPerPx: 0.9,
  /** 누적 기울기가 이 값을 넘으면 쓰러짐 (deg) */
  toppleThresholdDeg: 16,
  /** 쓰러질 때 추가 회전 범위 (deg) */
  toppleExtraDegMin: 65,
  toppleExtraDegMax: 105,
  /** 쓰러짐 회전 속도 (deg/ms) */
  toppleSpeedDegPerMs: 0.45,
  /** 물림 중심이 부위 중심에서 이 비율(반폭 대비) 이상 벗어나면 미끄러짐 */
  pinchOffsetSlipRatio: 0.45,
  /** 정중앙 물림도 이 확률로는 미끄러짐 */
  pinchSlipBaseChance: 0.12,
  /** 미끄러질 때 받는 즉시 깊이 방향 킥 (디자인 px) */
  slipKickPx: 7,
  /** 미끄러진 인형의 깊이 방향 드리프트 (px/ms) */
  slipDriftPxPerMs: 0.035,
  /** 미끄러질 때 쓰러질 확률 */
  slipToppleChance: 0.65,
  /** 팁 접촉 프로브 세로 반경 (디자인 px) */
  probeHalfHeightPx: 6,
  /** 팁 안쪽 접촉 여유 (디자인 px) */
  probeInsetPx: 2,
  /** 양 팁이 물었을 때 추가로 조이는 양 (gripT) */
  squeezeT: 0.04,
  /** 인형이 물림에서 빠져나가는 순간 집게가 도로 벌어지는 양 (gripT) */
  slipReopenT: 0.26,
  /** 오므림 종료 후 상승까지 대기 (ms) */
  holdAfterCloseMs: 350,
} as const

/**
 * 이동 중 낙하 — 잡았어도 끝이 아님.
 * 물림 품질(0–1)이 낮을수록 들어 올릴 때·운반 중에 잘 떨어진다.
 */
export const GAME2_DROP = {
  /** 들어 올리는 중 낙하 확률 — 품질 1일 때 / 품질 0일 때 */
  liftDropChanceMin: 0.04,
  liftDropChanceMax: 0.55,
  /** 배출구 운반 중 초당 낙하 확률 — 품질 1일 때 / 품질 0일 때 */
  carryDropPerSecMin: 0.02,
  carryDropPerSecMax: 0.45,
  /** 배출구 거리 가중치 — 멀 때 ×far, 바로 위에서 ×near (가까울수록 잘 떨어짐) */
  chuteDistanceFactorFar: 0.4,
  chuteDistanceFactorNear: 1.7,
  /** 바닥 낙하 연출 시간 (ms) */
  fallDurationMs: 420,
  /** 떨어진 인형이 쓰러진 채 착지할 확률 */
  dropToppleChance: 0.8,
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
  /** 닫힘 포즈 보간 — 0: 완전 오므림(빈 집게) … 1: open 포즈. 잡은 부위 두께로 결정 */
  gripT: number
  /** Game3 — 좌·우 독립 오므림 (둘 다 정의되면 각 팔에 개별 적용) */
  gripTLeft?: number
  gripTRight?: number
  /** 잡은 순간 인형 중심 − 기본 부착점 (playfield %) — 인형이 제자리에 머물게 보정 */
  heldOffsetX: number
  heldOffsetY: number
  /** 물림 품질 0–1 (1 = 정중앙) — 이동 중 낙하 확률에 사용 */
  heldGripQuality: number
  /** 더미(쌓인 인형) 위에서 멈추도록 집게를 위로 들어올리는 양 (stage %). 0이면 바닥까지 */
  clawLiftPercent: number
  /** Game3 — 하강 중 다리 걸림 시 본체 기울기 (deg, + = 오른쪽으로 기울음) */
  clawTiltDeg?: number
  /** Game3 — 잡힌 순간 인형 world 중심 (playfield %). fallback·배출용 */
  heldPinCenterX?: number
  heldPinCenterY?: number
  /** Game3 — 잡힌 순간 팁 중점 → 인형 중심 오프셋 (world %). carry 중 팁 추적 */
  heldGripDeltaX?: number
  heldGripDeltaY?: number
  /** Game3 — 잡힌 순간 전체 기울기 (deg). 상승 애니 시작값; 몸·어깨·다리는 clawTiltDeg 로 함께 수직 복귀 */
  grabArmTiltDeg?: number
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

/** true면 인형 영역(격자·빨간 경계)만 — 집게·배출구 가이드 숨김 */
export const GAME2_SHOW_DOLL_ZONE_GUIDE_ONLY = false

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
  // 🔴 인형 영역 = 🟢 집게 영역과 동일. 인형이 영역 밖으로 나오지 않도록
  // 배치 시 인형 절반 크기만큼 안쪽으로 인셋(createDollPlacementFromPoint)한다.
  floor: {
    backY: 65,
    frontY: 93,
    /** 뒤쪽(벽) — 이전 22~78에서 확장해 뒤열 배치·쌓기 여유 확보 */
    backLeftX: 14,
    backRightX: 86,
    frontLeftX: 8,
    frontRightX: 92,
  },
  chuteClearance: {
    top: 8,
    left: 12,
    right: 6.5,
    bottom: 3.8,
  },
} as const

/**
 * 🟢 집게 이동 영역 — idle 이동·좌표 클램프.
 * 🔴 인형 영역과 같은 사다리꼴(배출구 컷아웃 없음) — 앞·좌·우 끝까지 이동 가능.
 * chuteCutout은 가이드/레거시용. 착지 마커는 별도 계산이며 이동을 제한하지 않음.
 * 시각: `.g2-floor-guide__edge--claw-zone` · `getGame2ClawZoneOutline()`
 */
export const GAME2_CLAW_ZONE = {
  floor: {
    backY: 65,
    frontY: 93,
    backLeftX: 14,
    backRightX: 86,
    frontLeftX: 8,
    frontRightX: 92,
  },
  chuteCutout: {
    centerX: 24,
    centerY: 89.5,
    width: 28,
    height: 9,
    /** 배출구 위쪽 빨간 가로선 — 기본 85에서 뒤(벽쪽)로 이동 */
    notchTopY: 81.5,
  },
} as const

export const GAME2_CLAW_ZONE_CHUTE_CUTOUT = GAME2_CLAW_ZONE.chuteCutout

/** @deprecated GAME2_CLAW_ZONE */
export const GAME2_DOLL_ZONE_ORIGINAL = GAME2_CLAW_ZONE

/** @deprecated GAME2_DOLL_ZONE.floor */
export const GAME2_FLOOR = GAME2_DOLL_ZONE.floor

/** 인형 영역에서 제외하는 배출구 컷아웃 — 🟢 집게 영역과 동일 */
export const GAME2_DOLL_ZONE_CHUTE_CUTOUT = GAME2_CLAW_ZONE_CHUTE_CUTOUT

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
  /** 행 경계 depth 0~1 (뒤→앞). 균등 기본 [0, ⅓, ⅔, 1] */
  rowSplits: [0, 0.32, 0.56, 1] as const,
  /** 배출구 쪽 열(0·1) — 5·6번 중간줄 아래·9·10번 앞줄을 뒤로 밀어 chute와 겹침 방지 */
  chuteColCount: 2,
  chuteColRowSplits: [0, 0.32, 0.5, 0.9] as const,
} as const

/** 인형 영역 안 인형 수·표시 크기 */
export const GAME2_DOLLS = {
  count: 20,
  emojiSizePx: 150,
} as const

/** 인형 쌓기(2~3층) 설정 */
export const GAME2_STACK = {
  /** 전체 중 위층(2층)에 올릴 비율 (0~1) */
  topRatio: 0.5,
  /** 받침 인형 몸통 높이 대비 위 인형이 얹히는 높이 (z = bodyHeight% × nest) */
  nest: 0.82,
  /** 2층 위에 3층을 더 올릴 비율 (2층 더미 중) */
  extraTopRatio: 0.42,
  /** 위 인형을 원근상 살짝 뒤로 (받침 뒤에 얹힌 느낌) */
  backOffsetY: 1,
  /** 위 인형 기울기 완화 계수 (바닥보다 덜 기울게) */
  topRotateScale: 0.6,
} as const

/** 알고리즘 작업용 — true면 인형을 doll zone 중앙에 고정 스폰 */
export const GAME2_DEV_CENTER_SPAWN = false

/** 알고리즘 작업용 — 0이면 인형 없음 (영역 가이드 확인용) */
export const GAME2_SPAWN_DOLL_COUNT = 20

export const DEFAULT_GAME2_CLAW: Game2ClawState = {
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
  clawLiftPercent: 0,
}