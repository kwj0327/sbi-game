import { DrawTicketRewardPopup } from './DrawTicketRewardPopup'
import { PointCoinIcon } from './PointCoinIcon'
import { ATTENDANCE_TICKET_REWARD } from '../game/clawCoins'
import {
  ATTENDANCE_REPEAT_CHECKIN_ENABLED,
  ATTENDANCE_WEEKLY_BONUS_TICKETS,
  ATTENDANCE_WEEK_LENGTH,
} from '../game/attendance'
import { useAttendance } from '../hooks/useAttendance'
import { useClawCoins } from '../hooks/useClawCoins'
import './AttendancePanel.css'

export function AttendancePanel() {
  const { summary, checkIn, lastRewardTickets, clearLastReward } = useAttendance()
  const { coins: tickets } = useClawCoins()

  return (
    <>
      <section className="attendance-panel" aria-labelledby="attendance-title">
        <header className="attendance-panel__header">
          <h2 id="attendance-title" className="attendance-panel__title">
            출석 관리
          </h2>
          <p className="attendance-panel__subtitle">
            매일 출석 시 뽑기 티켓 {ATTENDANCE_TICKET_REWARD}장!
            <br />
            {ATTENDANCE_WEEK_LENGTH}일 연속 출석 시 보너스 {ATTENDANCE_WEEKLY_BONUS_TICKETS}장!
          </p>
        </header>

        <div className="attendance-panel__stats">
          <article className="attendance-stat">
            <span className="attendance-stat__value">
              {summary.streak}/{ATTENDANCE_WEEK_LENGTH}
            </span>
            <span className="attendance-stat__label">이번 주 연속</span>
          </article>
          <article className="attendance-stat">
            <span className="attendance-stat__value">{summary.totalDays}</span>
            <span className="attendance-stat__label">누적 출석</span>
          </article>
          <article className="attendance-stat">
            <span className="attendance-stat__value">{tickets}</span>
            <span className="attendance-stat__label">뽑기 티켓</span>
          </article>
        </div>

        <button
          type="button"
          className="attendance-panel__check-in"
          disabled={summary.checkedInToday && !ATTENDANCE_REPEAT_CHECKIN_ENABLED}
          onClick={checkIn}
        >
          {summary.checkedInToday ? '오늘 출석 완료' : '오늘 출석하기'}
        </button>

        <div className="attendance-panel__recent" aria-label="이번 주 7일 출석">
          <p className="attendance-panel__recent-title">이번 주 출석</p>
          <ul className="attendance-recent">
            {summary.weekDays.map((day) => {
              const isBonusDay = day.day === ATTENDANCE_WEEK_LENGTH

              return (
                <li key={day.day} className="attendance-recent__item">
                  <span
                    className={`attendance-recent__dot${day.checked ? ' attendance-recent__dot--checked' : ''}`}
                    aria-hidden="true"
                  />
                  {isBonusDay ? (
                    <span
                      className="attendance-recent__bonus"
                      aria-label={`7일 보너스 ${ATTENDANCE_WEEKLY_BONUS_TICKETS}`}
                    >
                      <PointCoinIcon size="sm" className="attendance-recent__bonus-icon" />
                      <span className="attendance-recent__bonus-value">
                        {ATTENDANCE_WEEKLY_BONUS_TICKETS}
                      </span>
                    </span>
                  ) : (
                    <span className="attendance-recent__label">{day.label}</span>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      {lastRewardTickets !== null ? (
        <DrawTicketRewardPopup
          amount={lastRewardTickets.amount}
          totalTickets={lastRewardTickets.total}
          weeklyBonusGranted={lastRewardTickets.weeklyBonusGranted}
          onConfirm={clearLastReward}
        />
      ) : null}
    </>
  )
}
