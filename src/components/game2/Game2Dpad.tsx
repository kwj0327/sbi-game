import { useGame2DirectionRepeat } from './useGame2DirectionRepeat'
import type { Game2MoveDirection } from './useGame2DirectionRepeat'

type Game2DpadProps = {
  onMove?: (direction: Game2MoveDirection) => void
  disabled?: boolean
  /** 좌우만 사용 (위·아래 제거) */
  horizontalOnly?: boolean
}

export function Game2Dpad({ onMove, disabled = false, horizontalOnly = false }: Game2DpadProps) {
  const { bindDirection } = useGame2DirectionRepeat(onMove, disabled)

  return (
    <div
      className={`game2-dpad${horizontalOnly ? ' game2-dpad--horizontal' : ''}`}
      role="group"
      aria-label="방향 컨트롤"
    >
      {!horizontalOnly ? (
        <button
          type="button"
          className="game2-dpad__btn game2-dpad__btn--up"
          aria-label="위"
          disabled={disabled}
          {...bindDirection('up')}
        >
          ▲
        </button>
      ) : null}
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
      {!horizontalOnly ? (
        <button
          type="button"
          className="game2-dpad__btn game2-dpad__btn--down"
          aria-label="아래"
          disabled={disabled}
          {...bindDirection('down')}
        >
          ▼
        </button>
      ) : null}
      <span className="game2-dpad__center" aria-hidden="true" />
    </div>
  )
}
