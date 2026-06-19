import type { Game3DollState } from '../../game/game3PlayArea'
import './game3-dolls.css'

type Game3CarriedDollProps = {
  doll: Game3DollState
  centerXPercent: number
  centerYPercent: number
}

/** 집게 rig 밖 — world 좌표·각도 고정. 집게 기울기와 무관하게 표시 */
export function Game3CarriedDoll({
  doll,
  centerXPercent,
  centerYPercent,
}: Game3CarriedDollProps) {
  return (
    <div
      className="g3-carried-doll"
      data-doll-id={doll.id}
      style={{
        left: `${centerXPercent}%`,
        top: `${centerYPercent}%`,
        ['--g3-doll-rotate' as string]: `${doll.rotateDeg}deg`,
        ['--g3-doll-face-x' as string]: `${doll.faceScaleX}`,
      }}
      aria-hidden="true"
    >
      <img src={doll.imageSrc} alt="" className="g3-doll-sprite" draggable={false} />
    </div>
  )
}
