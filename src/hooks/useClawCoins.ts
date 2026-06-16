import { useCallback, useEffect, useState } from 'react'
import {
  CLAW_COINS_CHANGE_EVENT,
  getClawCoinBalance,
} from '../game/clawCoins'

export function useClawCoins() {
  const [coins, setCoins] = useState(() => getClawCoinBalance())

  const refresh = useCallback(() => {
    setCoins(getClawCoinBalance())
  }, [])

  useEffect(() => {
    refresh()
    window.addEventListener(CLAW_COINS_CHANGE_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(CLAW_COINS_CHANGE_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [refresh])

  return { coins, refresh }
}
