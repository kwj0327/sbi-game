import type { ReactNode } from 'react'
import sbiLogo from '../assets/sbi-logo.png'
import './MobileLayout.css'

type MobileLayoutProps = {
  children: ReactNode
  footer?: ReactNode
  scrollable?: boolean
}

export function MobileLayout({ children, footer, scrollable = false }: MobileLayoutProps) {
  return (
    <div className="mobile-shell">
      <div className="mobile-frame">
        <header className="mobile-header">
          <h1 className="mobile-header__brand">
            <img
              src={sbiLogo}
              alt="SBI 저축은행"
              className="mobile-header__logo"
            />
          </h1>
        </header>

        <main className={`mobile-main${scrollable ? ' mobile-main--scrollable' : ''}`}>
          {children}
        </main>

        {footer ? <footer className="mobile-footer">{footer}</footer> : null}
      </div>
    </div>
  )
}
