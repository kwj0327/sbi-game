import { useRef } from 'react'
import { GAME2_CHUTE_FALL } from '../../game/game2Config'
import { computeGame2FallToChute } from '../../game/game2ChuteFallGeometry'
import type { Game2DollState } from '../../game/game2PlayArea'
import './game2-falling-doll.css'

type Game2FallingDollsProps = {
  dolls: readonly Game2DollState[]
  playfieldW: number
  playfieldH: number
  stageScale: number
}

export function Game2FallingDolls({
  dolls,
  playfieldW,
  playfieldH,
  stageScale,
}: Game2FallingDollsProps) {
  const fallCacheRef = useRef(new Map<number, ReturnType<typeof computeGame2FallToChute>>())
  const falling = dolls.filter((doll) => doll.falling)

  for (const doll of dolls) {
    if (!doll.falling) {
      fallCacheRef.current.delete(doll.id)
    }
  }

  if (falling.length === 0) return null

  const { fallDurationMs, scaleEnd } = GAME2_CHUTE_FALL

  return (
    <div
      className="g2-falling-dolls"
      style={{
        ['--g2-fall-duration' as string]: `${fallDurationMs}ms`,
      }}
      aria-hidden="true"
    >
      {falling.map((doll) => {
        if (!fallCacheRef.current.has(doll.id)) {
          fallCacheRef.current.set(
            doll.id,
            computeGame2FallToChute(
              playfieldW,
              playfieldH,
              doll.xPercent,
              doll.playY,
              stageScale,
            ),
          )
        }

        const fall = fallCacheRef.current.get(doll.id)!
        const depthScale = doll.depthScale

        return (
          <span
            key={doll.id}
            className="g2-dolls__item g2-dolls__item--falling"
            style={{
              left: `${doll.xPercent}%`,
              top: `${doll.playY}%`,
              ['--g2-doll-scale' as string]: `${depthScale}`,
              ['--g2-doll-rotate' as string]: `${doll.rotateDeg}deg`,
              ['--fall-to-center-x' as string]: `${fall.fallToCenterX}px`,
              ['--fall-to-chute' as string]: `${fall.fallToChuteY}px`,
              ['--g2-fall-scale-end' as string]: `${scaleEnd}`,
            }}
          >
            {doll.emoji}
          </span>
        )
      })}
    </div>
  )
}
