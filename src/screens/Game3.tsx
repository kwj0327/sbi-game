import { useState } from 'react'
import { Game3ResetConfirm } from '../components/game3/Game3ResetConfirm'
import { MobileLayout } from '../components/MobileLayout'
import game3CollectionIcon from '../assets/game3-collection-icon.png'
import { ALL_DOLL_COUNT, ALL_DOLL_IMAGES } from '../game/dollConfig'
import { clearCollectedDolls } from '../game/dollCollection'
import { useDollCollection } from '../hooks/useDollCollection'
import './Game3.css'

type Game3Props = {
  onExit: () => void
}

export function Game3({ onExit }: Game3Props) {
  const { summary } = useDollCollection(ALL_DOLL_COUNT)
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)

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
      <section className="game3">
        <header className="game3__header">
          <img
            src={game3CollectionIcon}
            alt=""
            className="game3__hero"
            draggable={false}
          />
          <h2 className="game3__title">획득한 인형</h2>
          <p className="game3__subtitle">
            {summary.total > 0
              ? `${summary.total}개 수집 · ${summary.uniqueCount}/${ALL_DOLL_COUNT} 종류`
              : '아직 획득한 인형이 없어요.\n게임에서 인형을 뽑아 모아 보세요!'}
          </p>
          {summary.total > 0 ? (
            <button type="button" className="game3__reset" onClick={handleResetClick}>
              수집 초기화
            </button>
          ) : null}
        </header>

        <ul className="game3__grid" aria-label="인형 도감">
          {ALL_DOLL_IMAGES.map((imageSrc, index) => {
            const count = summary.countsByIndex[index] ?? 0
            const collected = count > 0

            return (
              <li key={index}>
                <article
                  className={`game3-doll${collected ? ' game3-doll--collected' : ' game3-doll--locked'}`}
                >
                  <div className="game3-doll__frame">
                    <img
                      src={imageSrc}
                      alt=""
                      className="game3-doll__image"
                      draggable={false}
                    />
                    {!collected ? (
                      <span className="game3-doll__lock" aria-hidden="true">
                        🔒
                      </span>
                    ) : null}
                    {count > 1 ? (
                      <span className="game3-doll__count" aria-label={`${count}개 보유`}>
                        ×{count}
                      </span>
                    ) : null}
                  </div>
                  <p className="game3-doll__label">No.{index + 1}</p>
                </article>
              </li>
            )
          })}
        </ul>
      </section>

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
