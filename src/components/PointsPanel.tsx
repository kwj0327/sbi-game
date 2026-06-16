import { useState } from 'react'
import { PointAmount } from './PointAmount'
import { PointsExchangeModal } from './PointsExchangeModal'
import { PointsUseModal } from './PointsUseModal'
import { usePoints } from '../hooks/usePoints'
import './PointsPanel.css'

export function PointsPanel() {
  const { points, loading } = usePoints()
  const [exchangeOpen, setExchangeOpen] = useState(false)
  const [useOpen, setUseOpen] = useState(false)

  return (
    <>
      <section className="points-panel" aria-labelledby="points-title">
        <header className="points-panel__header">
          <h2 id="points-title" className="points-panel__title">
            포인트
          </h2>
          <p className="points-panel__subtitle">인형을 뽑을 때마다 포인트를 모아요.</p>
        </header>

        <article className="points-panel__balance" aria-label="보유 포인트">
          <span className="points-panel__balance-label">보유 포인트</span>
          {loading ? (
            <span className="points-panel__balance-value">…</span>
          ) : (
            <PointAmount value={points} size="md" className="points-panel__balance-value" />
          )}
        </article>

        <div className="points-panel__actions">
          <button
            type="button"
            className="points-panel__action"
            onClick={() => setExchangeOpen(true)}
          >
            <span className="points-panel__action-title">교환</span>
            <span className="points-panel__action-desc">수집한 인형을 포인트로 교환</span>
          </button>

          <button type="button" className="points-panel__action" onClick={() => setUseOpen(true)}>
            <span className="points-panel__action-title">사용</span>
            <span className="points-panel__action-desc">포인트로 아이템 구매</span>
          </button>
        </div>
      </section>

      {exchangeOpen ? <PointsExchangeModal onClose={() => setExchangeOpen(false)} /> : null}
      {useOpen ? <PointsUseModal onClose={() => setUseOpen(false)} /> : null}
    </>
  )
}
