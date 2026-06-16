import { onAuthStateChanged, signInAnonymously, type User } from 'firebase/auth'
import { useEffect, useState } from 'react'
import { ALL_DOLL_COUNT } from '../game/dollConfig'
import { getCollectionSummary } from '../game/dollCollection'
import { bootstrapUserCollection } from '../game/firestoreUsers'
import { getFirebaseAuth, isFirebaseConfigured } from '../lib/firebase'

type FirebaseAuthState = {
  ready: boolean
  user: User | null
  error: string | null
}

export function useFirebaseAuth(): FirebaseAuthState {
  const [state, setState] = useState<FirebaseAuthState>({
    ready: !isFirebaseConfigured(),
    user: null,
    error: null,
  })

  useEffect(() => {
    const auth = getFirebaseAuth()
    if (!auth) {
      setState({
        ready: true,
        user: null,
        error: 'Firebase 설정을 불러오지 못했습니다.',
      })
      return
    }

    let signingIn = false

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const localUniqueCount = getCollectionSummary(ALL_DOLL_COUNT).uniqueCount
        bootstrapUserCollection(user.uid, localUniqueCount).finally(() => {
          setState({ ready: true, user, error: null })
        })
        return
      }

      if (signingIn) return
      signingIn = true
      setState((prev) => ({ ...prev, ready: false, error: null }))

      signInAnonymously(auth)
        .catch((error: unknown) => {
          const message =
            error instanceof Error ? error.message : 'Firebase 익명 로그인에 실패했습니다.'
          setState({ ready: true, user: null, error: message })
        })
        .finally(() => {
          signingIn = false
        })
    })

    return unsubscribe
  }, [])

  return state
}
