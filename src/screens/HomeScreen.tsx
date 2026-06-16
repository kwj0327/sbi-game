import { useState } from 'react'
import { AttendancePanel } from '../components/AttendancePanel'
import { RankingPanel } from '../components/RankingPanel'
import { BottomNav, type BottomNavTab } from '../components/BottomNav'
import { MobileLayout } from '../components/MobileLayout'
import { ALL_DOLL_COUNT } from '../game/dollConfig'
import { GAMES, type GameId } from '../game/games'
import { useDollCollection } from '../hooks/useDollCollection'
import { usePoints } from '../hooks/usePoints'
import '../App.css'

type HomeScreenProps = {
  onSelectGame: (gameId: GameId) => void
}

export function HomeScreen({ onSelectGame }: HomeScreenProps) {
  const [tab, setTab] = useState<BottomNavTab>('home')
  const { summary } = useDollCollection(ALL_DOLL_COUNT)
  const { points, loading: pointsLoading } = usePoints()

  return (
    <MobileLayout
      scrollable={tab !== 'ranking'}
      footer={<BottomNav activeTab={tab} onSelectTab={setTab} />}
    >
      {tab === 'home' ? (
        <>
          <section className="hero">
            <ul className="game-list">
              {GAMES.map((game) => (
                <li key={game.id}>
                  <button
                    type="button"
                    className="game-card"
                    onClick={() => onSelectGame(game.id)}
                  >
                    {game.icon ? (
                      <img
                        src={game.icon}
                        alt=""
                        className="game-card__icon"
                        aria-hidden="true"
                      />
                    ) : (
                      <span className="game-card__emoji" aria-hidden="true">
                        {game.emoji}
                      </span>
                    )}
                    <span className="game-card__body">
                      <span className="game-card__title">{game.title}</span>
                      <span className="game-card__description">{game.description}</span>
                    </span>
                    <span className="game-card__action" aria-hidden="true">
                      ▶
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="stats" aria-label="내 수집 현황">
            <article className="stat-card">
              <span className="stat-card__value">{summary.total}</span>
              <span className="stat-card__label">획득 인형</span>
            </article>
            <article className="stat-card">
              <span className="stat-card__value">{summary.uniqueCount}</span>
              <span className="stat-card__label">수집 종류</span>
            </article>
            <article className="stat-card">
              <span className="stat-card__value">{pointsLoading ? '…' : points}</span>
              <span className="stat-card__label">포인트</span>
            </article>
          </section>
        </>
      ) : null}

      {tab === 'ranking' ? <RankingPanel /> : null}

      {tab === 'attendance' ? <AttendancePanel /> : null}
    </MobileLayout>
  )
}
