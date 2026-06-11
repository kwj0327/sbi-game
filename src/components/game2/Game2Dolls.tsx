import { useMemo } from 'react'
import { DOLL_EMOJIS } from '../../game/clawGameConfig'
import { GAME2_DOLLS } from '../../game/game2Config'
import { generateGame2DollPlacements } from '../../game/game2PlayArea'
import './game2-dolls.css'

export function Game2Dolls() {
  const dolls = useMemo(
    () => generateGame2DollPlacements(GAME2_DOLLS.count, DOLL_EMOJIS),
    [],
  )

  return (
    <div
      className="g2-dolls"
      style={{ ['--g2-doll-size' as string]: `${GAME2_DOLLS.emojiSizePx}px` }}
      aria-hidden="true"
    >
      {dolls.map((doll) => (
        <span
          key={doll.id}
          className="g2-dolls__item"
          style={{
            left: `${doll.xPercent}%`,
            top: `${doll.playY}%`,
            ['--g2-doll-scale' as string]: `${doll.depthScale}`,
            ['--g2-doll-rotate' as string]: `${doll.rotateDeg}deg`,
          }}
        >
          {doll.emoji}
        </span>
      ))}
    </div>
  )
}
