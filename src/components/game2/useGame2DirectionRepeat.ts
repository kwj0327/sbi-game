import { useCallback, useEffect, useRef } from 'react'
import { GAME2_CLAW } from '../../game/game2Config'

export type Game2MoveDirection = 'up' | 'down' | 'left' | 'right'

export function useGame2DirectionRepeat(
  onMove?: (direction: Game2MoveDirection) => void,
  disabled = false,
) {
  const onMoveRef = useRef(onMove)
  const repeatRef = useRef<number | null>(null)
  const activeDirectionRef = useRef<Game2MoveDirection | null>(null)

  onMoveRef.current = onMove

  const stopRepeat = useCallback(() => {
    if (repeatRef.current !== null) {
      window.clearInterval(repeatRef.current)
      repeatRef.current = null
    }
    activeDirectionRef.current = null
  }, [])

  const startRepeat = useCallback(
    (direction: Game2MoveDirection) => {
      if (disabled) return
      if (activeDirectionRef.current === direction && repeatRef.current !== null) return

      stopRepeat()
      activeDirectionRef.current = direction
      onMoveRef.current?.(direction)
      repeatRef.current = window.setInterval(() => {
        onMoveRef.current?.(direction)
      }, GAME2_CLAW.moveRepeatMs)
    },
    [disabled, stopRepeat],
  )

  useEffect(() => stopRepeat, [stopRepeat])

  useEffect(() => {
    if (disabled) stopRepeat()
  }, [disabled, stopRepeat])

  const bindDirection = (direction: Game2MoveDirection) => ({
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => {
      event.preventDefault()
      event.currentTarget.setPointerCapture(event.pointerId)
      startRepeat(direction)
    },
    onPointerUp: (event: React.PointerEvent<HTMLButtonElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
      stopRepeat()
    },
    onPointerCancel: () => stopRepeat(),
    onLostPointerCapture: () => stopRepeat(),
  })

  return { startRepeat, stopRepeat, bindDirection }
}

export function vectorToGame2Direction(
  dx: number,
  dy: number,
  deadZone: number,
): Game2MoveDirection | null {
  const dist = Math.hypot(dx, dy)
  if (dist < deadZone) return null

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'right' : 'left'
  }

  return dy > 0 ? 'down' : 'up'
}
