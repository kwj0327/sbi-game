import type { Game2MoveDirection } from './useGame2DirectionRepeat'
import { bindReliableTap } from '../bindReliableTap'
import { Game2Dpad } from './Game2Dpad'
import { Game2Joystick } from './Game2Joystick'
import { useMobileViewport } from './useMobileViewport'

type Game2PlayControlsProps = {
  onMove?: (direction: Game2MoveDirection) => void
  onDescend?: () => void
  disabled?: boolean
  /** 좌우만 사용 (위·아래 제거) */
  horizontalOnly?: boolean
}

export function Game2PlayControls({
  onMove,
  onDescend,
  disabled = false,
  horizontalOnly = false,
}: Game2PlayControlsProps) {
  const isMobile = useMobileViewport()

  return (
    <div className={`game2-play-controls${disabled ? ' game2-play-controls--disabled' : ''}`}>
      {isMobile ? (
        <Game2Joystick onMove={onMove} disabled={disabled} horizontalOnly={horizontalOnly} />
      ) : (
        <Game2Dpad onMove={onMove} disabled={disabled} horizontalOnly={horizontalOnly} />
      )}

      <button
        type="button"
        className="game2-descend-btn"
        aria-label="하강"
        disabled={disabled}
        {...bindReliableTap(onDescend, disabled)}
      >
        ↓
      </button>
    </div>
  )
}
