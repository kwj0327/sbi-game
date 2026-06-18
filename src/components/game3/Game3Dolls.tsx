import type { Game3DollState } from '../../game/game3PlayArea'
import { getGame3DollVisualY } from '../../game/game3PlayArea'
import './game3-dolls.css'

type Game3DollsProps = {
  dolls: readonly Game3DollState[]
  heldDollId: number | null
}

export function Game3Dolls({ dolls, heldDollId }: Game3DollsProps) {
  const visible = dolls
    .filter((doll) => !doll.captured && !doll.falling && doll.id !== heldDollId)
    .sort((a, b) => a.stackLevel - b.stackLevel)

  return (
    <div className="g3-dolls" aria-hidden="true">
      {visible.map((doll) => (
        <div
          key={doll.id}
          className={`g3-dolls__item${doll.stackLevel > 0 ? ' g3-dolls__item--stacked' : ''}`}
          style={{
            left: `${doll.xPercent}%`,
            bottom: `${100 - getGame3DollVisualY(doll.stackLevel)}%`,
            zIndex: doll.stackLevel + 3,
            ['--g3-doll-rotate' as string]: `${doll.rotateDeg}deg`,
            ['--g3-doll-face-x' as string]: `${doll.faceScaleX}`,
          }}
        >
          <img src={doll.imageSrc} alt="" className="g3-doll-sprite" draggable={false} />
        </div>
      ))}
    </div>
  )
}
