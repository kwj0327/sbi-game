export type BottomNavTab = 'home' | 'ranking' | 'attendance' | 'points'

type BottomNavProps = {
  activeTab: BottomNavTab
  onSelectTab: (tab: BottomNavTab) => void
}

export function BottomNav({ activeTab, onSelectTab }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="메인 메뉴">
      <button
        type="button"
        className={`bottom-nav__item${activeTab === 'home' ? ' bottom-nav__item--active' : ''}`}
        onClick={() => onSelectTab('home')}
      >
        <span className="bottom-nav__icon" aria-hidden="true">
          🏠
        </span>
        <span className="bottom-nav__label">홈</span>
      </button>
      <button
        type="button"
        className={`bottom-nav__item${activeTab === 'ranking' ? ' bottom-nav__item--active' : ''}`}
        onClick={() => onSelectTab('ranking')}
      >
        <span className="bottom-nav__icon" aria-hidden="true">
          🏆
        </span>
        <span className="bottom-nav__label">랭킹</span>
      </button>
      <button
        type="button"
        className={`bottom-nav__item${activeTab === 'attendance' ? ' bottom-nav__item--active' : ''}`}
        onClick={() => onSelectTab('attendance')}
      >
        <span className="bottom-nav__icon" aria-hidden="true">
          📅
        </span>
        <span className="bottom-nav__label">출석</span>
      </button>
      <button
        type="button"
        className={`bottom-nav__item${activeTab === 'points' ? ' bottom-nav__item--active' : ''}`}
        onClick={() => onSelectTab('points')}
      >
        <span className="bottom-nav__icon" aria-hidden="true">
          💰
        </span>
        <span className="bottom-nav__label">포인트</span>
      </button>
    </nav>
  )
}
