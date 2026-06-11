import { useGame2DirectionRepeat } from './useGame2DirectionRepeat'
import type { Game2MoveDirection } from './useGame2DirectionRepeat'

type Game2DpadProps = {
  onMove?: (direction: Game2MoveDirection) => void
  disabled?: boolean
}

export function Game2Dpad({ onMove, disabled = false }: Game2DpadProps) {
  const { bindDirection } = useGame2DirectionRepeat(onMove, disabled)

  return (
    <div className="game2-dpad" role="group" aria-label="방향 컨트롤">
      <button
        type="button"
        className="game2-dpad__btn game2-dpad__btn--up"
        aria-label="위"
        disabled={disabled}
        {...bindDirection('up')}
      >
        ▲
      </button>
      <button
        type="button"
        className="game2-dpad__btn game2-dpad__btn--left"
        aria-label="왼쪽"
        disabled={disabled}
        {...bindDirection('left')}
      >
        ◀
      </button>
      <button
        type="button"
        className="game2-dpad__btn game2-dpad__btn--right"
        aria-label="오른쪽"
        disabled={disabled}
        {...bindDirection('right')}
      >
        ▶
      </button>
      <button
        type="button"
        className="game2-dpad__btn game2-dpad__btn--down"
        aria-label="아래"
        disabled={disabled}
        {...bindDirection('down')}
      >
        ▼
      </button>
      <span className="game2-dpad__center" aria-hidden="true" />
    </div>
  )
}
