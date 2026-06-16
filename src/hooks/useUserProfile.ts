import { useCallback, useEffect, useState } from 'react'
import { useFirebaseUser } from '../context/FirebaseContext'
import {
  DISPLAY_NAME_MAX,
  DISPLAY_NAME_MIN,
  subscribeUserProfile,
  updateUserDisplayName,
  type UserProfile,
} from '../game/firestoreUsers'

export function useUserProfile() {
  const { user, ready } = useFirebaseUser()
  const [profile, setProfile] = useState<UserProfile>({ points: 0, displayName: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!ready) return

    if (!user) {
      setProfile({ points: 0, displayName: '' })
      setLoading(false)
      return
    }

    setLoading(true)
    const unsubscribe =
      subscribeUserProfile(
        user.uid,
        (next) => {
          setProfile(next)
          setLoading(false)
        },
        (fetchError) => {
          setError(fetchError.message)
          setLoading(false)
        },
      ) ?? null

    if (!unsubscribe) {
      setLoading(false)
      setError('Firebase가 설정되지 않았습니다.')
    }

    return () => {
      unsubscribe?.()
    }
  }, [ready, user])

  const saveDisplayName = useCallback(
    async (displayName: string) => {
      if (!user) return null

      setSaving(true)
      setError(null)

      try {
        const saved = await updateUserDisplayName(user.uid, displayName)
        if (!saved) {
          setError(`이름은 ${DISPLAY_NAME_MIN}~${DISPLAY_NAME_MAX}자로 입력해 주세요.`)
          return null
        }
        return saved
      } catch (saveError) {
        const message =
          saveError instanceof Error ? saveError.message : '이름 저장에 실패했습니다.'
        setError(message)
        return null
      } finally {
        setSaving(false)
      }
    },
    [user],
  )

  return {
    profile,
    loading: !ready || loading,
    saving,
    error,
    saveDisplayName,
  }
}
