import machineBackground from '../../assets/machine-background.png'

/** game-stage 최하단 — PNG 배경만 */
export function MachineVisualLayer() {
  return (
    <img
      className="machine-bg"
      src={machineBackground}
      alt=""
      draggable={false}
    />
  )
}
