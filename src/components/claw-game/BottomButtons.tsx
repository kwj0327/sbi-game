import type { GamePhase } from './types'

type BottomButtonsProps = {
  phase: GamePhase
  onExit: () => void
  onStop: () => void
}

export function BottomButtons({ phase, onExit, onStop }: BottomButtonsProps) {
  return (
    <div className="claw-game__controls">
      <button type="button" className="claw-game__back" onClick={onExit}>
        나가기
      </button>
      <button
        type="button"
        className="claw-game__play"
        onClick={onStop}
        disabled={phase !== 'spinning'}
      >
        {phase === 'spinning' ? 'STOP' : phase === 'striking' ? '...' : '대기'}
      </button>
    </div>
  )
}
