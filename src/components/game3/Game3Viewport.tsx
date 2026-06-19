import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import game3RoomBackground from '../../assets/game3-room-background.png'
import {
  getDollOpaqueBounds,
  getDollSilhouetteTopV,
} from '../../game/dollAlphaMask'
import type { Game2ClawState } from '../../game/game2Config'
import {
  bodyRestsOnSilhouetteSurface,
  partInvadesDollSilhouette,
  sampleSilhouetteAtWorldPoint,
} from '../../game/game3Boundary'
import { GAME3_CLAW, GAME3_CHUTE, GAME3_DEV_OVERLAYS, GAME3_DOLLS, GAME3_GUIDE, GAME3_WORLD } from '../../game/game3Config'
import {
  getGame3CarriedDollCenterFromTips,
  getGame3DollById,
  getGame3ClawRender,
  getGame3ScrollLeftPx,
  getGame3WorldWidthPx,
  type Game3DollState,
} from '../../game/game3PlayArea'
import { Game2Claw } from '../game2/Game2Claw'
import '../game2/game2-claw.css'
import { Game3CarriedDoll } from './Game3CarriedDoll'
import { Game3Dolls } from './Game3Dolls'
import { Game3FallingDolls } from './Game3FallingDolls'
import './game3-viewport.css'

export type Game3HeldDollMeasure = {
  xPercent: number
  centerYPercent: number
}

export type Game3DescentStopMeasure = {
  /** 하강 종료 lift (world %, 클수록 덜 내려감) */
  clawLiftPercent: number
  /** 충돌로 잡히는 인형 id (없으면 null) */
  hitDollId: number | null
}

export type Game3DescentLegContacts = {
  left: boolean
  right: boolean
}

export type Game3DescentBodyRest = {
  resting: boolean
  dollId: number | null
}

export type Game3ClawPenetration = {
  body: boolean
  leftLeg: boolean
  rightLeg: boolean
  leftShoulder: boolean
  rightShoulder: boolean
}

/** 중심선/박스 기반 부품-인형 접촉 (보이는 형상과 일치) */
export type Game3PartContact = {
  /** 실루엣 안으로 깊이 파고듦 */
  pen: boolean
  /** 실루엣에 닿음 (경계 포함) */
  touch: boolean
  /** 실루엣 내부 샘플 수 (깊이 proxy) */
  inside: number
}

export type Game3ClawContact = {
  body: Game3PartContact
  leftShoulder: Game3PartContact
  rightShoulder: Game3PartContact
  leftLeg: Game3PartContact
  rightLeg: Game3PartContact
}

export type Game3SegmentGrasp = {
  valid: boolean
  leftTouch: boolean
  rightTouch: boolean
  /** @deprecated 팁 기준 — 1=닿음 0=없음 */
  leftInside: number
  rightInside: number
}

export type Game3TipContact = {
  left: boolean
  right: boolean
}

/** 집게발 팁 위치 + 인형 접촉 (하강 물리용) */
export type Game3TipAnchor = {
  x: number
  y: number
  touch: boolean
  dollId: number | null
}

export type Game3TipAnchors = {
  left: Game3TipAnchor
  right: Game3TipAnchor
}

/** 닫힌 상태 파지 판정 상세 */
export type Game3ValidGripMeasure = {
  valid: boolean
  coverageRatio: number
  leftTouches: boolean
  rightTouches: boolean
  leftPenetrates: boolean
  rightPenetrates: boolean
}

