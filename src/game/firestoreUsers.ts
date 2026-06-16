import {
  doc,
  getDoc,
  increment,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore'
import { getFirestoreDb } from '../lib/firebase'

export type UserProfile = {
  points: number
  collectionCount: number
  displayName: string
}

export const DISPLAY_NAME_MIN = 2
export const DISPLAY_NAME_MAX = 12

export function getUserDocRef(uid: string) {
  const db = getFirestoreDb()
  if (!db) return null
  return doc(db, 'users', uid)
}

export async function ensureUserDocument(
  uid: string,
  initialCollectionCount = 0,
): Promise<void> {
  const ref = getUserDocRef(uid)
  if (!ref) return

  const snapshot = await getDoc(ref)
  if (snapshot.exists()) return

  await setDoc(ref, {
    points: 0,
    collectionCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  if (initialCollectionCount > 0) {
    await updateDoc(ref, {
      collectionCount: initialCollectionCount,
      updatedAt: serverTimestamp(),
    })
  }
}

/** 앱 실행·로그인 시 로컬 수집 종류 수를 Firestore 랭킹 값으로 맞춤 */
export async function bootstrapUserCollection(uid: string, localUniqueCount: number): Promise<void> {
  if (localUniqueCount < 0) return

  const ref = getUserDocRef(uid)
  if (!ref) return

  const snapshot = await getDoc(ref)
  if (!snapshot.exists()) {
    await setDoc(ref, {
      points: 0,
      collectionCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  if (localUniqueCount === 0) return

  const latest = await getDoc(ref)
  const remoteCount =
    typeof latest.data()?.collectionCount === 'number' ? latest.data()!.collectionCount : 0

  if (remoteCount === localUniqueCount) return

  await updateDoc(ref, {
    collectionCount: localUniqueCount,
    updatedAt: serverTimestamp(),
  })
}

export function subscribeUserProfile(
  uid: string,
  onChange: (profile: UserProfile) => void,
  onError?: (error: Error) => void,
): Unsubscribe | null {
  const ref = getUserDocRef(uid)
  if (!ref) return null

  return onSnapshot(
    ref,
    (snapshot) => {
      const data = snapshot.data()
      onChange({
        points: typeof data?.points === 'number' && data.points >= 0 ? data.points : 0,
        collectionCount:
          typeof data?.collectionCount === 'number' && data.collectionCount >= 0
            ? data.collectionCount
            : 0,
        displayName: typeof data?.displayName === 'string' ? data.displayName : '',
      })
    },
    (error) => {
      onError?.(error)
    },
  )
}

export async function syncUserCollectionCount(uid: string, count: number): Promise<void> {
  await bootstrapUserCollection(uid, count)
}

export async function addUserPoints(uid: string, amount: number): Promise<number | null> {
  if (amount <= 0) return null

  const ref = getUserDocRef(uid)
  if (!ref) return null

  await ensureUserDocument(uid)
  await updateDoc(ref, {
    points: increment(amount),
    updatedAt: serverTimestamp(),
  })

  const snapshot = await getDoc(ref)
  const points = snapshot.data()?.points
  return typeof points === 'number' ? points : null
}

export function normalizeDisplayName(input: string): string | null {
  const trimmed = input.trim().replace(/\s+/g, ' ')
  if (trimmed.length < DISPLAY_NAME_MIN || trimmed.length > DISPLAY_NAME_MAX) return null
  return trimmed
}

export async function updateUserDisplayName(
  uid: string,
  displayName: string,
): Promise<string | null> {
  const normalized = normalizeDisplayName(displayName)
  if (!normalized) return null

  const ref = getUserDocRef(uid)
  if (!ref) return null

  await ensureUserDocument(uid)
  await updateDoc(ref, {
    displayName: normalized,
    updatedAt: serverTimestamp(),
  })

  return normalized
}
