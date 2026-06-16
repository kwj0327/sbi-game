import { useEffect, useMemo, useState } from 'react'
import { ALL_DOLL_COUNT, ALL_DOLL_IMAGES } from '../game/dollConfig'
import { exchangeCollectedDolls } from '../game/dollCollection'
import { DOLL_EXCHANGE_POINT_VALUE } from '../game/points'
import { useDollCollection } from '../hooks/useDollCollection'
import { PointAmount } from './PointAmount'
import './PointsExchangeModal.css'

type PointsExchangeModalProps = {
  onClose: () => void
}

export function PointsExchangeModal({ onClose }: PointsExchangeModalProps) {
  const { summary } = useDollCollection(ALL_DOLL_COUNT)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [message, setMessage] = useState<string | null>(null)

  const exchangeableDolls = useMemo(
    () =>
      summary.countsByIndex
        .map((count, index) => ({ index, count, imageSrc: ALL_DOLL_IMAGES[index] }))
        .filter((doll) => doll.count > 0),
    [summary.countsByIndex],
  )

  const selectedDoll =
    selectedIndex === null
      ? null
      : exchangeableDolls.find((doll) => doll.index === selectedIndex) ?? null

  const maxQuantity = selectedDoll?.count ?? 1

  useEffect(() => {
    if (selectedIndex === null) return
    const doll = exchangeableDolls.find((item) => item.index === selectedIndex)
    if (!doll) {
      setSelectedIndex(null)
      setQuantity(1)
      return
    }
    setQuantity((prev) => Math.min(Math.max(prev, 1), doll.count))
  }, [exchangeableDolls, selectedIndex])

  const handleSelect = (dollIndex: number) => {
    setMessage(null)
    setSelectedIndex(dollIndex)
    setQuantity(1)
  }

  const handleExchange = () => {
    if (selectedIndex === null) return

    const result = exchangeCollectedDolls(selectedIndex, quantity)
    if (!result) {
      setMessage('교환에 실패했어요.')
      return
    }

    setMessage(`${result.pointsEarned.toLocaleString()}P를 받았어요!`)
    setSelectedIndex(null)
    setQuantity(1)
  }

  return (
    <div className="points-exchange-modal" role="presentation">
      <button
        type="button"
        className="points-exchange-modal__backdrop"
        aria-label="닫기"
        onClick={onClose}
      />
      <div
        className="points-exchange-modal__sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="points-exchange-title"
      >
        <header className="points-exchange-modal__header">
          <h3 id="points-exchange-title" className="points-exchange-modal__title">
            인형 교환
          </h3>
          <p className="points-exchange-modal__subtitle">
            인형 1개당 {DOLL_EXCHANGE_POINT_VALUE}포인트
          </p>
          <button type="button" className="points-exchange-modal__close" onClick={onClose}>
            닫기
          </button>
        </header>

        {exchangeableDolls.length === 0 ? (
          <p className="points-exchange-modal__empty">교환할 인형이 없어요.</p>
        ) : (
          <ul className="points-exchange-list">
            {exchangeableDolls.map((doll) => {
              const isSelected = selectedIndex === doll.index

              return (
                <li key={doll.index}>
                  <button
                    type="button"
                    className={`points-exchange-list__item${isSelected ? ' points-exchange-list__item--selected' : ''}`}
                    onClick={() => handleSelect(doll.index)}
                  >
                    <img
                      src={doll.imageSrc}
                      alt=""
                      className="points-exchange-list__image"
                      draggable={false}
                    />
                    <span className="points-exchange-list__meta">
                      <span className="points-exchange-list__name">No.{doll.index + 1}</span>
                      <span className="points-exchange-list__count">{doll.count}개 보유</span>
                    </span>
                    <span className="points-exchange-list__rate">
                      <PointAmount value={DOLL_EXCHANGE_POINT_VALUE} size="sm" />
                      <span>/개</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        {selectedDoll ? (
          <div className="points-exchange-modal__controls">
            <p className="points-exchange-modal__controls-label">교환 개수</p>
            <div className="points-exchange-quantity">
              <button
                type="button"
                className="points-exchange-quantity__btn"
                disabled={quantity <= 1}
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                aria-label="개수 줄이기"
              >
                −
              </button>
              <span className="points-exchange-quantity__value">{quantity}</span>
              <button
                type="button"
                className="points-exchange-quantity__btn"
                disabled={quantity >= maxQuantity}
                onClick={() => setQuantity((prev) => Math.min(maxQuantity, prev + 1))}
                aria-label="개수 늘리기"
              >
                +
              </button>
            </div>
            <p className="points-exchange-modal__total">
              받을 포인트{' '}
              <PointAmount
                value={quantity * DOLL_EXCHANGE_POINT_VALUE}
                size="sm"
                className="points-exchange-modal__total-points"
              />
            </p>
            <button type="button" className="points-exchange-modal__submit" onClick={handleExchange}>
              {quantity}개 교환하기
            </button>
          </div>
        ) : null}

        {message ? <p className="points-exchange-modal__message">{message}</p> : null}
      </div>
    </div>
  )
}
