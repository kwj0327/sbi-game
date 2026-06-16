import { onAuthStateChanged, signInAnonymously, type User } from 'firebase/auth'
import { useEffect, useState } from 'react'
import { ensureUserDocument } from '../game/firestoreUsers'
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
      setState({ ready: true, user: null, error: null })
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        ensureUserDocument(user.uid).finally(() => {
          setState({ ready: true, user, error: null })
        })
        return
      }

      signInAnonymously(auth).catch((error: unknown) => {
        const message =
          error instanceof Error ? error.message : 'Firebase 익명 로그인에 실패했습니다.'
        setState({ ready: true, user: null, error: message })
      })
    })

    return unsubscribe
  }, [])

  return state
}
