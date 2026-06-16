import './DrawTicketRewardPopup.css'
import { DrawTicketIcon } from './DrawTicketIcon'

type DrawTicketRewardPopupProps = {
  amount: number
  totalTickets: number
  weeklyBonusGranted?: boolean
  onConfirm: () => void
}

export function DrawTicketRewardPopup({
  amount,
  totalTickets,
  weeklyBonusGranted = false,
  onConfirm,
}: DrawTicketRewardPopupProps) {
  return (
    <div className="draw-ticket-reward-popup" role="presentation">
      <button
        type="button"
        className="draw-ticket-reward-popup__backdrop"
        aria-label="팝업 닫기"
        onClick={onConfirm}
      />
      <div
        className="draw-ticket-reward-popup__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="draw-ticket-reward-title"
      >
        <p id="draw-ticket-reward-title" className="draw-ticket-reward-popup__title">
          출석 완료!
        </p>
        <p className="draw-ticket-reward-popup__subtitle">
          {weeklyBonusGranted ? '7일 연속 출석 보너스 포함!' : '뽑기 티켓을 받았어요'}
        </p>
        <div className="draw-ticket-reward-popup__ticket-wrap" aria-hidden="true">
          <DrawTicketIcon size="lg" className="draw-ticket-reward-popup__ticket-icon" />
          <span className="draw-ticket-reward-popup__ticket-amount">+{amount.toLocaleString()}</span>
        </div>
        <p className="draw-ticket-reward-popup__total">
          보유 뽑기 티켓 {totalTickets.toLocaleString()}장
        </p>
        <button type="button" className="draw-ticket-reward-popup__confirm" onClick={onConfirm}>
          확인
        </button>
      </div>
    </div>
  )
}
