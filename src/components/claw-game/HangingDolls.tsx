import { DOLL_IMAGES } from '../../game/clawGameConfig'
import type { GamePhase, VisibleDoll } from './types'

type HangingDollsProps = {
  dolls: VisibleDoll[]
  strikeTargetIndex: number | null
  phase: GamePhase
}

export function HangingDolls({
  dolls,
  strikeTargetIndex,
  phase,
}: HangingDollsProps) {
  return (
    <div className="machine-dolls">
      {dolls
        .filter(({ doll }) => !doll.falling)
        .map(({ doll, index, visual }) => {
          const isTarget = strikeTargetIndex === index && phase !== 'spinning'

          return (
            <div
              key={index}
              className={[
                'machine-dolls__unit',
                isTarget ? 'machine-dolls__unit--target' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{
                left: `${visual.xPercent}%`,
                top: `${visual.yPercent}%`,
                zIndex: visual.zIndex,
                opacity: visual.opacity,
                transform: `translate3d(-50%, 0, 0) scale(${visual.scale})`,
              }}
            >
              <div className="machine-dolls__rail-offset" aria-hidden="true">
                <div
                  className={[
                    'machine-dolls__clip',
                    doll.clipOpen ? 'machine-dolls__clip--open' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                />
                <div className="machine-dolls__string" aria-hidden="true" />
                <img
                  src={DOLL_IMAGES[index % DOLL_IMAGES.length]}
                  alt=""
                  className="machine-dolls__emoji"
                  aria-hidden="true"
                  draggable={false}
                />
              </div>
            </div>
          )
        })}
    </div>
  )
}
