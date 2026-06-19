import type { Game2ClawState } from './game2Config'

/** 개발용 영역 표시 (배출구·경계선·바닥선·집게 히트박스·인형 실루엣) */
export const GAME3_DEV_OVERLAYS = false

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
  /** playfield 가장자리 여백 — 집게 부품(다리·팁)이 배경 밖으로 나가지 않게 (world %) */
  playfieldEdgeMargin: 0.5,
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
  /** 1층 인형 중 2층으로 올릴 확률 (fillTwoLayers=false 일 때) */
  topLayerChance: 0,
  /** true — 1층 위에 2층 추가 (false — 1층만) */
  fillTwoLayers: false,
  /** 2층 — 1층 위로 올리는 높이 (world %) — fillTwoLayers 아닐 때 */
  stackLiftY: 9.5,
  /** fillTwoLayers — 2층 발 위치 = 1층 발 + 인형 높이 × 이 비율 */
  twoLayerNestFrac: 0.88,
  /**
   * fillTwoLayers — 1층 가로 밀집 (인형 bbox 폭 대비 다음 중심 간격).
   * 작을수록 더 겹치며 빽빵 (측면 뷰 기준, 0.5 전후).
   */
  twoLayerPackStepFrac: 0.54,
  /** fillTwoLayers — 배치 x 미세 흔들림 (world %) */
  twoLayerXJitter: 1.4,
  /** fillTwoLayers — 2층 x 미세 오프셋 (1층 대비, world %) */
  twoLayerTopXJitter: 1.6,
  /** fillTwoLayers — 배치 기울기 최소 (deg). 너무 작으면 다 일자로 서 보임 */
  twoLayerPlaceRotateMinDeg: 9,
  /** fillTwoLayers — 배치 기울기 최대 (deg) */
  twoLayerPlaceRotateMaxDeg: 28,
  /** fillTwoLayers — 2층 추가 기울기 흔들림 (deg) */
  twoLayerTopExtraLeanDeg: 7,
  /** fillTwoLayers — 2층 개수 = 1층 × 이 비율 (0~1, 1층보다 적게) */
  twoLayerTopRatio: 0.58,
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

/** stackLevel별 발 위치 오프셋 (world %, 1층 발 기준 위로) */
export function getGame3DollStackLiftPercent(stackLevel: 0 | 1): number {
  if (stackLevel === 0) return 0
  if (GAME3_DOLLS.fillTwoLayers) {
    const dollH = (GAME3_DOLLS.emojiSizePx / GAME3_WORLD.height) * 100
    return dollH * GAME3_DOLLS.twoLayerNestFrac
  }
  return GAME3_DOLLS.stackLiftY
}

/**
 * 잡기 닫힘 — 어깨(윗팔)는 벌린 상태로 고정하므로, 다리(아랫팔)가 인형까지 닿도록
 * Game2(±60°)보다 훨씬 깊이 안쪽으로 접는 각도. (open 다리 각도는 ±100°)
 */
export const GAME3_GRAB = {
  lowerClosedLeftDeg: -125,
  lowerClosedRightDeg: 125,
  /**
   * 닫힌 다리 사이로 잡힌 인형 실루엣 가로 폭 비율 (0~1).
   * 양쪽 다리가 침범 없이 오므렸을 때 이 비율 이상이면 성공.
   */
  minCoverageRatio: 0.05,
  /** 겹침 샘플이 이 수를 넘으면 침범 (1~2는 격자 경계 오차만 허용) */
  maxBoundaryOverlapSamples: 2,
  /** 실루엣 중앙선을 넘어 반대편 샘플이 이 수 이상이면 관통 */
  legWrongSideSamples: 5,
  /** 실루엣 폭 대비 중앙선 여유 (0.08 = 8%) */
  silhouetteMidMarginFrac: 0.08,
} as const

/** 하강 충돌 반응 — 다리/몸통이 인형에 부딪히면 인형이 밀리고 회전 (의사물리) */
export const GAME3_PHYSICS = {
  /** 한쪽 다리에 닿은 인형이 옆으로 밀리는 속도 (world % / ms) */
  pushSpeedPctPerMs: 0.045,
  /** 밀릴 때 같이 도는 회전 속도 (deg / ms) */
  rotSpeedDegPerMs: 0.05,
  /** 충돌로 누적될 수 있는 최대 회전 (deg) */
  maxRotateDeg: 28,
  /** 오므림 — Game2식 팁 접촉 회전 (위치 이동 없음, pushFactor×tipTravel→deg) */
  closeTipPushFactor: 0.8,
  closeTiltDegPerPx: 0.65,
  closeProbeHalfHeightPx: 9,
  closeProbeInsetPx: 2,
  /** 인형 중심이 머물 수 있는 좌측 한계 여백 (배출구 경계 기준 world %) */
  pushBoundMargin: 1.5,
  /**
   * 다리가 인형에 먼저 걸릴 때 — 멈추지 않고 본체가 미끄러지며 더 하강.
   * 왼쪽 다리 걸림 → 집게가 오른쪽(+), 오른쪽 다리 걸림 → 왼쪽(-).
   */
  legSlideSpeedPctPerMs: 0.038,
  /** 한쪽 다리 걸림 시 기울어지는 각도 (deg) */
  legSlideTiltDeg: 14,
  legSlideTiltSpeedDegPerMs: 0.12,
  /** pin 없을 때 하강 기울기 상한 (deg) */
  maxDescentTiltDeg: 22,
  /** 팁 pin 중 하강·기울기 연동 상한 — 바닥/다른 장애물까지 계속 꺾임 */
  tipPinMaxTiltDeg: 58,
  /** 팁 고정 후 y축 이탈 → 몸체 기울기 보정 (deg / world%) */
  tipPinTiltGainY: 4.2,
  /** 팁 고정 후 x축 이탈 → 몸체 기울기 보정 (deg / world%) */
  tipPinTiltGainX: 0.8,
  /** pin 상태에서 lift 1% 하강당 추가 기울기 (deg) — 접촉점 유지 */
  tipPinDescentTiltRate: 4.8,
  /** 몸통/다리가 인형 실루엣 안으로 파고드는 것으로 볼 추가 깊이 (world %) */
  penetrateMarginY: 1.2,
  /** 기울기 유지로 닫을 때 이 각도 이상이면 양쪽 다리 완전 닫힘 시도 */
  tiltedGrabThresholdDeg: 6,
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
    clawTiltDeg: 0,
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
