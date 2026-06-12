/** game-stage 설계 크기 (--app-max-width × 576:1024) */
export const STAGE_DESIGN_W = 390
export const STAGE_DESIGN_H = (STAGE_DESIGN_W * 1024) / 576

/** @deprecated use STAGE_DESIGN_W */
export const ORBIT_DESIGN_W = STAGE_DESIGN_W

export function getOrbitScale(stageWidth: number, stageHeight: number) {
  if (stageWidth <= 0 || stageHeight <= 0) return 1
  return Math.min(stageWidth / STAGE_DESIGN_W, stageHeight / STAGE_DESIGN_H)
}

/** machine-dolls CSS · chuteFallGeometry 와 동기화 */
/** machine-claw__rod 폭 — 인형 clip 과 동일 (맞추기 난이도) */
export const ROD_WIDTH_PX = 10
export const DOLL_CLIP_WIDTH_PX = ROD_WIDTH_PX
export const DOLL_CLIP_HEIGHT_PX = 5
export const DOLL_STRING_HEIGHT_PX = 36
export const DOLL_EMOJI_SIZE_PX = 75
export const DOLL_EMOJI_LEAD_PX = DOLL_CLIP_HEIGHT_PX + DOLL_STRING_HEIGHT_PX

export const MECHANISM_BODY_PX = 48
export const ROD_REST_PX = 28
export const ROD_TIP_PX = 6
export const BRACKET_HEIGHT_PX = 0
export const DOLL_BODY_PX = 87
export const DOLL_HANG_PX = BRACKET_HEIGHT_PX + DOLL_BODY_PX
export const CHUTE_LIP_OVERLAP_PX = 18

/** claw-game-machine.css `--ix-inner-floor-scale` 와 동기화 */
export const CHUTE_INNER_SCALE = 0.55
/** 배출구 입·출구 앞쪽 폭 (공통) */
export const CHUTE_FRONT_L = 33
export const CHUTE_FRONT_R = 67
export const CHUTE_INNER_BACK_L = 38
export const CHUTE_INNER_BACK_R = 62

/** 낙하 → 접합선 정지 → 페이드 (claw-game-machine.css 와 동기화) */
export const DOLL_FALL_MS = 750
export const DOLL_CHUTE_HOLD_MS = 750
export const DOLL_CHUTE_FADE_MS = 400
export const DOLL_FALL_SEQUENCE_MS = DOLL_FALL_MS + DOLL_CHUTE_HOLD_MS + DOLL_CHUTE_FADE_MS
