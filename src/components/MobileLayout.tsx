import type { ReactNode } from 'react'
import gameExitIcon from '../assets/game-exit-icon.png'
import sbiLogo from '../assets/sbi-logo.png'
import './MobileLayout.css'

type MobileLayoutProps = {
  children: ReactNode
  footer?: ReactNode
  scrollable?: boolean
  onExit?: () => void
}

export function MobileLayout({
  children,
  footer,
  scrollable = false,
  onExit,
}: MobileLayoutProps) {
  return (
    <div className="mobile-shell">
      <div className="mobile-frame">
        <header className={`mobile-header${onExit ? ' mobile-header--with-exit' : ''}`}>
          {onExit ? (
            <button
              type="button"
              className="mobile-header__exit"
              onClick={onExit}
              aria-label="나가기"
            >
              <img
                src={gameExitIcon}
                alt=""
                className="mobile-header__exit-icon"
                draggable={false}
              />
            </button>
          ) : null}
          <h1 className="mobile-header__brand">
            <img
              src={sbiLogo}
              alt="SBI 저축은행"
              className="mobile-header__logo"
            />
          </h1>
          {onExit ? (
            <span className="mobile-header__exit mobile-header__exit-spacer" aria-hidden="true">
              <img
                src={gameExitIcon}
                alt=""
                className="mobile-header__exit-icon"
                draggable={false}
              />
            </span>
          ) : null}
        </header>

        <main className={`mobile-main${scrollable ? ' mobile-main--scrollable' : ''}`}>
          {children}
        </main>

        {footer ? <footer className="mobile-footer">{footer}</footer> : null}
      </div>
    </div>
  )
}
