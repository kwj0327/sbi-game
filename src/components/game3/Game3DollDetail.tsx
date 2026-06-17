import { getDollDisplayName } from '../../game/dollConfig'
import './game3-doll-detail.css'

type Game3DollDetailProps = {
  dollIndex: number
  imageSrc: string
  count: number
  onClose: () => void
}

export function Game3DollDetail({ dollIndex, imageSrc, count, onClose }: Game3DollDetailProps) {
  const name = getDollDisplayName(dollIndex)
  const numberLabel = `No.${dollIndex + 1}`

  return (
    <div className="game3-doll-detail" role="presentation">
      <button
        type="button"
        className="game3-doll-detail__backdrop"
        aria-label="닫기"
        onClick={onClose}
      />
      <div
        className="game3-doll-detail__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="game3-doll-detail-title"
      >
        <p id="game3-doll-detail-title" className="game3-doll-detail__name">
          {name}
        </p>
        {name !== numberLabel ? (
          <p className="game3-doll-detail__number">{numberLabel}</p>
        ) : null}
        <div className="game3-doll-detail__frame">
          <img
            src={imageSrc}
            alt=""
            className="game3-doll-detail__image"
            draggable={false}
          />
        </div>
        {count > 1 ? (
          <p className="game3-doll-detail__count">{count}개 보유</p>
        ) : null}
        <button type="button" className="game3-doll-detail__close" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  )
}