export type Game3ViewportHandle = {
  /** 매달린 인형의 실제 화면 위치(world %) — 낙하 시작점 */
  measureHeldDoll: () => Game3HeldDollMeasure | null
  /** 바닥 인형 스프라이트 중심 (world %) — 잡는 순간 위치 동기 */
  measureDollCenter: (dollId: number) => Game3HeldDollMeasure | null
  /** idle DOM을 측정해 2D 하강 종료점 계산 (몸통=바닥/인형 충돌) */
  measureDescentStop: () => Game3DescentStopMeasure | null
  /** 현재 렌더에서 다리(아랫팔)가 인형 실루엣에 닿았는지 */
  measureDescentLegContacts: () => Game3DescentLegContacts | null
  /** 현재 렌더에서 몸통이 인형 실루엣에 얹혔는지 (침범 제외) */
  measureDescentBodyRest: () => Game3DescentBodyRest | null
  /** 몸통/다리가 인형 실루엣을 뚫고 들어갔는지 */
  measureClawPenetration: () => Game3ClawPenetration | null
  /** 집게 모든 부품(몸통·다리·팁) 중 가장 아래 y (world %). 바닥선 비교용 */
  measureClawLowestBottom: () => number | null
  /** 현재 lift에서 바닥선(floorY)에 닿을 때까지 더 내려갈 수 있는 최소 lift */
  measureFloorLiftFromDom: (currentLiftPercent: number) => number | null
  /** 중심선 기반 — 보이는 팔/몸통이 인형 실루엣에 닿음/파고듦 (하강 물리용) */
  measureClawContact: () => Game3ClawContact | null
  /** 집게발 팁이 인형 실루엣에 닿았는지 — 오므림 멈춤용 */
  measureTipContact: () => Game3TipContact | null
  /** 집게발 팁 world 위치 + 접촉 인형 — 하강 접촉 물리용 */
  measureTipAnchors: () => Game3TipAnchors | null
  /** carry 중 인형 중심 — DOM 팁 + grab delta */
  measureCarriedDollCenter: () => { xPercent: number; centerYPercent: number } | null
  /** 양쪽 팁이 같은 인형 실루엣에 닿으면 잡힘 */
  measureSegmentGrasp: (dollId: number) => Game3SegmentGrasp | null
  /** 닫힌 다리 — 침범 없음 + 양쪽 접촉 + 감싸기 비율 (상세) */
  measureValidGripGrasp: (dollId: number) => Game3ValidGripMeasure | null
  /** @deprecated measureValidGripGrasp().valid 사용 */
  measureGripGrasp: (dollId: number) => boolean
}

type PlayfieldRect = { left: number; right: number; top: number; bottom: number }

function sampleDollSilhouetteAtWorldPoint(
  xPercent: number,
  yPercent: number,
  dollRect: PlayfieldRect,
  maskSrc: string,
  flipX: boolean,
): boolean {
  return sampleSilhouetteAtWorldPoint(xPercent, yPercent, dollRect, maskSrc, flipX)
}

function domRectTouchesDollSilhouette(
  part: PlayfieldRect,
  dollRect: PlayfieldRect,
  maskSrc: string,
  flipX: boolean,
): boolean {
  const cols = 5
  const rows = 6
  for (let c = 0; c <= cols; c += 1) {
    const x = part.left + ((part.right - part.left) * c) / cols
    for (let r = 0; r <= rows; r += 1) {
      const y = part.top + ((part.bottom - part.top) * r) / rows
      if (sampleDollSilhouetteAtWorldPoint(x, y, dollRect, maskSrc, flipX)) {
        return true
      }
    }
  }
  return false
}

type Game3ViewportProps = {
  claw: Game2ClawState
  dolls: readonly Game3DollState[]
}

