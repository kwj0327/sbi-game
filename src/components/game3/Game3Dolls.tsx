import { useEffect, useState } from 'react'
import { preloadDollAlphaMasks } from '../../game/dollAlphaMask'
import type { Game3DollState } from '../../game/game3PlayArea'
import { getGame3DollVisualY } from '../../game/game3PlayArea'
import './game3-dolls.css'

type Game3DollsProps = {
  dolls: readonly Game3DollState[]
  heldDollId: number | null
}

export function Game3Dolls({ dolls, heldDollId }: Game3DollsProps) {
  const [, setMasksReady] = useState(0)

  useEffect(() => {
    const srcs = Array.from(new Set(dolls.map((doll) => doll.imageSrc)))
    let cancelled = false
    preloadDollAlphaMasks(srcs).then(() => {
      if (!cancelled) setMasksReady((n) => n + 1)
    })
    return () => {
      cancelled = true
    }
  }, [dolls])

  const visible = dolls
    .filter((doll) => !doll.captured && !doll.falling && doll.id !== heldDollId)
    .sort((a, b) => a.stackLevel - b.stackLevel)

  return (
    <div className="g3-dolls" aria-hidden="true">
      {visible.map((doll) => (
        <div
          key={doll.id}
          data-doll-id={doll.id}
          data-doll-mask-src={doll.imageSrc}
          data-doll-face-x={doll.faceScaleX}
          className={`g3-dolls__item${doll.stackLevel > 0 ? ' g3-dolls__item--stacked' : ''}`}
          style={{
            left: `${doll.xPercent}%`,
            bottom: `${100 - getGame3DollVisualY(doll.stackLevel)}%`,
            zIndex: doll.stackLevel + 3,
            ['--g3-doll-rotate' as string]: `${doll.rotateDeg}deg`,
            ['--g3-doll-face-x' as string]: `${doll.faceScaleX}`,
          }}
        >
          <div
            className="g3-doll-silhouette"
            aria-hidden="true"
            style={{
              ['--g3-doll-mask' as string]: `url(${doll.imageSrc})`,
            }}
          />
          <img src={doll.imageSrc} alt="" className="g3-doll-sprite" draggable={false} />
        </div>
      ))}
    </div>
  )
}
