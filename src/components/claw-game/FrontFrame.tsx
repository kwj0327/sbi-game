/** 정면 유리 프레임 — 내부 박스를 감싸는 앞쪽 테두리 */
export function FrontFrame() {
  return (
    <div className="machine-front-frame" aria-hidden="true">
      <span className="machine-front-frame__edge machine-front-frame__edge--top" />
      <span className="machine-front-frame__edge machine-front-frame__edge--left" />
      <span className="machine-front-frame__edge machine-front-frame__edge--right" />
      <span className="machine-front-frame__edge machine-front-frame__edge--bottom" />
      <span className="machine-front-frame__glass machine-front-frame__glass--left" />
      <span className="machine-front-frame__glass machine-front-frame__glass--right" />
    </div>
  )
}
