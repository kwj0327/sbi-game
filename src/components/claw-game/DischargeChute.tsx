/** 5|6 junction 배출구 — 5·6과 동일 비율(18:10), 입구(lip) + 출구(drop) */
import { DischargeChuteEdges } from './DischargeChuteEdges'

export function DischargeChute() {
  return (
    <>
      <div className="machine-chute__drop" aria-hidden="true" />
      <div className="machine-chute" aria-hidden="true">
        <span className="machine-chute__lip" />
      </div>
      <DischargeChuteEdges />
    </>
  )
}
