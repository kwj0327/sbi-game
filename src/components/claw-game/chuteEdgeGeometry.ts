import {
  CHUTE_FRONT_L,
  CHUTE_FRONT_R,
  CHUTE_INNER_BACK_L,
  CHUTE_INNER_BACK_R,
  CHUTE_INNER_SCALE,
} from './constants'

/** interior % — CSS `--ix-*` chute 꼭짓점과 동기화 */
function chuteYLevels() {
  const floorH = 18 * CHUTE_INNER_SCALE
  const gapH = 10 * CHUTE_INNER_SCALE
  const gap6Top = 100 - 10
  return {
    innerFloorTop: gap6Top - floorH,
    gap6Top,
    innerBottom: gap6Top + gapH,
    gapH,
  }
}

export type ChuteInnerEdgeId = 15 | 16 | 17 | 20 | 21

export type ChuteInnerEdgeSegment = {
  id: ChuteInnerEdgeId
  x1: number
  y1: number
  x2: number
  y2: number
  labelX: number
  labelY: number
  rotate: number
}

export type ChuteInnerLine = {
  x1: number
  y1: number
  x2: number
  y2: number
}

/** 17·20·21 위쪽 — 입구 안쪽 상단 경계 */
export function getChuteInnerUpperEdgeLines(): ChuteInnerLine[] {
  const { innerFloorTop, gap6Top } = chuteYLevels()

  return [
    {
      x1: CHUTE_INNER_BACK_L,
      y1: innerFloorTop,
      x2: CHUTE_INNER_BACK_R,
      y2: innerFloorTop,
    },
    {
      x1: CHUTE_INNER_BACK_L,
      y1: innerFloorTop,
      x2: CHUTE_FRONT_L,
      y2: gap6Top,
    },
    {
      x1: CHUTE_INNER_BACK_R,
      y1: innerFloorTop,
      x2: CHUTE_FRONT_R,
      y2: gap6Top,
    },
  ]
}

/** 배출구 입구 안쪽 — 본체 2|5·3|5·4|5 경계와 동일 topology */
export function getChuteInnerEdgeSegments(): ChuteInnerEdgeSegment[] {
  const { innerFloorTop, innerBottom, gapH } = chuteYLevels()

  /** 15·16 세로 길이 = 출구 높이(gap6Top→innerBottom) */
  const y17 = innerFloorTop + gapH

  const x17L = CHUTE_INNER_BACK_L
  const x17R = CHUTE_INNER_BACK_R

  const diagLeftAngle =
    (Math.atan2(innerBottom - y17, CHUTE_FRONT_L - x17L) * 180) / Math.PI
  const diagRightAngle =
    (Math.atan2(innerBottom - y17, CHUTE_FRONT_R - x17R) * 180) / Math.PI

  return [
    {
      id: 15,
      x1: x17L,
      y1: innerFloorTop,
      x2: x17L,
      y2: y17,
      labelX: x17L - 2.4,
      labelY: (innerFloorTop + y17) / 2,
      rotate: -90,
    },
    {
      id: 16,
      x1: x17R,
      y1: innerFloorTop,
      x2: x17R,
      y2: y17,
      labelX: x17R + 2.4,
      labelY: (innerFloorTop + y17) / 2,
      rotate: 90,
    },
    {
      id: 17,
      x1: x17L,
      y1: y17,
      x2: x17R,
      y2: y17,
      labelX: 50,
      labelY: y17 - 1.1,
      rotate: 0,
    },
    {
      id: 20,
      x1: x17L,
      y1: y17,
      x2: CHUTE_FRONT_L,
      y2: innerBottom,
      labelX: (x17L + CHUTE_FRONT_L) / 2 - 1.5,
      labelY: (y17 + innerBottom) / 2,
      rotate: diagLeftAngle,
    },
    {
      id: 21,
      x1: x17R,
      y1: y17,
      x2: CHUTE_FRONT_R,
      y2: innerBottom,
      labelX: (x17R + CHUTE_FRONT_R) / 2 + 1.5,
      labelY: (y17 + innerBottom) / 2,
      rotate: diagRightAngle,
    },
  ]
}

/** 출구 직사각 좌·우 세로 경계 */
export function getChuteDropSideEdgeLines(): ChuteInnerLine[] {
  const { gap6Top, innerBottom } = chuteYLevels()

  return [
    {
      x1: CHUTE_FRONT_L,
      y1: gap6Top,
      x2: CHUTE_FRONT_L,
      y2: innerBottom,
    },
    {
      x1: CHUTE_FRONT_R,
      y1: gap6Top,
      x2: CHUTE_FRONT_R,
      y2: innerBottom,
    },
  ]
}

export function getChuteAuxiliaryLines(): ChuteInnerLine[] {
  return [...getChuteInnerUpperEdgeLines(), ...getChuteDropSideEdgeLines()]
}

export function getAllChuteInnerEdgeSegments(): ChuteInnerEdgeSegment[] {
  return getChuteInnerEdgeSegments()
}
