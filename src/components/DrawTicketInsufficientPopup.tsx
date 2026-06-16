import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { DRAW_TICKET_PLAY_COST } from '../game/clawCoins'
import { DrawTicketIcon } from './DrawTicketIcon'
import { bindReliableTap } from './bindReliableTap'
import './DrawTicketInsufficientPopup.css'

const DISMISS_GUARD_MS = 450

type DrawTicketInsufficientPopupProps = {
  onClose: () => void
  onGoToAttendance: () => void
}

export function DrawTicketInsufficientPopup({
  onClose,
  onGoToAttendance,
}: DrawTicketInsufficientPopupProps) {
  const openedAtRef = useRef(performance.now())
  const [canDismiss, setCanDismiss] = useState(false)

  useEffect(() => {
    openedAtRef.current = performance.now()
    setCanDismiss(false)

    const timer = window.setTimeout(() => setCanDismiss(true), DISMISS_GUARD_MS)
    return () => window.clearTimeout(timer)
  }, [])

  const guardedClose = () => {
    if (!canDismiss || performance.now() - openedAtRef.current < DISMISS_GUARD_MS) return
    onClose()
  }

  return createPortal(
    <div className="draw-ticket-insufficient-popup" role="presentation">
      <button
        type="button"
        className={`draw-ticket-insufficient-popup__backdrop${
          canDismiss ? '' : ' draw-ticket-insufficient-popup__backdrop--locked'
        }`}
        aria-label="팝업 닫기"
        onClick={(event) => {
          event.preventDefault()
          guardedClose()
        }}
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
          {...bindReliableTap(guardedClose)}
        >
          닫기
        </button>
      </div>
    </div>,
    document.body,
  )
}
