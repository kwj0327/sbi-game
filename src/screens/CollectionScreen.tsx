import { useState } from 'react'
import { Game3DollDetail } from '../components/game3/Game3DollDetail'
import { Game3ResetConfirm } from '../components/game3/Game3ResetConfirm'
import { MobileLayout } from '../components/MobileLayout'
import game3CollectionIcon from '../assets/game3-collection-icon.png'
import { ALL_DOLL_COUNT, ALL_DOLL_IMAGES } from '../game/dollConfig'
import { clearCollectedDolls } from '../game/dollCollection'
import { useDollCollection } from '../hooks/useDollCollection'
import './CollectionScreen.css'

type CollectionScreenProps = {
  onExit: () => void
}

export function CollectionScreen({ onExit }: CollectionScreenProps) {
  const { summary } = useDollCollection(ALL_DOLL_COUNT)
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)
  const [selectedDollIndex, setSelectedDollIndex] = useState<number | null>(null)

  const handleResetClick = () => {
    if (summary.total === 0) return
    setResetConfirmOpen(true)
  }

  const handleResetConfirm = () => {
    clearCollectedDolls()
    setResetConfirmOpen(false)
  }

  return (
    <MobileLayout scrollable onExit={onExit}>
      <section className="collection">
        <header className="collection__header">
          <img
            src={game3CollectionIcon}
            alt=""
            className="collection__hero"
            draggable={false}
          />
          <h2 className="collection__title">획득한 인형</h2>
          <p className="collection__subtitle">
            {summary.total > 0
              ? `${summary.total}개 수집 · ${summary.uniqueCount}/${ALL_DOLL_COUNT} 종류`
              : '아직 획득한 인형이 없어요.\n게임에서 인형을 뽑아 모아 보세요!'}
          </p>
          {summary.total > 0 ? (
            <button type="button" className="collection__reset" onClick={handleResetClick}>
              수집 초기화
            </button>
          ) : null}
        </header>

        <ul className="collection__grid" aria-label="인형 도감">
          {ALL_DOLL_IMAGES.map((imageSrc, index) => {
            const count = summary.countsByIndex[index] ?? 0
            const collected = count > 0

            const dollContent = (
              <>
                <div className="collection-doll__frame">
                  <img
                    src={imageSrc}
                    alt=""
                    className="collection-doll__image"
                    draggable={false}
                  />
                  {!collected ? (
                    <span className="collection-doll__lock" aria-hidden="true">
                      🔒
                    </span>
                  ) : null}
                  {count > 1 ? (
                    <span className="collection-doll__count" aria-label={`${count}개 보유`}>
                      ×{count}
                    </span>
                  ) : null}
                </div>
                <p className="collection-doll__label">No.{index + 1}</p>
              </>
            )

            return (
              <li key={index}>
                {collected ? (
                  <button
                    type="button"
                    className="collection-doll collection-doll--collected collection-doll--clickable"
                    onClick={() => setSelectedDollIndex(index)}
                    aria-label={`No.${index + 1} 인형 보기`}
                  >
                    {dollContent}
                  </button>
                ) : (
                  <article className="collection-doll collection-doll--locked">{dollContent}</article>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      {selectedDollIndex !== null ? (
        <Game3DollDetail
          dollIndex={selectedDollIndex}
          imageSrc={ALL_DOLL_IMAGES[selectedDollIndex]}
          count={summary.countsByIndex[selectedDollIndex] ?? 0}
          onClose={() => setSelectedDollIndex(null)}
        />
      ) : null}

      {resetConfirmOpen ? (
        <Game3ResetConfirm
          totalCount={summary.total}
          onCancel={() => setResetConfirmOpen(false)}
          onConfirm={handleResetConfirm}
        />
      ) : null}
    </MobileLayout>
  )
}
