import { useRef } from 'react'
import { computeGame3FallToChute } from '../../game/game3ChuteFallGeometry'
import { GAME3_CHUTE_FALL } from '../../game/game3Config'
import type { Game3DollState } from '../../game/game3PlayArea'
import './game3-dolls.css'
import './game3-falling-dolls.css'

type Game3FallingDollsProps = {
  dolls: readonly Game3DollState[]
  playfieldW: number
  playfieldH: number
  stageScale: number
}

export function Game3FallingDolls({
  dolls,
  playfieldW,
  playfieldH,
  stageScale,
}: Game3FallingDollsProps) {
  const fallCacheRef = useRef(new Map<number, ReturnType<typeof computeGame3FallToChute>>())
  const falling = dolls.filter((doll) => doll.falling)

  for (const doll of dolls) {
    if (!doll.falling) {
      fallCacheRef.current.delete(doll.id)
    }
  }

  if (falling.length === 0) return null

  const { fallDurationMs, scaleEnd } = GAME3_CHUTE_FALL

  return (
    <div
      className="g3-falling-dolls"
      style={{
        ['--g3-fall-duration' as string]: `${fallDurationMs}ms`,
      }}
      aria-hidden="true"
    >
      {falling.map((doll) => {
        const startY = doll.fallReleaseVisualY ?? 0

        if (!fallCacheRef.current.has(doll.id)) {
          fallCacheRef.current.set(
            doll.id,
            computeGame3FallToChute(
              playfieldW,
              playfieldH,
              doll.xPercent,
              startY,
              stageScale,
            ),
          )
        }

        const fall = fallCacheRef.current.get(doll.id)!

        return (
          <div
            key={doll.id}
            className="g3-dolls__item g3-dolls__item--falling"
            style={{
              left: `${doll.xPercent}%`,
              bottom: `${100 - startY}%`,
              ['--g3-doll-rotate' as string]: `${doll.rotateDeg}deg`,
              ['--g3-doll-face-x' as string]: `${doll.faceScaleX}`,
              ['--fall-to-center-x' as string]: `${fall.fallToCenterX}px`,
              ['--fall-to-chute-y' as string]: `${fall.fallToChuteY}px`,
              ['--g3-fall-scale-end' as string]: `${scaleEnd}`,
            }}
          >
            <img src={doll.imageSrc} alt="" className="g3-doll-sprite" draggable={false} />
          </div>
        )
      })}
    </div>
  )
}
