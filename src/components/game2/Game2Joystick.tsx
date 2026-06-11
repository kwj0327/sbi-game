import { useCallback, useEffect, useRef, useState } from 'react'
import {
  useGame2DirectionRepeat,
  vectorToGame2Direction,
  type Game2MoveDirection,
} from './useGame2DirectionRepeat'

type Game2JoystickProps = {
  onMove?: (direction: Game2MoveDirection) => void
  disabled?: boolean
  className?: string
}

function getJoystickMetrics(base: HTMLDivElement) {
  const rect = base.getBoundingClientRect()
  const knob = base.querySelector<HTMLElement>('.game2-joystick__knob')
  const knobSize = knob?.getBoundingClientRect().width ?? rect.width * 0.38
  const maxTravel = rect.width / 2 - knobSize / 2 - 3
  const deadZone = rect.width * 0.12

  return { maxTravel, deadZone }
}

export function Game2Joystick({ onMove, disabled = false, className }: Game2JoystickProps) {
  const baseRef = useRef<HTMLDivElement>(null)
  const activePointerRef = useRef<number | null>(null)
  const [knobOffset, setKnobOffset] = useState({ x: 0, y: 0 })
  const { startRepeat, stopRepeat } = useGame2DirectionRepeat(onMove, disabled)

  const resetJoystick = useCallback(() => {
    activePointerRef.current = null
    setKnobOffset({ x: 0, y: 0 })
    stopRepeat()
  }, [stopRepeat])

  useEffect(() => {
    if (disabled) resetJoystick()
  }, [disabled, resetJoystick])

  const updateFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const base = baseRef.current
      if (!base || disabled) return

      const rect = base.getBoundingClientRect()
      const { maxTravel, deadZone } = getJoystickMetrics(base)
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const dx = clientX - centerX
      const dy = clientY - centerY
      const dist = Math.hypot(dx, dy)
      const travel = dist > 0 ? Math.min(dist, maxTravel) : 0
      const ratio = dist > 0 ? travel / dist : 0

      setKnobOffset({ x: dx * ratio, y: dy * ratio })

      const direction = vectorToGame2Direction(dx, dy, deadZone)
      if (direction) startRepeat(direction)
      else stopRepeat()
    },
    [disabled, startRepeat, stopRepeat],
  )

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    activePointerRef.current = event.pointerId
    updateFromPointer(event.clientX, event.clientY)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerRef.current !== event.pointerId) return
    event.preventDefault()
    updateFromPointer(event.clientX, event.clientY)
  }

  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerRef.current !== event.pointerId) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    resetJoystick()
  }

  return (
    <div className={`game2-joystick${className ? ` ${className}` : ''}`}>
      <div
        ref={baseRef}
        className="game2-joystick__base"
        role="group"
        aria-label="조이스틱"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onLostPointerCapture={resetJoystick}
      >
        <span
          className="game2-joystick__knob"
          style={{
            transform: `translate(calc(-50% + ${knobOffset.x}px), calc(-50% + ${knobOffset.y}px))`,
          }}
          aria-hidden="true"
        />
      </div>
    </div>
  )
}
