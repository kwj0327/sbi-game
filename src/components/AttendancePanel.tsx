import { useAttendance } from '../hooks/useAttendance'
import './AttendancePanel.css'

export function AttendancePanel() {
  const { summary, checkIn } = useAttendance()

  return (
    <section className="attendance-panel" aria-labelledby="attendance-title">
      <header className="attendance-panel__header">
        <h2 id="attendance-title" className="attendance-panel__title">
          출석 관리
        </h2>
        <p className="attendance-panel__subtitle">매일 출석하고 기록을 확인해요.</p>
      </header>

      <div className="attendance-panel__stats">
        <article className="attendance-stat">
          <span className="attendance-stat__value">{summary.streak}</span>
          <span className="attendance-stat__label">연속 출석</span>
        </article>
        <article className="attendance-stat">
          <span className="attendance-stat__value">{summary.totalDays}</span>
          <span className="attendance-stat__label">누적 출석</span>
        </article>
      </div>

      <button
        type="button"
        className="attendance-panel__check-in"
        disabled={summary.checkedInToday}
        onClick={checkIn}
      >
        {summary.checkedInToday ? '오늘 출석 완료' : '오늘 출석하기'}
      </button>

      <div className="attendance-panel__recent" aria-label="최근 7일 출석">
        <p className="attendance-panel__recent-title">최근 7일</p>
        <ul className="attendance-recent">
          {summary.recentDays.map((day) => (
            <li key={day.key} className="attendance-recent__item">
              <span
                className={`attendance-recent__dot${day.checked ? ' attendance-recent__dot--checked' : ''}`}
                aria-hidden="true"
              />
              <span className="attendance-recent__label">{day.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
