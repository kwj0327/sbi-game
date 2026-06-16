import type { KeyboardEvent, MouseEvent, PointerEvent } from 'react'

const TAP_DEDUPE_MS = 400

type TapElement = HTMLElement & { _lastReliableTap?: number }

function markTap(element: TapElement) {
  element._lastReliableTap = Date.now()
}

function wasRecentTap(element: TapElement) {
  const last = element._lastReliableTap ?? 0
  return Date.now() - last < TAP_DEDUPE_MS
}

/** 모바일 Safari 등에서 onClick/onPointerUp이 누락될 때 pointerdown + click 대체 */
export function bindReliableTap(onTap?: () => void, disabled = false) {
  return {
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
      if (disabled || !onTap) return
      if (event.pointerType === 'mouse' && event.button !== 0) return

      event.preventDefault()
      markTap(event.currentTarget)
      onTap()
    },
    onClick: (event: MouseEvent<HTMLButtonElement>) => {
      if (disabled || !onTap) return
      if (wasRecentTap(event.currentTarget)) {
        event.preventDefault()
        return
      }

      event.preventDefault()
      markTap(event.currentTarget)
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
