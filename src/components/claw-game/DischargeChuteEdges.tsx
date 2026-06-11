import { getAllChuteInnerEdgeSegments, getChuteAuxiliaryLines } from './chuteEdgeGeometry'

/** 배출구 입구 안쪽 경계선 */
export function DischargeChuteEdges() {
  const segments = getAllChuteInnerEdgeSegments()
  const auxiliaryLines = getChuteAuxiliaryLines()

  return (
    <div className="machine-chute-edges" aria-hidden="true">
      <svg className="machine-chute-edges__svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        {auxiliaryLines.map(({ x1, y1, x2, y2 }, index) => (
          <line
            key={`aux-${index}`}
            className="machine-chute-edges__line"
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {segments.map(({ id, x1, y1, x2, y2 }, index) => (
          <line
            key={`${id}-${index}`}
            className="machine-chute-edges__line"
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
    </div>
  )
}
