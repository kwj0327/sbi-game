import { useEffect, useState } from 'react'
import { useFirebaseUser } from '../context/FirebaseContext'
import { DISPLAY_NAME_MAX } from '../game/firestoreUsers'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { useUserProfile } from '../hooks/useUserProfile'
import './RankingPanel.css'

export function RankingPanel() {
  const { user } = useFirebaseUser()
  const { entries, myRank, myPoints, loading, error } = useLeaderboard()
  const {
    profile,
    loading: profileLoading,
    saving,
    error: profileError,
    saveDisplayName,
  } = useUserProfile()
  const [nameDraft, setNameDraft] = useState('')
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  useEffect(() => {
    if (profileLoading) return
    setNameDraft(profile.displayName)
  }, [profile.displayName, profileLoading])

  const handleSaveName = async () => {
    setSaveMessage(null)
    const saved = await saveDisplayName(nameDraft)
    if (saved) {
      setNameDraft(saved)
      setSaveMessage('이름이 저장되었어요.')
    }
  }

  return (
    <section className="ranking-panel" aria-labelledby="ranking-title">
      <header className="ranking-panel__header">
        <h2 id="ranking-title" className="ranking-panel__title">
          포인트 랭킹
        </h2>
        <p className="ranking-panel__subtitle">누적 포인트 기준 상위 플레이어</p>
      </header>

      {!user ? (
        <p className="ranking-panel__message">로그인 준비 중…</p>
      ) : null}

      {error ? <p className="ranking-panel__error">{error}</p> : null}
      {profileError ? <p className="ranking-panel__error">{profileError}</p> : null}

      {user && !error ? (
        <>
          <div className="ranking-panel__name-edit">
            <label className="ranking-panel__name-label" htmlFor="ranking-display-name">
              랭킹 이름
            </label>
            <div className="ranking-panel__name-row">
              <input
                id="ranking-display-name"
                className="ranking-panel__name-input"
                value={nameDraft}
                maxLength={DISPLAY_NAME_MAX}
                placeholder="2~12자"
                disabled={profileLoading || saving}
                onChange={(event) => {
                  setNameDraft(event.target.value)
                  setSaveMessage(null)
                }}
              />
              <button
                type="button"
                className="ranking-panel__name-save"
                disabled={profileLoading || saving || !nameDraft.trim()}
                onClick={handleSaveName}
              >
                {saving ? '저장 중…' : '저장'}
              </button>
            </div>
            {saveMessage ? (
              <p className="ranking-panel__name-success">{saveMessage}</p>
            ) : null}
          </div>

          <div className="ranking-panel__mine">
            <span className="ranking-panel__mine-label">내 순위</span>
            <span className="ranking-panel__mine-value">
              {loading ? '…' : myRank ? `${myRank}위` : '-'}
            </span>
            <span className="ranking-panel__mine-points">{loading ? '…' : `${myPoints}P`}</span>
          </div>
        </>
      ) : null}

      {loading ? <p className="ranking-panel__message">랭킹 불러오는 중…</p> : null}

      {!loading && !error && entries.length === 0 ? (
        <p className="ranking-panel__message">아직 랭킹 데이터가 없어요.</p>
      ) : null}

      {!loading && entries.length > 0 ? (
        <ol className="ranking-list">
          {entries.map((entry, index) => {
            const rank = index + 1
            const isMe = entry.uid === user?.uid

            return (
              <li
                key={entry.uid}
                className={`ranking-list__item${isMe ? ' ranking-list__item--me' : ''}`}
              >
                <span className="ranking-list__rank">{rank}</span>
                <span className="ranking-list__name">{entry.displayName}</span>
                <span className="ranking-list__points">{entry.points}P</span>
              </li>
            )
          })}
        </ol>
      ) : null}
    </section>
  )
}
