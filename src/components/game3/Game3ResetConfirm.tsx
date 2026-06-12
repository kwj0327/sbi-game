import './game3-reset-confirm.css'

type Game3ResetConfirmProps = {
  totalCount: number
  onCancel: () => void
  onConfirm: () => void
}

export function Game3ResetConfirm({ totalCount, onCancel, onConfirm }: Game3ResetConfirmProps) {
  return (
    <div className="game3-reset-confirm" role="presentation">
      <button
        type="button"
        className="game3-reset-confirm__backdrop"
        aria-label="닫기"
        onClick={onCancel}
      />
      <div
        className="game3-reset-confirm__card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="game3-reset-title"
        aria-describedby="game3-reset-desc"
      >
        <p id="game3-reset-title" className="game3-reset-confirm__title">
          수집을 초기화할까요?
        </p>
        <p id="game3-reset-desc" className="game3-reset-confirm__message">
          획득한 인형 {totalCount}개가 모두 삭제됩니다.
          <br />
          삭제 후에는 되돌릴 수 없어요.
        </p>
        <div className="game3-reset-confirm__actions">
          <button type="button" className="game3-reset-confirm__cancel" onClick={onCancel}>
            취소
          </button>
          <button type="button" className="game3-reset-confirm__confirm" onClick={onConfirm}>
            삭제
          </button>
        </div>
      </div>
    </div>
  )
}
