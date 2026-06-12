import {
  getGame2ChuteOutline,
  getGame2ClawZoneOutline,
  getGame2DollZoneOutline,
  getGame2PlayGridCells,
} from '../../game/game2PlayArea'

function toPolylinePoints(points: { x: number; y: number }[]) {
  return points.map(({ x, y }) => `${x},${y}`).join(' ')
}

function toPolygonPoints(corners: { x: number; y: number }[]) {
  return corners.map(({ x, y }) => `${x},${y}`).join(' ')
}

/** 🟢 집게 · 🔴 인형 · 🟡 배출구 · 격자 가이드 — stage 좌표 % */
export function Game2FloorGuide() {
  const clawZone = getGame2ClawZoneOutline()
  const dollZone = getGame2DollZoneOutline()
  const chute = getGame2ChuteOutline()
  const gridCells = getGame2PlayGridCells()

  return (
    <svg
      className="g2-floor-guide"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {gridCells.map((cell) => (
        <g key={cell.id} className="g2-floor-guide__cell">
          <polygon
            className="g2-floor-guide__cell-shape"
            points={toPolygonPoints(cell.corners)}
          />
          <text
            className="g2-floor-guide__cell-label"
            x={cell.center.x}
            y={cell.center.y}
          >
            {cell.id}
          </text>
        </g>
      ))}

      <polyline
        className="g2-floor-guide__edge g2-floor-guide__edge--claw-zone"
        points={toPolylinePoints(clawZone)}
        fill="none"
      />
      <polyline
        className="g2-floor-guide__edge g2-floor-guide__edge--doll-zone"
        points={toPolylinePoints(dollZone)}
        fill="none"
      />
      <polyline
        className="g2-floor-guide__edge g2-floor-guide__edge--chute"
        points={toPolylinePoints(chute)}
        fill="none"
      />
    </svg>
  )
}
