import type { ReactNode } from 'react'
import './GameFooterBar.css'

type GameFooterBarProps = {
  children: ReactNode
  status?: ReactNode
  className?: string
}

/** 게임 하단 — 컨트롤 + 점수/기회 등 상태 영역 */
export function GameFooterBar({ children, status, className }: GameFooterBarProps) {
  return (
    <div className={`game-footer-bar${className ? ` ${className}` : ''}`}>
      <div className="game-footer-bar__main">{children}</div>
      <aside className="game-footer-bar__status" aria-label="게임 정보">
        {status}
      </aside>
    </div>
  )
}
