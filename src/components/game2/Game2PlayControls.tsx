import type { Game2MoveDirection } from './useGame2DirectionRepeat'
import { Game2Dpad } from './Game2Dpad'
import { Game2Joystick } from './Game2Joystick'
import { useMobileViewport } from './useMobileViewport'

type Game2PlayControlsProps = {
  onMove?: (direction: Game2MoveDirection) => void
  onDescend?: () => void
  disabled?: boolean
}

export function Game2PlayControls({ onMove, onDescend, disabled = false }: Game2PlayControlsProps) {
  const isMobile = useMobileViewport()

  return (
    <div className={`game2-play-controls${disabled ? ' game2-play-controls--disabled' : ''}`}>
      {isMobile ? (
        <Game2Joystick onMove={onMove} disabled={disabled} />
      ) : (
        <Game2Dpad onMove={onMove} disabled={disabled} />
      )}

      <button
        type="button"
        className="game2-descend-btn"
        aria-label="하강"
        disabled={disabled}
        onClick={onDescend}
      >
        ↓
      </button>
    </div>
  )
}
