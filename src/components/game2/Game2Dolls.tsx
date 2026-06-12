import type { Game2DollState } from '../../game/game2PlayArea'
import './game2-dolls.css'

type Game2DollsProps = {
  dolls: readonly Game2DollState[]
  heldDollId: number | null
}

export function Game2Dolls({ dolls, heldDollId }: Game2DollsProps) {
  const floorDolls = dolls.filter(
    (doll) => !doll.captured && !doll.falling && doll.id !== heldDollId,
  )

  return (
    <div className="g2-dolls" aria-hidden="true">
      {floorDolls.map((doll) => (
        <span
          key={doll.id}
          className="g2-dolls__item"
          style={{
            left: `${doll.xPercent}%`,
            top: `${doll.playY}%`,
            ['--g2-doll-scale' as string]: `${doll.depthScale}`,
            ['--g2-doll-rotate' as string]: `${doll.rotateDeg}deg`,
            ['--g2-doll-face-x' as string]: `${doll.faceScaleX}`,
          }}
        >
          <img
            src={doll.imageSrc}
            alt=""
            className="g2-doll-sprite"
            draggable={false}
          />
        </span>
      ))}
    </div>
  )
}
