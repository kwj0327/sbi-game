import { createContext, useContext, type ReactNode } from 'react'
import { useFirebaseAuth } from '../hooks/useFirebaseAuth'

type FirebaseContextValue = ReturnType<typeof useFirebaseAuth>

const FirebaseContext = createContext<FirebaseContextValue | null>(null)

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const value = useFirebaseAuth()
  return <FirebaseContext.Provider value={value}>{children}</FirebaseContext.Provider>
}

export function useFirebaseUser() {
  const context = useContext(FirebaseContext)
  if (!context) {
    throw new Error('useFirebaseUser must be used within FirebaseProvider')
  }
  return context
}
