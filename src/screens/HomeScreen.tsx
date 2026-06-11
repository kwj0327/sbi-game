import { MobileLayout } from '../components/MobileLayout'
import { GAMES, type GameId } from '../game/games'
import '../App.css'

type HomeScreenProps = {
  onSelectGame: (gameId: GameId) => void
}

export function HomeScreen({ onSelectGame }: HomeScreenProps) {
  return (
    <MobileLayout
      scrollable
      footer={
        <nav className="bottom-nav" aria-label="메인 메뉴">
          <button type="button" className="bottom-nav__item bottom-nav__item--active">
            <span className="bottom-nav__icon" aria-hidden="true">
              🏠
            </span>
            <span className="bottom-nav__label">홈</span>
          </button>
          <button type="button" className="bottom-nav__item">
            <span className="bottom-nav__icon" aria-hidden="true">
              🏆
            </span>
            <span className="bottom-nav__label">랭킹</span>
          </button>
        </nav>
      }
    >
      <section className="hero">
        <h2 className="hero__title">게임 선택</h2>
        <p className="hero__subtitle">플레이할 게임을 골라 주세요.</p>
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

      <section className="stats">
        <article className="stat-card">
          <span className="stat-card__value">0</span>
          <span className="stat-card__label">플레이 횟수</span>
        </article>
        <article className="stat-card">
          <span className="stat-card__value">0</span>
          <span className="stat-card__label">최고 점수</span>
        </article>
        <article className="stat-card">
          <span className="stat-card__value">-</span>
          <span className="stat-card__label">랭킹</span>
        </article>
      </section>
    </MobileLayout>
  )
}
