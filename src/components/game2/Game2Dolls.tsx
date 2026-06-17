import type { Game2DollState } from '../../game/game2PlayArea'
import './game2-dolls.css'

type Game2DollsProps = {
  dolls: readonly Game2DollState[]
  heldDollId: number | null
}

export function Game2Dolls({ dolls, heldDollId }: Game2DollsProps) {
  const floorDolls = dolls
    .filter((doll) => !doll.captured && !doll.falling && doll.id !== heldDollId)
    // 페인트 순서: 뒤(작은 playY)부터, 같은 깊이면 아래(작은 z)부터 → 앞·위가 위에 그려짐
    .slice()
    .sort((a, b) => a.playY - b.playY || a.z - b.z)

  return (
    <div className="g2-dolls" aria-hidden="true">
      {floorDolls.map((doll) => (
        <span
          key={doll.id}
          className={`g2-dolls__item${doll.settling ? ' g2-dolls__item--settling' : ''}`}
          style={{
            left: `${doll.xPercent}%`,
            top: `${doll.playY - doll.z}%`,
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
