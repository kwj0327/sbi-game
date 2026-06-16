import type { GamePhase } from './types'
import { GameFooterStatus } from '../GameFooterStatus'
import { GameFooterBar } from '../GameFooterBar'

type BottomButtonsProps = {
  phase: GamePhase
  onStop: () => void
}

export function BottomButtons({ phase, onStop }: BottomButtonsProps) {
  return (
    <GameFooterBar className="game-footer-bar--game1" status={<GameFooterStatus />}>
      <button
        type="button"
        className="claw-game__play"
        onClick={onStop}
        disabled={phase !== 'spinning'}
      >
        {phase === 'spinning' ? 'STOP' : phase === 'striking' ? '...' : '대기'}
      </button>
    </GameFooterBar>
  )
}
