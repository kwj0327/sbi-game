import { useCallback, useEffect, useRef, useState } from 'react'
import { Game2InstructionBar } from '../components/game2/Game2InstructionBar'
import { Game2PlayControls } from '../components/game2/Game2PlayControls'
import { Game2Viewport } from '../components/game2/Game2Viewport'
import { MobileLayout } from '../components/MobileLayout'
import { GAME2_CLAW, type Game2ClawPhase, type Game2ClawState } from '../game/game2Config'
import {
  easeOutCubic,
  getDefaultGame2ClawState,
  getDefaultGame2PlayPosition,
  getGame2ChuteCenter,
  isClawMovementLocked,
  lerpPlayPosition,
  movePlayPosition,
} from '../game/game2PlayArea'
import './Game2.css'

type Game2Props = {
  onExit: () => void
}

function getClawStatusMessage(phase: Game2ClawPhase) {
  switch (phase) {
    case 'descending':
      return '집게가 하강 중입니다…'
    case 'down':
      return '집게가 집는 중입니다…'
    case 'ascending':
      return '집게가 상승 중입니다…'
    case 'returning':
      return '배출구로 이동 중입니다…'
    case 'atChute':
      return '배출구에 도착했습니다.'
    case 'openAtChute':
      return '집게를 놓는 중…'
    case 'homeward':
      return '시작 위치로 돌아가는 중…'
    default:
      return '방향키로 이동 · ↓ 버튼으로 하강'
  }
}

