import { useRef } from 'react'
import { ALL_DOLL_IMAGES } from '../../game/dollConfig'
import { computeFallToChute } from './chuteFallGeometry'
import type { OrbitSize, VisibleDoll } from './types'

type FallingDollLayerProps = {
  dolls: VisibleDoll[]
  sessionDollIndices: readonly number[]
  orbitSize: OrbitSize
  orbitScale: number
}

export function FallingDollLayer({
  dolls,
  sessionDollIndices,
  orbitSize,
  orbitScale,
}: FallingDollLayerProps) {
  const fallCacheRef = useRef(new Map<number, ReturnType<typeof computeFallToChute>>())

  const falling = dolls.filter(({ doll }) => doll.falling)

  for (const { doll, index } of dolls) {
    if (!doll.falling) {
      fallCacheRef.current.delete(index)
    }
  }

  if (falling.length === 0) return null

  return (
    <div className="machine-falling-dolls" aria-hidden="true">
      <div className="machine-orbit-scaler">
        {falling.map(({ index, visual }) => {
        if (!fallCacheRef.current.has(index)) {
          fallCacheRef.current.set(
            index,
            computeFallToChute(
              orbitSize.w,
              orbitSize.h,
              visual.xPercent,
              visual.yPercent,
              orbitScale,
            ),
          )
        }

        const fall = fallCacheRef.current.get(index)!

        return (
          <div
            key={index}
            className="machine-dolls__unit machine-dolls__unit--falling"
            style={{
              left: `${visual.xPercent}%`,
              top: `${visual.yPercent}%`,
              ['--fall-scale' as string]: String(visual.scale),
              ['--fall-to-center-x' as string]: `${fall.fallToCenterX}px`,
              ['--fall-to-chute' as string]: `${fall.fallToChuteY}px`,
            }}
          >
            <div className="machine-dolls__rail-offset">
              <div className="machine-dolls__clip" aria-hidden="true" />
              <div className="machine-dolls__string" aria-hidden="true" />
              <img
                src={ALL_DOLL_IMAGES[sessionDollIndices[index]]}
                alt=""
                className="machine-dolls__emoji"
                draggable={false}
              />
            </div>
          </div>
        )
      })}
      </div>
    </div>
  )
}
