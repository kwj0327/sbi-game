import { useCallback, useEffect, useState } from 'react'
import {
  DOLL_COLLECTION_CHANGE_EVENT,
  getCollectedDolls,
  getCollectionSummary,
  type CollectedDollEntry,
  type DollCollectionSummary,
} from '../game/dollCollection'

export function useDollCollection(dollCount: number) {
  const [entries, setEntries] = useState<CollectedDollEntry[]>(() => getCollectedDolls())
  const [summary, setSummary] = useState<DollCollectionSummary>(() =>
    getCollectionSummary(dollCount),
  )

  const refresh = useCallback(() => {
    setEntries(getCollectedDolls())
    setSummary(getCollectionSummary(dollCount))
  }, [dollCount])

  useEffect(() => {
    refresh()
    window.addEventListener(DOLL_COLLECTION_CHANGE_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(DOLL_COLLECTION_CHANGE_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [refresh])

  return { entries, summary, refresh }
}
