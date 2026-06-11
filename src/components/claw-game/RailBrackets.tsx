import type { VisibleDoll } from './types'

type RailBracketsProps = {
  dolls: VisibleDoll[]
}

/** 레일 위 연결 stem — 걸림 사각형은 인형 clip 하나만 사용 */
export function RailBrackets({ dolls }: RailBracketsProps) {
  return (
    <div className="machine-brackets" aria-hidden="true">
      {dolls.map(({ index, visual, doll }) => {
        if (doll.falling) return null

        return (
          <div
            key={index}
            className="machine-brackets__mount"
            style={{
              left: `${visual.xPercent}%`,
              top: `${visual.yPercent}%`,
              zIndex: visual.zIndex,
              opacity: visual.opacity,
              transform: `translate3d(-50%, 0, 0) scale(${visual.scale})`,
            }}
          >
            <div className="machine-brackets__stem" />
          </div>
        )
      })}
    </div>
  )
}
