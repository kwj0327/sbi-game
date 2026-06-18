import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import game3RoomBackground from '../../assets/game3-room-background.png'
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

type Game3ViewportProps = {
  claw: Game2ClawState
  dolls: readonly Game3DollState[]
}

export function Game3Viewport({ claw, dolls }: Game3ViewportProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [metrics, setMetrics] = useState({ viewportW: 0, viewportH: 0, scale: 1 })

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
  const carryOnClaw =
    heldDoll !== null &&
    (claw.phase === 'ascending' || claw.phase === 'returning' || claw.phase === 'atChute')

  return (
    <div className="g3-viewport" ref={viewportRef}>
      <div
        className="g3-world"
        style={{
          width: `${worldWidthPx}px`,
          height: `${metrics.viewportH}px`,
          transform: `translateX(${-scrollLeftPx}px)`,
          ['--g3-stage-scale' as string]: `${metrics.scale}`,
          ['--g3-doll-size' as string]: `${GAME3_DOLLS.emojiSizePx}px`,
        }}
      >
        <img
          className="g3-world__bg"
          src={game3RoomBackground}
          alt=""
          draggable={false}
        />

        <div className="g3-world__playfield">
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
          <Game3Dolls dolls={dolls} heldDollId={carryOnClaw ? claw.heldDollId : null} />
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
            }}
            heldDoll={
              carryOnClaw && heldDoll
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
}
