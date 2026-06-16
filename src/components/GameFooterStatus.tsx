import { DrawTicketIcon } from './DrawTicketIcon'
import { PointCoinIcon } from './PointCoinIcon'
import { useClawCoins } from '../hooks/useClawCoins'
import { usePoints } from '../hooks/usePoints'
import './GameFooterStatus.css'

export function GameFooterStatus() {
  const { coins: tickets } = useClawCoins()
  const { points } = usePoints()

  return (
    <div
      className="game-footer-status"
      aria-label={`뽑기 티켓 ${tickets.toLocaleString()}장, 포인트 ${points.toLocaleString()}`}
    >
      <div className="game-footer-status__row">
        <DrawTicketIcon size="sm" className="game-footer-status__icon" />
        <span className="game-footer-status__value">{tickets.toLocaleString()}</span>
      </div>
      <div className="game-footer-status__row">
        <PointCoinIcon size="sm" className="game-footer-status__icon" />
        <span className="game-footer-status__value">{points.toLocaleString()}</span>
      </div>
    </div>
  )
}
