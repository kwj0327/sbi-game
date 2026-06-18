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
  DOLL_ALPHA_THRESHOLD,
  getDollAlphaMask,
  getDollOpaqueBounds,
  getDollSilhouetteTopV,
  sampleDollAlpha,
} from '../../game/dollAlphaMask'
import type { Game2ClawState } from '../../game/game2Config'
import { GAME3_CLAW, GAME3_CHUTE, GAME3_DOLLS, GAME3_GUIDE, GAME3_WORLD } from '../../game/game3Config'
import {
  getGame3DollById,
  getGame3ClawRender,
  getGame3ScrollLeftPx,
  getGame3WorldWidthPx,
  type Game3DollState,
} from '../../game/game3PlayArea'
import { Game2Claw } from '../game2/Game2Claw'
import '../game2/game2-claw.css'
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

export type Game3ViewportHandle = {
  /** 매달린 인형의 실제 화면 위치(world %) — 낙하 시작점 */
  measureHeldDoll: () => Game3HeldDollMeasure | null
  /** 바닥 인형 스프라이트 중심 (world %) — 잡는 순간 위치 동기 */
  measureDollCenter: (dollId: number) => Game3HeldDollMeasure | null
  /** idle DOM을 측정해 2D 하강 종료점 계산 (빨간 다리=바닥/인형 충돌) */
  measureDescentStop: () => Game3DescentStopMeasure | null
  /** 닫힌 다리(실제 렌더)가 인형 실루엣 양쪽에서 닿았는지 */
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
  const boxW = dollRect.right - dollRect.left
  const boxH = dollRect.bottom - dollRect.top
  if (boxW <= 0 || boxH <= 0) return false

  let u = (xPercent - dollRect.left) / boxW
  const v = (yPercent - dollRect.top) / boxH
  if (flipX) u = 1 - u
  if (u < 0 || u > 1 || v < 0 || v > 1) return false

  const mask = getDollAlphaMask(maskSrc)
  if (!mask) return false
  return sampleDollAlpha(mask, u, v) >= DOLL_ALPHA_THRESHOLD
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
  const [metrics, setMetrics] = useState({ viewportW: 0, viewportH: 0, scale: 1 })

  useImperativeHandle(ref, () => ({
    measureHeldDoll() {
      const field = playfieldRef.current
      const img = field?.querySelector<HTMLElement>('.g2-claw__held-doll img')
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

      const redEls = field.querySelectorAll('.g2-claw__arm-upper, .g2-claw__arm-lower')
      const bodyEl = field.querySelector('.g2-claw__body')
      if (redEls.length === 0 || !bodyEl) return null

      const redRects = Array.from(redEls, rectPct)
      const bodyRect = rectPct(bodyEl)
      const clawCenterX = (bodyRect.left + bodyRect.right) / 2
      const redBottom = Math.max(...redRects.map((r) => r.bottom))

      const idleLift = GAME3_CLAW.cableVisualLift
      const floorY = GAME3_WORLD.floorY
      const floorShiftMax = Math.max(0, floorY - redBottom)

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
        const redShift = touchShiftForParts(redRects, dr, maskSrc, flipX)

        let dollShift = Number.POSITIVE_INFINITY
        if (greenShift < Number.POSITIVE_INFINITY) dollShift = greenShift
        if (redShift < dollShift) dollShift = redShift

        if (dollShift < bestShift) {
          bestShift = dollShift
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
    measureGripGrasp(dollId: number) {
      const field = playfieldRef.current
      if (!field) return false
      const f = field.getBoundingClientRect()
      if (f.width <= 0 || f.height <= 0) return false

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
      const dollEl = field.querySelector<HTMLElement>(`.g3-dolls__item[data-doll-id="${dollId}"]`)
      if (!leftLower || !rightLower || !dollEl) return false

      const spriteEl = dollEl.querySelector('.g3-doll-sprite') ?? dollEl
      const maskSrc =
        dollEl.getAttribute('data-doll-mask-src') ??
        (spriteEl instanceof HTMLImageElement ? spriteEl.src : '')
      const flipX = dollEl.getAttribute('data-doll-face-x') === '-1'
      const dollRect = rectPct(spriteEl)

      return (
        domRectTouchesDollSilhouette(rectPct(leftLower), dollRect, maskSrc, flipX) &&
        domRectTouchesDollSilhouette(rectPct(rightLower), dollRect, maskSrc, flipX)
      )
    },
  }))

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

  const worldWidthPx = getGame3WorldWidthPx(metrics.viewportH)
  const scrollLeftPx = useMemo(
    () => getGame3ScrollLeftPx(claw.xPercent, metrics.viewportW, worldWidthPx),
    [claw.xPercent, metrics.viewportW, worldWidthPx],
  )

  const heldDoll = getGame3DollById(dolls, claw.heldDollId)

  return (
    <div className="g3-viewport" ref={viewportRef}>
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
            }}
            heldDoll={
              heldDoll
                ? {
                    imageSrc: heldDoll.imageSrc,
                    rotateDeg: heldDoll.rotateDeg,
                    faceScaleX: heldDoll.faceScaleX,
                    depthScale: 1 / GAME3_CLAW.rigVisualScale,
                  }
                : null
            }
          />
        </div>
      </div>
    </div>
  )
  },
)
