import type { KeyboardEvent, PointerEvent } from 'react'

/** 모바일 Safari 등에서 onClick이 누락될 때 pointer/key 입력으로 대체 */
export function bindReliableTap(onTap?: () => void, disabled = false) {
  return {
    onPointerUp: (event: PointerEvent<HTMLButtonElement>) => {
      if (disabled || !onTap) return
      event.preventDefault()
      onTap()
    },
    onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => {
      if (disabled || !onTap) return
      if (event.key !== 'Enter' && event.key !== ' ') return
      event.preventDefault()
      onTap()
    },
  }
}
