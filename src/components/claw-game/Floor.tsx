import { DischargeChute } from './DischargeChute'

/** 바닥면(5) + 하단 여백(6) */
export function Floor() {
  return (
    <>
      <div className="machine-floor__gap" aria-hidden="true" />
      <div className="machine-floor" aria-hidden="true">
        <span className="machine-floor__surface" />
      </div>
    </>
  )
}

export { DischargeChute }
