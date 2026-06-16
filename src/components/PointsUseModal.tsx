import { createPortal } from 'react-dom'
import './PointsUseModal.css'

type PointsUseModalProps = {
  onClose: () => void
}

export function PointsUseModal({ onClose }: PointsUseModalProps) {
  return createPortal(
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
            포인트 사용
          </h3>
          <button type="button" className="points-use-modal__close" onClick={onClose}>
            닫기
          </button>
        </header>
        <p className="points-use-modal__empty">사용 가능한 항목이 없어요.</p>
      </div>
    </div>,
    document.body,
  )
}
