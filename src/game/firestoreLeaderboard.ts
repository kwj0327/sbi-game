import { getUserDocRef } from './firestoreUsers'
import { getFirestoreDb } from '../lib/firebase'
import {
  collection,
  getCountFromServer,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
  type Unsubscribe,
} from 'firebase/firestore'

export type LeaderboardEntry = {
  uid: string
  points: number
  displayName: string
}

export type LeaderboardSnapshot = {
  entries: LeaderboardEntry[]
  myRank: number | null
  myPoints: number
}

function formatPlayerName(uid: string, displayName?: unknown) {
  if (typeof displayName === 'string' && displayName.trim()) return displayName.trim()
  return `플레이어 ·${uid.slice(-4).toUpperCase()}`
}

export function subscribePointsLeaderboard(
  uid: string | null,
  onChange: (snapshot: LeaderboardSnapshot) => void,
  onError?: (error: Error) => void,
): Unsubscribe | null {
  const db = getFirestoreDb()
  if (!db) return null

  const topQuery = query(collection(db, 'users'), orderBy('points', 'desc'), limit(20))

  return onSnapshot(
    topQuery,
    async (snapshot) => {
      const entries: LeaderboardEntry[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data()
        return {
          uid: docSnap.id,
          points: typeof data.points === 'number' ? data.points : 0,
          displayName: formatPlayerName(docSnap.id, data.displayName),
        }
      })

      let myRank: number | null = null
      let myPoints = 0

      if (uid) {
        const mine = entries.find((entry) => entry.uid === uid)

        if (mine) {
          myPoints = mine.points
          myRank = entries.findIndex((entry) => entry.uid === uid) + 1
        } else {
          const userRef = getUserDocRef(uid)
          if (userRef) {
            const userSnap = await getDoc(userRef)
            myPoints =
              typeof userSnap.data()?.points === 'number' ? userSnap.data()!.points : 0
          }

          if (myPoints > 0) {
            const rankQuery = query(
              collection(db, 'users'),
              where('points', '>', myPoints),
            )
            const rankSnap = await getCountFromServer(rankQuery)
            myRank = rankSnap.data().count + 1
          } else {
            const rankQuery = query(
              collection(db, 'users'),
              where('points', '>', 0),
            )
            const rankSnap = await getCountFromServer(rankQuery)
            myRank = rankSnap.data().count + 1
          }
        }
      }

      onChange({ entries, myRank, myPoints })
    },
    (error) => {
      onError?.(error)
    },
  )
}
