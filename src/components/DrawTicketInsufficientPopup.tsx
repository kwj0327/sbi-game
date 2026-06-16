import { DRAW_TICKET_PLAY_COST } from '../game/clawCoins'
import { DrawTicketIcon } from './DrawTicketIcon'
import { bindReliableTap } from './bindReliableTap'
import './DrawTicketInsufficientPopup.css'

type DrawTicketInsufficientPopupProps = {
  onClose: () => void
  onGoToAttendance: () => void
}

export function DrawTicketInsufficientPopup({
  onClose,
  onGoToAttendance,
}: DrawTicketInsufficientPopupProps) {
  return (
    <div className="draw-ticket-insufficient-popup" role="presentation">
      <button
        type="button"
        className="draw-ticket-insufficient-popup__backdrop"
        aria-label="팝업 닫기"
        onClick={onClose}
      />
      <div
        className="draw-ticket-insufficient-popup__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="draw-ticket-insufficient-title"
      >
        <p id="draw-ticket-insufficient-title" className="draw-ticket-insufficient-popup__title">
          뽑기 티켓이 없어요
        </p>
        <p className="draw-ticket-insufficient-popup__subtitle">
          출석 탭에서 출석하고
          <br />
          뽑기 티켓을 받아 주세요.
        </p>
        <div className="draw-ticket-insufficient-popup__ticket-wrap" aria-hidden="true">
          <DrawTicketIcon size="lg" className="draw-ticket-insufficient-popup__ticket-icon" />
          <span className="draw-ticket-insufficient-popup__need">
            플레이 {DRAW_TICKET_PLAY_COST}장 필요
          </span>
        </div>
        <button
          type="button"
          className="draw-ticket-insufficient-popup__primary"
          {...bindReliableTap(onGoToAttendance)}
        >
          출석하러 가기
        </button>
        <button
          type="button"
          className="draw-ticket-insufficient-popup__secondary"
          {...bindReliableTap(onClose)}
        >
          닫기
        </button>
      </div>
    </div>
  )
}
