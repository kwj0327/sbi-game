import './claw-game-success-popup.css'

type ClawGameSuccessPopupProps = {
  imageSrc: string
  dollName: string
  onConfirm: () => void
}

export function ClawGameSuccessPopup({ imageSrc, dollName, onConfirm }: ClawGameSuccessPopupProps) {
  return (
    <div className="claw-game-success-popup" role="presentation">
      <button
        type="button"
        className="claw-game-success-popup__backdrop"
        aria-label="팝업 닫기"
        onClick={onConfirm}
      />
      <div
        className="claw-game-success-popup__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="claw-game-success-title"
      >
        <p id="claw-game-success-title" className="claw-game-success-popup__title">
          성공!
        </p>
        <p className="claw-game-success-popup__subtitle">{dollName} 인형을 뽑았어요!</p>
        <div className="claw-game-success-popup__doll-wrap">
          <img
            src={imageSrc}
            alt=""
            className="claw-game-success-popup__doll"
            draggable={false}
          />
        </div>
        <button type="button" className="claw-game-success-popup__confirm" onClick={onConfirm}>
          확인
        </button>
      </div>
    </div>
  )
}
