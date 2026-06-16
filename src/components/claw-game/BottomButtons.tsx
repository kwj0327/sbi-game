import type { GamePhase } from './types'
import { bindReliableTap } from '../bindReliableTap'
import { GameFooterStatus } from '../GameFooterStatus'
import { GameFooterBar } from '../GameFooterBar'

type BottomButtonsProps = {
  phase: GamePhase
  onStop: () => void
}

export function BottomButtons({ phase, onStop }: BottomButtonsProps) {
  const stopDisabled = phase !== 'spinning'

  return (
    <GameFooterBar className="game-footer-bar--game1" status={<GameFooterStatus />}>
      <button
        type="button"
        className="claw-game__play"
        disabled={stopDisabled}
        {...bindReliableTap(onStop, stopDisabled)}
      >
        {phase === 'spinning' ? 'STOP' : phase === 'striking' ? '...' : '대기'}
      </button>
    </GameFooterBar>
  )
}
