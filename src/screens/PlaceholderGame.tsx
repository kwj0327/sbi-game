import { MobileLayout } from '../components/MobileLayout'
import './PlaceholderGame.css'

type PlaceholderGameProps = {
  title: string
  emoji: string
  onExit: () => void
}

export function PlaceholderGame({ title, emoji, onExit }: PlaceholderGameProps) {
  return (
    <MobileLayout>
      <section className="placeholder-game">
        <p className="placeholder-game__emoji" aria-hidden="true">
          {emoji}
        </p>
        <h2 className="placeholder-game__title">{title}</h2>
        <p className="placeholder-game__message">곧 만나볼 수 있어요.</p>
        <button type="button" className="btn btn--secondary" onClick={onExit}>
          홈으로
        </button>
      </section>
    </MobileLayout>
  )
}