export function Game2({ onExit }: Game2Props) {
  const [claw, setClaw] = useState<Game2ClawState>(getDefaultGame2ClawState)
  const clawRef = useRef(claw)
  clawRef.current = claw
  const returnOriginRef = useRef<{ x: number; y: number } | null>(null)
  const homewardOriginRef = useRef<{ x: number; y: number } | null>(null)

  const controlsLocked = isClawMovementLocked(claw)

  const handleMove = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    setClaw((prev) => {
      if (isClawMovementLocked(prev)) return prev
      const next = movePlayPosition({ x: prev.xPercent, y: prev.playY }, direction)
      return { ...prev, xPercent: next.x, playY: next.y }
    })
  }, [])

  const handleDescend = useCallback(() => {
    setClaw((prev) => {
      if (prev.phase !== 'idle') return prev
      return {
        ...prev,
        open: true,
        phase: 'descending',
        descendT: 0,
      }
    })
  }, [])

  useEffect(() => {
    if (claw.phase !== 'descending') return

    const start = performance.now()
    const { descendDurationMs } = GAME2_CLAW
    let frame = 0

    const animate = (now: number) => {
      const linear = Math.min(1, (now - start) / descendDurationMs)
      const eased = easeOutCubic(linear)

      setClaw((prev) => {
        if (prev.phase !== 'descending') return prev
        if (linear >= 1) {
          return { ...prev, phase: 'down', descendT: 1, open: false }
        }
        return { ...prev, descendT: eased }
      })

      if (linear < 1) {
        frame = requestAnimationFrame(animate)
      }
    }

    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [claw.phase])

  useEffect(() => {
    if (claw.phase !== 'down') return

    const timeout = window.setTimeout(() => {
      setClaw((prev) => {
        if (prev.phase !== 'down') return prev
        return { ...prev, phase: 'ascending', open: false }
      })
    }, GAME2_CLAW.holdAtBottomMs)

    return () => window.clearTimeout(timeout)
  }, [claw.phase])

  useEffect(() => {
    if (claw.phase !== 'ascending') return

    const start = performance.now()
    const { ascendDurationMs } = GAME2_CLAW
    let frame = 0

    const animate = (now: number) => {
      const linear = Math.min(1, (now - start) / ascendDurationMs)
      const eased = easeOutCubic(linear)

      setClaw((prev) => {
        if (prev.phase !== 'ascending') return prev
        if (linear >= 1) {
          returnOriginRef.current = { x: prev.xPercent, y: prev.playY }
          return { ...prev, phase: 'returning', descendT: 0, open: false }
        }
        return { ...prev, descendT: 1 - eased }
      })

      if (linear < 1) {
        frame = requestAnimationFrame(animate)
      }
    }

    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [claw.phase])

  useEffect(() => {
    if (claw.phase !== 'returning') return

    const from = returnOriginRef.current ?? {
      x: clawRef.current.xPercent,
      y: clawRef.current.playY,
    }
    returnOriginRef.current = from

    const to = getGame2ChuteCenter()
    const start = performance.now()
    const { returnToChuteDurationMs } = GAME2_CLAW
    let frame = 0

    const animate = (now: number) => {
      const linear = Math.min(1, (now - start) / returnToChuteDurationMs)
      const eased = easeOutCubic(linear)
      const next = lerpPlayPosition(from, to, eased)

      setClaw((prev) => {
        if (prev.phase !== 'returning') return prev
        if (linear >= 1) {
          return {
            ...prev,
            phase: 'atChute',
            xPercent: to.x,
            playY: to.y,
            descendT: 0,
            open: false,
          }
        }
        return {
          ...prev,
          xPercent: next.x,
          playY: next.y,
          descendT: 0,
          open: false,
        }
      })

      if (linear < 1) {
        frame = requestAnimationFrame(animate)
      }
    }

    frame = requestAnimationFrame(animate)
    return () => {
      cancelAnimationFrame(frame)
      returnOriginRef.current = null
    }
  }, [claw.phase])

  useEffect(() => {
    if (claw.phase !== 'atChute') return

    const timeout = window.setTimeout(() => {
      setClaw((prev) => {
        if (prev.phase !== 'atChute') return prev
        return { ...prev, phase: 'openAtChute', open: true }
      })
    }, GAME2_CLAW.holdAtChuteMs)

    return () => window.clearTimeout(timeout)
  }, [claw.phase])

  useEffect(() => {
    if (claw.phase !== 'openAtChute') return

    const timeout = window.setTimeout(() => {
      setClaw((prev) => {
        if (prev.phase !== 'openAtChute') return prev
        homewardOriginRef.current = { x: prev.xPercent, y: prev.playY }
        return { ...prev, phase: 'homeward', open: true }
      })
    }, GAME2_CLAW.holdAfterOpenAtChuteMs)

    return () => window.clearTimeout(timeout)
  }, [claw.phase])

  useEffect(() => {
    if (claw.phase !== 'homeward') return

    const from = homewardOriginRef.current ?? {
      x: clawRef.current.xPercent,
      y: clawRef.current.playY,
    }
    homewardOriginRef.current = from

    const to = getDefaultGame2PlayPosition()
    const start = performance.now()
    const { returnToHomeDurationMs } = GAME2_CLAW
    let frame = 0

    const animate = (now: number) => {
      const linear = Math.min(1, (now - start) / returnToHomeDurationMs)
      const eased = easeOutCubic(linear)
      const next = lerpPlayPosition(from, to, eased)

      setClaw((prev) => {
        if (prev.phase !== 'homeward') return prev
        if (linear >= 1) {
          return {
            ...prev,
            phase: 'idle',
            xPercent: to.x,
            playY: to.y,
            descendT: 0,
            open: true,
          }
        }
        return {
          ...prev,
          xPercent: next.x,
          playY: next.y,
          descendT: 0,
          open: true,
        }
      })

      if (linear < 1) {
        frame = requestAnimationFrame(animate)
      }
    }

    frame = requestAnimationFrame(animate)
    return () => {
      cancelAnimationFrame(frame)
      homewardOriginRef.current = null
    }
  }, [claw.phase])

  const handleMoveRef = useRef(handleMove)
  handleMoveRef.current = handleMove

  useEffect(() => {
    const held = new Set<string>()
    let interval: number | null = null

    const tick = () => {
      if (isClawMovementLocked(clawRef.current)) return
      if (held.has('ArrowUp')) handleMoveRef.current('up')
      if (held.has('ArrowDown')) handleMoveRef.current('down')
      if (held.has('ArrowLeft')) handleMoveRef.current('left')
      if (held.has('ArrowRight')) handleMoveRef.current('right')
    }

    const stop = () => {
      if (interval !== null) {
        window.clearInterval(interval)
        interval = null
      }
    }

    const start = () => {
      if (interval !== null) return
      if (isClawMovementLocked(clawRef.current)) return
      tick()
      interval = window.setInterval(tick, GAME2_CLAW.moveRepeatMs)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return
      event.preventDefault()
      if (isClawMovementLocked(clawRef.current)) return
      if (held.has(event.key)) return
      held.add(event.key)
      start()
    }

    const onKeyUp = (event: KeyboardEvent) => {
      held.delete(event.key)
      if (held.size === 0) stop()
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    return () => {
      stop()
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  return (
    <MobileLayout
      footer={
        <div className="game2-footer">
          <Game2PlayControls
            onMove={handleMove}
            onDescend={handleDescend}
            disabled={controlsLocked}
          />
          <button type="button" className="game2__back" onClick={onExit}>
            나가기
          </button>
        </div>
      }
    >
      <div className="game2">
        <Game2InstructionBar message={getClawStatusMessage(claw.phase)} />
        <Game2Viewport claw={claw} />
      </div>
    </MobileLayout>
  )
}
