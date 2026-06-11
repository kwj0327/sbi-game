import { ARC, getBackArcPath, getFrontArcPath } from '../../game/clawGameConfig'

function RailArc({ d }: { d: string }) {
  return (
    <>
      <path d={d} className="machine-rail__edge machine-rail__edge--outer" />
      <path d={d} className="machine-rail__core" />
      <path d={d} className="machine-rail__edge machine-rail__edge--inner machine-rail__edge--inner-a" />
      <path d={d} className="machine-rail__edge machine-rail__edge--inner machine-rail__edge--inner-b" />
    </>
  )
}

export function RotatingRail() {
  return (
    <svg
      className="machine-rail"
      viewBox={`0 0 ${ARC.viewWidth} ${ARC.viewHeight}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <RailArc d={getBackArcPath()} />
      <RailArc d={getFrontArcPath()} />
    </svg>
  )
}
