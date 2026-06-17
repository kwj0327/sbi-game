import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  getSavedAccountNumber,
  isValidAccountNumber,
  maskAccountNumber,
  normalizeAccountNumber,
  POINT_CASH_WON_PER_POINT,
  pointsToCashWon,
  redeemPointsForCash,
} from '../game/pointCashExchange'
import { usePoints } from '../hooks/usePoints'
import { PointAmount } from './PointAmount'
import './PointsUseModal.css'

type PointsUseModalProps = {
  onClose: () => void
}

export function PointsUseModal({ onClose }: PointsUseModalProps) {
  const { points } = usePoints()
  const [accountNumber, setAccountNumber] = useState(() => getSavedAccountNumber())
  const [quantity, setQuantity] = useState(() => (points > 0 ? points : 0))
  const [message, setMessage] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const maxQuantity = Math.max(points, 0)
  const cashWon = useMemo(() => pointsToCashWon(quantity), [quantity])
  const accountDigits = normalizeAccountNumber(accountNumber)
  const accountValid = isValidAccountNumber(accountDigits)
  const canTransfer = points > 0 && quantity > 0 && quantity <= points && accountValid

  useEffect(() => {
    setQuantity((prev) => {
      if (points <= 0) return 0
      if (prev <= 0) return points
      return Math.min(Math.max(prev, 1), points)
    })
  }, [points])

  const handleAccountChange = (value: string) => {
    setMessage(null)
    setAccountNumber(normalizeAccountNumber(value))
  }

  const handleTransferClick = () => {
    if (!canTransfer) {
      if (!accountValid) {
        setMessage('계좌번호 10~14자리를 입력해 주세요.')
      } else if (points <= 0) {
        setMessage('교환할 포인트가 없어요.')
      }
      return
    }

    setMessage(null)
    setConfirmOpen(true)
  }

  const handleConfirmTransfer = () => {
    const result = redeemPointsForCash(quantity, accountDigits)
    setConfirmOpen(false)

    if (!result) {
      setMessage('송금에 실패했어요. 포인트와 계좌번호를 확인해 주세요.')
      return
    }

    setMessage(
      `${result.cashWon.toLocaleString()}원이 ${maskAccountNumber(result.accountNumber)} 계좌로 입금되었어요.`,
    )
    setQuantity(Math.max(result.remainingPoints, 0))
  }

  return createPortal(
    <>
      <div className="points-use-modal" role="presentation">
        <button
          type="button"
          className="points-use-modal__backdrop"
          aria-label="닫기"
          onClick={onClose}
        />
        <div
          className="points-use-modal__sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="points-use-title"
        >
          <header className="points-use-modal__header">
            <h3 id="points-use-title" className="points-use-modal__title">
              포인트 현금 교환
            </h3>
            <p className="points-use-modal__subtitle">
              1포인트당 {POINT_CASH_WON_PER_POINT.toLocaleString()}원 입금
            </p>
            <button type="button" className="points-use-modal__close" onClick={onClose}>
              닫기
            </button>
          </header>

          <div className="points-use-modal__balance">
            <span className="points-use-modal__balance-label">보유 포인트</span>
            <PointAmount value={points} size="sm" className="points-use-modal__balance-value" />
          </div>

          {points <= 0 ? (
            <p className="points-use-modal__empty">교환할 포인트가 없어요.</p>
          ) : (
            <>
              <label className="points-use-modal__field">
                <span className="points-use-modal__field-label">입금 계좌번호</span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  className="points-use-modal__account-input"
                  placeholder="숫자만 입력 (10~14자리)"
                  value={accountNumber}
                  onChange={(event) => handleAccountChange(event.target.value)}
                  aria-invalid={accountNumber.length > 0 && !accountValid}
                />
              </label>

              <div className="points-use-modal__controls">
                <p className="points-use-modal__controls-label">교환 포인트</p>
                <div className="points-use-quantity">
                  <button
                    type="button"
                    className="points-use-quantity__btn"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    aria-label="포인트 줄이기"
                  >
                    −
                  </button>
                  <span className="points-use-quantity__value">{quantity.toLocaleString()}P</span>
                  <button
                    type="button"
                    className="points-use-quantity__btn"
                    disabled={quantity >= maxQuantity}
                    onClick={() => setQuantity((prev) => Math.min(maxQuantity, prev + 1))}
                    aria-label="포인트 늘리기"
                  >
                    +
                  </button>
                </div>
                <p className="points-use-modal__total">
                  입금 금액{' '}
                  <strong className="points-use-modal__total-cash">
                    {cashWon.toLocaleString()}원
                  </strong>
                </p>
                <button
                  type="button"
                  className="points-use-modal__submit"
                  disabled={!canTransfer}
                  onClick={handleTransferClick}
                >
                  송금
                </button>
              </div>
            </>
          )}

          {message ? <p className="points-use-modal__message">{message}</p> : null}
        </div>
      </div>

      {confirmOpen ? (
        <div className="points-use-confirm" role="presentation">
          <button
            type="button"
            className="points-use-confirm__backdrop"
            aria-label="닫기"
            onClick={() => setConfirmOpen(false)}
          />
          <div
            className="points-use-confirm__card"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="points-use-confirm-title"
            aria-describedby="points-use-confirm-desc"
          >
            <p id="points-use-confirm-title" className="points-use-confirm__title">
              송금할까요?
            </p>
            <p id="points-use-confirm-desc" className="points-use-confirm__message">
              {cashWon.toLocaleString()}원이 {maskAccountNumber(accountDigits)} 계좌로 입금됩니다.
              <br />
              포인트가 현금으로 입금되며 포인트는 소멸됩니다.
            </p>
            <div className="points-use-confirm__actions">
              <button
                type="button"
                className="points-use-confirm__cancel"
                onClick={() => setConfirmOpen(false)}
              >
                취소
              </button>
              <button type="button" className="points-use-confirm__confirm" onClick={handleConfirmTransfer}>
                송금
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>,
    document.body,
  )
}