export const Game3Viewport = forwardRef<Game3ViewportHandle, Game3ViewportProps>(
  function Game3Viewport({ claw, dolls }, ref) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const playfieldRef = useRef<HTMLDivElement>(null)
  const clawRef = useRef(claw)
  clawRef.current = claw
  const [metrics, setMetrics] = useState({ viewportW: 0, viewportH: 0, scale: 1 })
  const [carriedCenter, setCarriedCenter] = useState<{
    xPercent: number
    centerYPercent: number
  } | null>(null)

  useImperativeHandle(ref, () => {
    const measureValidGripGrasp = (dollId: number): Game3ValidGripMeasure | null => {
      const field = playfieldRef.current
      if (!field) return null
      const f = field.getBoundingClientRect()
      if (f.width <= 0 || f.height <= 0) return null

      const rectPct = (el: Element): PlayfieldRect => {
        const r = el.getBoundingClientRect()
        return {
          left: ((r.left - f.left) / f.width) * 100,
          right: ((r.right - f.left) / f.width) * 100,
          top: ((r.top - f.top) / f.height) * 100,
          bottom: ((r.bottom - f.top) / f.height) * 100,
        }
      }

      const leftTip = field.querySelector('.g2-claw__arm--left .g2-claw__tip')
      const rightTip = field.querySelector('.g2-claw__arm--right .g2-claw__tip')
      const dollEl = field.querySelector<HTMLElement>(`.g3-dolls__item[data-doll-id="${dollId}"]`)
      if (!leftTip || !rightTip || !dollEl) return null

      const spriteEl = dollEl.querySelector('.g3-doll-sprite') ?? dollEl
      const maskSrc =
        dollEl.getAttribute('data-doll-mask-src') ??
        (spriteEl instanceof HTMLImageElement ? spriteEl.src : '')
      const flipX = dollEl.getAttribute('data-doll-face-x') === '-1'
      const dollRect = rectPct(spriteEl)
      const leftTipRect = rectPct(leftTip)
      const rightTipRect = rectPct(rightTip)
      const leftTouches = domRectTouchesDollSilhouette(leftTipRect, dollRect, maskSrc, flipX)
      const rightTouches = domRectTouchesDollSilhouette(rightTipRect, dollRect, maskSrc, flipX)
      const valid = leftTouches && rightTouches

      return {
        valid,
        coverageRatio: valid ? 1 : 0,
        leftTouches,
        rightTouches,
        leftPenetrates: false,
        rightPenetrates: false,
      }
    }

    type Pt = { x: number; y: number }
    type DollSil = { rect: PlayfieldRect; maskSrc: string; flipX: boolean; centerX: number }

    /** 선분 AB(중심선) 위 샘플 중 실루엣 내부 개수 */
    const countSegmentInside = (a: Pt, b: Pt, sil: DollSil, samples = 18): number => {
      let count = 0
      for (let i = 0; i <= samples; i += 1) {
        const t = i / samples
        const x = a.x + (b.x - a.x) * t
        const y = a.y + (b.y - a.y) * t
        if (sampleSilhouetteAtWorldPoint(x, y, sil.rect, sil.maskSrc, sil.flipX)) count += 1
      }
      return count
    }

    const getContactBuilder = () => {
      const field = playfieldRef.current
      if (!field) return null
      const f = field.getBoundingClientRect()
      if (f.width <= 0 || f.height <= 0) return null

      const centerPct = (el: Element | null): Pt | null => {
        if (!el) return null
        const r = el.getBoundingClientRect()
        return {
          x: ((r.left + r.width / 2 - f.left) / f.width) * 100,
          y: ((r.top + r.height / 2 - f.top) / f.height) * 100,
        }
      }
      const rectPct = (el: Element): PlayfieldRect => {
        const r = el.getBoundingClientRect()
        return {
          left: ((r.left - f.left) / f.width) * 100,
          right: ((r.right - f.left) / f.width) * 100,
          top: ((r.top - f.top) / f.height) * 100,
          bottom: ((r.bottom - f.top) / f.height) * 100,
        }
      }

      const q = (sel: string) => field.querySelector(sel)
      const bodyEl = q('.g2-claw__body')
      const lPivot = centerPct(q('.g2-claw__pivot--left'))
      const rPivot = centerPct(q('.g2-claw__pivot--right'))
      const lJoint = centerPct(q('.g2-claw__arm--left .g2-claw__arm-joint'))
      const rJoint = centerPct(q('.g2-claw__arm--right .g2-claw__arm-joint'))
      const lTip = centerPct(q('.g2-claw__arm--left .g2-claw__tip'))
      const rTip = centerPct(q('.g2-claw__arm--right .g2-claw__tip'))
      const lTipEl = q('.g2-claw__arm--left .g2-claw__tip')
      const rTipEl = q('.g2-claw__arm--right .g2-claw__tip')
      if (!bodyEl || !lPivot || !rPivot || !lJoint || !rJoint || !lTip || !rTip || !lTipEl || !rTipEl) {
        return null
      }
      const bodyRect = rectPct(bodyEl)
      const lTipRect = rectPct(lTipEl)
      const rTipRect = rectPct(rTipEl)
      const bodyTop: Pt = { x: (bodyRect.left + bodyRect.right) / 2, y: bodyRect.top }
      const bodyBottom: Pt = { x: (bodyRect.left + bodyRect.right) / 2, y: bodyRect.bottom }

      const dollSils: { id: number; sil: DollSil }[] = []
      for (const el of field.querySelectorAll<HTMLElement>('.g3-dolls__item[data-doll-id]')) {
        const id = Number(el.getAttribute('data-doll-id'))
        if (Number.isNaN(id)) continue
        const spriteEl = el.querySelector('.g3-doll-sprite') ?? el
        const maskSrc =
          el.getAttribute('data-doll-mask-src') ??
          (spriteEl instanceof HTMLImageElement ? spriteEl.src : '')
        const flipX = el.getAttribute('data-doll-face-x') === '-1'
        const rect = rectPct(spriteEl)
        dollSils.push({
          id,
          sil: { rect, maskSrc, flipX, centerX: (rect.left + rect.right) / 2 },
        })
      }

      return {
        bodyTop,
        bodyBottom,
        bodyRect,
        lPivot,
        rPivot,
        lJoint,
        rJoint,
        lTip,
        rTip,
        lTipRect,
        rTipRect,
        dollSils,
      }
    }

    const tipTouchesSil = (tipRect: PlayfieldRect, sil: DollSil): boolean =>
      domRectTouchesDollSilhouette(tipRect, sil.rect, sil.maskSrc, sil.flipX)

    const CLAW_FLOOR_PARTS =
      '.g2-claw__body, .g2-claw__arm-upper, .g2-claw__arm-lower, .g2-claw__tip'

    const measureClawLowestBottom = (): number | null => {
      const field = playfieldRef.current
      if (!field) return null
      const f = field.getBoundingClientRect()
      if (f.width <= 0 || f.height <= 0) return null
      const parts = field.querySelectorAll(CLAW_FLOOR_PARTS)
      if (parts.length === 0) return null
      let lowest = Number.NEGATIVE_INFINITY
      for (const el of parts) {
        const r = el.getBoundingClientRect()
        const bottom = ((r.bottom - f.top) / f.height) * 100
        if (bottom > lowest) lowest = bottom
      }
      return Number.isFinite(lowest) ? lowest : null
    }

    /** lift 1% ↑ → 모든 부품 y가 1% ↓. lowest가 floorY를 넘지 않게 하는 최소 lift. */
    const measureFloorLiftFromDom = (currentLiftPercent: number): number | null => {
      const lowest = measureClawLowestBottom()
      if (lowest === null) return null
      return Math.max(0, currentLiftPercent - (GAME3_WORLD.floorY - lowest))
    }

    const measureTipContact = (): Game3TipContact | null => {
      const anchors = measureTipAnchors()
      if (!anchors) return null
      return { left: anchors.left.touch, right: anchors.right.touch }
    }

    const measureTipAnchors = (): Game3TipAnchors | null => {
      const b = getContactBuilder()
      if (!b) return null

      const anchorFor = (tipRect: PlayfieldRect): Game3TipAnchor => {
        const x = (tipRect.left + tipRect.right) / 2
        const y = (tipRect.top + tipRect.bottom) / 2
        let touch = false
        let dollId: number | null = null
        let bestDist = Number.POSITIVE_INFINITY
        for (const { id, sil } of b.dollSils) {
          if (!tipTouchesSil(tipRect, sil)) continue
          touch = true
          const dist = Math.abs(x - sil.centerX)
          if (dist < bestDist) {
            bestDist = dist
            dollId = id
          }
        }
        return { x, y, touch, dollId }
      }

      return {
        left: anchorFor(b.lTipRect),
        right: anchorFor(b.rTipRect),
      }
    }

    /** 박스 영역(초록 몸통) 그리드 샘플 중 실루엣 내부 개수 */
    const countBoxInside = (rect: PlayfieldRect, sil: DollSil, nx = 5, ny = 5): number => {
      let count = 0
      for (let iy = 0; iy <= ny; iy += 1) {
        for (let ix = 0; ix <= nx; ix += 1) {
          const x = rect.left + ((rect.right - rect.left) * ix) / nx
          const y = rect.top + ((rect.bottom - rect.top) * iy) / ny
          if (sampleSilhouetteAtWorldPoint(x, y, sil.rect, sil.maskSrc, sil.flipX)) count += 1
        }
      }
      return count
    }

    // 중심선 18 샘플 기준: 1=경계 접촉, 3=확실히 파고듦
    const LEG_TOUCH = 1
    const LEG_PEN = 3
    // 몸통 박스 36 샘플 기준
    const BODY_TOUCH = 1
    const BODY_PEN = 4

    const measureClawContact = (): Game3ClawContact | null => {
      const b = getContactBuilder()
      if (!b) return null

      const seg = (a: Pt, c: Pt): Game3PartContact => {
        let inside = 0
        for (const { sil } of b.dollSils) {
          inside = Math.max(inside, countSegmentInside(a, c, sil))
        }
        return { pen: inside >= LEG_PEN, touch: inside >= LEG_TOUCH, inside }
      }

      let bodyInside = 0
      for (const { sil } of b.dollSils) {
        bodyInside = Math.max(bodyInside, countBoxInside(b.bodyRect, sil))
      }

      return {
        body: { pen: bodyInside >= BODY_PEN, touch: bodyInside >= BODY_TOUCH, inside: bodyInside },
        leftShoulder: seg(b.lPivot, b.lJoint),
        rightShoulder: seg(b.rPivot, b.rJoint),
        leftLeg: seg(b.lJoint, b.lTip),
        rightLeg: seg(b.rJoint, b.rTip),
      }
    }

    const measureSegmentGrasp = (dollId: number): Game3SegmentGrasp | null => {
      const b = getContactBuilder()
      if (!b) return null
      const target = b.dollSils.find((d) => d.id === dollId)
      if (!target) return null
      const { sil } = target

      // 잡기 = 양쪽 집게발 팁(.g2-claw__tip)이 같은 인형 실루엣에 닿을 때만
      const leftTouch = tipTouchesSil(b.lTipRect, sil)
      const rightTouch = tipTouchesSil(b.rTipRect, sil)
      const valid = leftTouch && rightTouch

      return {
        valid,
        leftTouch,
        rightTouch,
        leftInside: leftTouch ? 1 : 0,
        rightInside: rightTouch ? 1 : 0,
      }
    }

    return {
    measureClawLowestBottom,
    measureFloorLiftFromDom,
    measureClawContact,
    measureTipContact,
    measureTipAnchors,
    measureCarriedDollCenter() {
      const tips = measureTipAnchors()
      return getGame3CarriedDollCenterFromTips(clawRef.current, tips)
    },
    measureSegmentGrasp,
    measureHeldDoll() {
      const field = playfieldRef.current
      const img = field?.querySelector<HTMLElement>('.g3-carried-doll img')
      if (!field || !img) return null
      const f = field.getBoundingClientRect()
      const r = img.getBoundingClientRect()
      if (f.width <= 0 || f.height <= 0) return null
      return {
        xPercent: ((r.left + r.width / 2 - f.left) / f.width) * 100,
        centerYPercent: ((r.top + r.height / 2 - f.top) / f.height) * 100,
      }
    },
    measureDollCenter(dollId: number) {
      const field = playfieldRef.current
      const img = field?.querySelector<HTMLElement>(
        `.g3-dolls__item[data-doll-id="${dollId}"] .g3-doll-sprite`,
      )
      if (!field || !img) return null
      const f = field.getBoundingClientRect()
      const r = img.getBoundingClientRect()
      if (f.width <= 0 || f.height <= 0) return null
      return {
        xPercent: ((r.left + r.width / 2 - f.left) / f.width) * 100,
        centerYPercent: ((r.top + r.height / 2 - f.top) / f.height) * 100,
      }
    },
    measureDescentStop() {
      const field = playfieldRef.current
      if (!field) return null
      const f = field.getBoundingClientRect()
      if (f.width <= 0 || f.height <= 0) return null

      type Rect = { left: number; right: number; top: number; bottom: number }
      const rectPct = (el: Element): Rect => {
        const r = el.getBoundingClientRect()
        return {
          left: ((r.left - f.left) / f.width) * 100,
          right: ((r.right - f.left) / f.width) * 100,
          top: ((r.top - f.top) / f.height) * 100,
          bottom: ((r.bottom - f.top) / f.height) * 100,
        }
      }

      const partEls = field.querySelectorAll(CLAW_FLOOR_PARTS)
      const bodyEl = field.querySelector('.g2-claw__body')
      if (partEls.length === 0 || !bodyEl) return null

      const partRects = Array.from(partEls, rectPct)
      const bodyRect = rectPct(bodyEl)
      const clawCenterX = (bodyRect.left + bodyRect.right) / 2
      const lowestBottom = Math.max(...partRects.map((r) => r.bottom))

      const idleLift = GAME3_CLAW.cableVisualLift
      const floorY = GAME3_WORLD.floorY
      const floorShiftMax = Math.max(0, floorY - lowestBottom)

      /** 부품 rect가 실루엣 윗선에 닿기 위해 필요한 하강량 (world %) */
      const touchShiftForParts = (
        parts: Rect[],
        dr: Rect,
        maskSrc: string,
        flipX: boolean,
      ): number => {
        const boxW = dr.right - dr.left
        const boxH = dr.bottom - dr.top
        if (boxW <= 0 || boxH <= 0) return Number.POSITIVE_INFINITY

        const bounds = getDollOpaqueBounds(maskSrc)
        let need = Number.POSITIVE_INFINITY
        for (const p of parts) {
          const ox0 = Math.max(p.left, dr.left)
          const ox1 = Math.min(p.right, dr.right)
          if (ox1 <= ox0) continue

          const u0 = (ox0 - dr.left) / boxW
          const u1 = (ox1 - dr.left) / boxW
          const topV = getDollSilhouetteTopV(maskSrc, u0, u1, flipX)

          let dollTopY: number
          if (topV !== null && topV < 1) {
            dollTopY = dr.top + topV * boxH
          } else if (topV === null && bounds) {
            // 마스크 미로드 — 불투명 영역 상단만 사용
            dollTopY = dr.top + bounds.top * boxH
          } else {
            // 해당 x구간 실루엣 없음(topV≥1) — 이 부품은 스킵
            continue
          }

          const req = Math.max(0, dollTopY - p.bottom)
          if (req < need) need = req
        }
        return need
      }

      const dollEls = field.querySelectorAll<HTMLElement>('.g3-dolls__item[data-doll-id]')
      let bestShift = Number.POSITIVE_INFINITY
      let bestId: number | null = null
      let nearestId: number | null = null
      let nearestDist = Number.POSITIVE_INFINITY

      for (const el of dollEls) {
        const id = Number(el.getAttribute('data-doll-id'))
        if (Number.isNaN(id)) continue
        const spriteEl = el.querySelector('.g3-doll-sprite') ?? el
        const maskSrc =
          el.getAttribute('data-doll-mask-src') ??
          (spriteEl instanceof HTMLImageElement ? spriteEl.src : '')
        const flipX = el.getAttribute('data-doll-face-x') === '-1'
        const dr = rectPct(spriteEl)
        const dollCenterX = (dr.left + dr.right) / 2
        const distX = Math.abs(clawCenterX - dollCenterX)
        if (distX > GAME3_DOLLS.grabRadiusX) continue

        if (distX < nearestDist) {
          nearestDist = distX
          nearestId = id
        }

        const greenShift = touchShiftForParts([bodyRect], dr, maskSrc, flipX)

        // 하강 정지는 몸통(초록)만 — 다리 걸림은 멈추지 않고 slide/tilt로 처리
        if (greenShift < bestShift) {
          bestShift = greenShift
          bestId = id
        }
      }

      let shiftDown: number
      let hitDollId: number | null = null
      if (bestShift < Number.POSITIVE_INFINITY) {
        hitDollId = bestId
        shiftDown = Math.min(bestShift, floorShiftMax)
      } else if (nearestId !== null) {
        // 실루엣 shift 계산 실패해도 grabRadius 안 가장 가까운 인형은 잡기 시도
        hitDollId = nearestId
        shiftDown = floorShiftMax
      } else {
        shiftDown = floorShiftMax
      }
      shiftDown = Math.max(0, shiftDown)

      return {
        clawLiftPercent: Math.max(0, idleLift - shiftDown),
        hitDollId,
      }
    },
    measureDescentLegContacts() {
      const field = playfieldRef.current
      if (!field) return null
      const f = field.getBoundingClientRect()
      if (f.width <= 0 || f.height <= 0) return null

      const rectPct = (el: Element): PlayfieldRect => {
        const r = el.getBoundingClientRect()
        return {
          left: ((r.left - f.left) / f.width) * 100,
          right: ((r.right - f.left) / f.width) * 100,
          top: ((r.top - f.top) / f.height) * 100,
          bottom: ((r.bottom - f.top) / f.height) * 100,
        }
      }

      const leftLower = field.querySelector('.g2-claw__arm--left .g2-claw__arm-lower')
      const rightLower = field.querySelector('.g2-claw__arm--right .g2-claw__arm-lower')
      if (!leftLower || !rightLower) return null

      const leftRect = rectPct(leftLower)
      const rightRect = rectPct(rightLower)
      let left = false
      let right = false

      for (const el of field.querySelectorAll<HTMLElement>('.g3-dolls__item[data-doll-id]')) {
        const spriteEl = el.querySelector('.g3-doll-sprite') ?? el
        const maskSrc =
          el.getAttribute('data-doll-mask-src') ??
          (spriteEl instanceof HTMLImageElement ? spriteEl.src : '')
        const flipX = el.getAttribute('data-doll-face-x') === '-1'
        const dollRect = rectPct(spriteEl)
        if (domRectTouchesDollSilhouette(leftRect, dollRect, maskSrc, flipX)) left = true
        if (domRectTouchesDollSilhouette(rightRect, dollRect, maskSrc, flipX)) right = true
      }

      return { left, right }
    },
    measureDescentBodyRest() {
      const field = playfieldRef.current
      if (!field) return null
      const f = field.getBoundingClientRect()
      if (f.width <= 0 || f.height <= 0) return null

      const rectPct = (el: Element): PlayfieldRect => {
        const r = el.getBoundingClientRect()
        return {
          left: ((r.left - f.left) / f.width) * 100,
          right: ((r.right - f.left) / f.width) * 100,
          top: ((r.top - f.top) / f.height) * 100,
          bottom: ((r.bottom - f.top) / f.height) * 100,
        }
      }

      const bodyEl = field.querySelector('.g2-claw__body')
      if (!bodyEl) return null
      const bodyRect = rectPct(bodyEl)
      const bodyCenterX = (bodyRect.left + bodyRect.right) / 2

      let bestId: number | null = null
      let bestDist = Number.POSITIVE_INFINITY

      for (const el of field.querySelectorAll<HTMLElement>('.g3-dolls__item[data-doll-id]')) {
        const id = Number(el.getAttribute('data-doll-id'))
        if (Number.isNaN(id)) continue
        const spriteEl = el.querySelector('.g3-doll-sprite') ?? el
        const maskSrc =
          el.getAttribute('data-doll-mask-src') ??
          (spriteEl instanceof HTMLImageElement ? spriteEl.src : '')
        const flipX = el.getAttribute('data-doll-face-x') === '-1'
        const dollRect = rectPct(spriteEl)
        if (!bodyRestsOnSilhouetteSurface(bodyRect, dollRect, maskSrc, flipX)) continue
        const dist = Math.abs(bodyCenterX - (dollRect.left + dollRect.right) / 2)
        if (dist < bestDist) {
          bestDist = dist
          bestId = id
        }
      }

      return { resting: bestId !== null, dollId: bestId }
    },
    measureClawPenetration() {
      const field = playfieldRef.current
      if (!field) return null
      const f = field.getBoundingClientRect()
      if (f.width <= 0 || f.height <= 0) return null

      const rectPct = (el: Element): PlayfieldRect => {
        const r = el.getBoundingClientRect()
        return {
          left: ((r.left - f.left) / f.width) * 100,
          right: ((r.right - f.left) / f.width) * 100,
          top: ((r.top - f.top) / f.height) * 100,
          bottom: ((r.bottom - f.top) / f.height) * 100,
        }
      }

      const bodyEl = field.querySelector('.g2-claw__body')
      const leftLower = field.querySelector('.g2-claw__arm--left .g2-claw__arm-lower')
      const rightLower = field.querySelector('.g2-claw__arm--right .g2-claw__arm-lower')
      const leftUpper = field.querySelector('.g2-claw__arm--left .g2-claw__arm-upper')
      const rightUpper = field.querySelector('.g2-claw__arm--right .g2-claw__arm-upper')
      if (!bodyEl || !leftLower || !rightLower || !leftUpper || !rightUpper) return null

      const bodyRect = rectPct(bodyEl)
      const leftLegRect = rectPct(leftLower)
      const rightLegRect = rectPct(rightLower)
      const leftShoulderRect = rectPct(leftUpper)
      const rightShoulderRect = rectPct(rightUpper)
      let body = false
      let leftLeg = false
      let rightLeg = false
      let leftShoulder = false
      let rightShoulder = false

      for (const el of field.querySelectorAll<HTMLElement>('.g3-dolls__item[data-doll-id]')) {
        const spriteEl = el.querySelector('.g3-doll-sprite') ?? el
        const maskSrc =
          el.getAttribute('data-doll-mask-src') ??
          (spriteEl instanceof HTMLImageElement ? spriteEl.src : '')
        const flipX = el.getAttribute('data-doll-face-x') === '-1'
        const dollRect = rectPct(spriteEl)
        if (partInvadesDollSilhouette(bodyRect, dollRect, maskSrc, flipX, 'body')) body = true
        if (partInvadesDollSilhouette(leftLegRect, dollRect, maskSrc, flipX, 'limb')) {
          leftLeg = true
        }
        if (partInvadesDollSilhouette(rightLegRect, dollRect, maskSrc, flipX, 'limb')) {
          rightLeg = true
        }
        if (partInvadesDollSilhouette(leftShoulderRect, dollRect, maskSrc, flipX, 'limb')) {
          leftShoulder = true
        }
        if (partInvadesDollSilhouette(rightShoulderRect, dollRect, maskSrc, flipX, 'limb')) {
          rightShoulder = true
        }
      }

      return { body, leftLeg, rightLeg, leftShoulder, rightShoulder }
    },
    measureValidGripGrasp,
    measureGripGrasp(dollId: number) {
      return measureValidGripGrasp(dollId)?.valid ?? false
    },
  }
  })

  const updateMetrics = useCallback(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const rect = viewport.getBoundingClientRect()
    const scale = rect.height / GAME3_WORLD.height
    setMetrics({
      viewportW: rect.width,
      viewportH: rect.height,
      scale,
    })
  }, [])

  useLayoutEffect(() => {
    updateMetrics()
    const viewport = viewportRef.current
    if (!viewport) return

    const observer = new ResizeObserver(updateMetrics)
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [updateMetrics])

  // carry 중 — 집게 팁 DOM 측정 후 고정 delta로 인형 중심 동기 (몸체만 펴질 때 팁 이동에 대응)
  useLayoutEffect(() => {
    if (claw.heldDollId === null) {
      setCarriedCenter(null)
      return
    }

    const field = playfieldRef.current
    if (!field) return
    const f = field.getBoundingClientRect()
    if (f.width <= 0 || f.height <= 0) return

    const tipCenter = (el: Element | null) => {
      if (!el) return null
      const r = el.getBoundingClientRect()
      return {
        x: ((r.left + r.width / 2 - f.left) / f.width) * 100,
        y: ((r.top + r.height / 2 - f.top) / f.height) * 100,
      }
    }

    const left = tipCenter(field.querySelector('.g2-claw__arm--left .g2-claw__tip'))
    const right = tipCenter(field.querySelector('.g2-claw__arm--right .g2-claw__tip'))
    if (!left || !right) return

    const center = getGame3CarriedDollCenterFromTips(claw, { left, right })
    if (center) setCarriedCenter(center)
  }, [
    claw.heldDollId,
    claw.xPercent,
    claw.clawLiftPercent,
    claw.descendT,
    claw.clawTiltDeg,
    claw.grabArmTiltDeg,
    claw.gripTLeft,
    claw.gripTRight,
    claw.heldGripDeltaX,
    claw.heldGripDeltaY,
    claw.heldPinCenterX,
    claw.heldPinCenterY,
  ])

  const worldWidthPx = getGame3WorldWidthPx(metrics.viewportH)
  const scrollLeftPx = useMemo(
    () => getGame3ScrollLeftPx(claw.xPercent, metrics.viewportW, worldWidthPx),
    [claw.xPercent, metrics.viewportW, worldWidthPx],
  )

  const heldDoll = getGame3DollById(dolls, claw.heldDollId)

  return (
    <div
      className={`g3-viewport${GAME3_DEV_OVERLAYS ? ' g3-viewport--dev-overlays' : ''}`}
      ref={viewportRef}
    >
      <div
        className="g3-world"
        style={{
          width: `${worldWidthPx}px`,
          height: `${metrics.viewportH}px`,
          transform: `translateX(${-scrollLeftPx}px)`,
          ['--g3-stage-scale' as string]: `${metrics.scale}`,
          ['--g3-rig-visual-scale' as string]: `${GAME3_CLAW.rigVisualScale}`,
          ['--g3-doll-size' as string]: `${GAME3_DOLLS.emojiSizePx}px`,
        }}
      >
        <img
          className="g3-world__bg"
          src={game3RoomBackground}
          alt=""
          draggable={false}
        />

        <div className="g3-world__playfield" ref={playfieldRef}>
          {GAME3_DEV_OVERLAYS ? (
            <>
              <div
                className="g3-chute-zone"
                style={{
                  left: `${GAME3_CHUTE.leftX}%`,
                  width: `${GAME3_CHUTE.rightX - GAME3_CHUTE.leftX}%`,
                  top: `${GAME3_CHUTE.topY}%`,
                  bottom: `${100 - GAME3_CHUTE.bottomY}%`,
                }}
                aria-hidden="true"
              />
              <div
                className="g3-guide-boundary"
                style={{ left: `${GAME3_GUIDE.giftBoxBoundaryX}%` }}
                aria-hidden="true"
              />
              <div
                className="g3-guide-floor"
                style={{ bottom: `${100 - GAME3_WORLD.floorY}%` }}
                aria-hidden="true"
              />
            </>
          ) : null}
          <Game3Dolls dolls={dolls} heldDollId={claw.heldDollId} />
          <Game3FallingDolls
            dolls={dolls}
            playfieldW={worldWidthPx}
            playfieldH={metrics.viewportH}
            stageScale={metrics.scale}
          />
          <Game2Claw
            claw={{
              ...claw,
              playY: GAME3_CLAW.playY,
            }}
            playfieldAspectHOverW={
              GAME3_WORLD.height / (GAME3_WORLD.width * GAME3_WORLD.widthScale)
            }
            renderOverride={getGame3ClawRender(
              claw.xPercent,
              claw.descendT,
              claw.clawLiftPercent ?? 0,
            )}
            varOverrides={{
              '--g2-claw-rail-y': '0%',
              '--g2-cable-visual-trim': '0%',
              '--g2-cable-visual-extend': '0%',
              '--g2-cable-width': 'calc(7px * var(--g3-stage-scale, 1))',
              '--g2-doll-size': `${GAME3_DOLLS.emojiSizePx}px`,
              // 벌린 상태일 때만 다리(아랫팔) 각도를 덜 몰리게 조정 (잡기 애니메이션은 그대로)
              ...(claw.open
                ? {
                    '--g2-lower-l': `${-GAME3_CLAW.idleLowerArmDeg}deg`,
                    '--g2-lower-r': `${GAME3_CLAW.idleLowerArmDeg}deg`,
                  }
                : {}),
              '--g3-claw-body-tilt': `${claw.clawTiltDeg ?? 0}deg`,
              '--g3-claw-shoulder-tilt': `${claw.clawTiltDeg ?? 0}deg`,
            }}
            carrying={claw.heldDollId !== null}
          />
          {carriedCenter && heldDoll ? (
            <Game3CarriedDoll
              doll={heldDoll}
              centerXPercent={carriedCenter.xPercent}
              centerYPercent={carriedCenter.centerYPercent}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
  },
)
