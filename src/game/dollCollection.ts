import { addPoints, DOLL_COLLECT_POINT_REWARD, DOLL_EXCHANGE_POINT_VALUE } from './points'

export type CollectionSource = 'claw' | 'game2'

export type CollectedDollEntry = {
  id: string
  dollIndex: number
  source: CollectionSource
  collectedAt: number
}

export type DollCollectionSummary = {
  total: number
  uniqueCount: number
  countsByIndex: readonly number[]
}

const STORAGE_KEY = 'sbi-game-doll-collection'
export const DOLL_COLLECTION_CHANGE_EVENT = 'sbi-game-collection-change'

function readEntries(): CollectedDollEntry[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []

    return parsed.filter(
      (entry): entry is CollectedDollEntry =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as CollectedDollEntry).id === 'string' &&
        typeof (entry as CollectedDollEntry).dollIndex === 'number' &&
        ((entry as CollectedDollEntry).source === 'claw' ||
          (entry as CollectedDollEntry).source === 'game2') &&
        typeof (entry as CollectedDollEntry).collectedAt === 'number',
    )
  } catch {
    return []
  }
}

function writeEntries(entries: CollectedDollEntry[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  window.dispatchEvent(new Event(DOLL_COLLECTION_CHANGE_EVENT))
}

export function getCollectedDolls(): CollectedDollEntry[] {
  return readEntries()
}

export function hasCollectedDollIndex(dollIndex: number): boolean {
  if (dollIndex < 0) return false
  return readEntries().some((entry) => entry.dollIndex === dollIndex)
}

export function getCollectionSummary(dollCount: number): DollCollectionSummary {
  const countsByIndex = Array.from({ length: dollCount }, () => 0)

  for (const entry of readEntries()) {
    if (entry.dollIndex < 0 || entry.dollIndex >= dollCount) continue
    countsByIndex[entry.dollIndex] += 1
  }

  const total = countsByIndex.reduce((sum, count) => sum + count, 0)
  const uniqueCount = countsByIndex.filter((count) => count > 0).length

  return { total, uniqueCount, countsByIndex }
}

export function addCollectedDoll(
  dollIndex: number,
  source: CollectionSource,
): CollectedDollEntry | null {
  if (dollIndex < 0) return null

  const entry: CollectedDollEntry = {
    id: `${source}-${dollIndex}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    dollIndex,
    source,
    collectedAt: Date.now(),
  }

  writeEntries([...readEntries(), entry])
  addPoints(DOLL_COLLECT_POINT_REWARD)
  return entry
}

export function clearCollectedDolls() {
  writeEntries([])
}

export type ExchangeDollsResult = {
  pointsEarned: number
  remainingCount: number
}

/** 수집 인형을 포인트로 교환 — 해당 종류 인형 quantity개 제거 */
export function exchangeCollectedDolls(
  dollIndex: number,
  quantity: number,
): ExchangeDollsResult | null {
  if (dollIndex < 0 || quantity <= 0) return null

  const entries = readEntries()
  const matching = entries.filter((entry) => entry.dollIndex === dollIndex)
  if (matching.length < quantity) return null

  const removeIds = new Set(matching.slice(-quantity).map((entry) => entry.id))
  writeEntries(entries.filter((entry) => !removeIds.has(entry.id)))

  const pointsEarned = quantity * DOLL_EXCHANGE_POINT_VALUE
  addPoints(pointsEarned)

  return {
    pointsEarned,
    remainingCount: matching.length - quantity,
  }
}
