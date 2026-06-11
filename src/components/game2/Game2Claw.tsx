import type { Game2ClawState } from '../../game/game2Config'
import {
  GAME2_CLAW,
  GAME2_CLAW_POSE,
} from '../../game/game2Config'
import { getClawRenderFromPlayPosition, getDefaultGame2ClawState } from '../../game/game2PlayArea'

type Game2ClawProps = {
  claw?: Partial<Game2ClawState>
}

export function Game2Claw({ claw }: Game2ClawProps) {
  const defaults = getDefaultGame2ClawState()
  const xPercent = claw?.xPercent ?? defaults.xPercent
  const playY = claw?.playY ?? defaults.playY
  const open = claw?.open ?? defaults.open
  const phase = claw?.phase ?? defaults.phase
  const descendT = claw?.descendT ?? defaults.descendT
  const pose = open ? GAME2_CLAW_POSE.open : GAME2_CLAW_POSE.closed

  const render = getClawRenderFromPlayPosition(
    { x: xPercent, y: playY },
    { descendT },
  )
  const isCableAnimating =
    phase === 'descending' ||
    phase === 'down' ||
    phase === 'ascending' ||
    phase === 'returning' ||
    phase === 'homeward'

  return (
    <div
      className={`g2-claw${open ? ' g2-claw--open' : ' g2-claw--closed'}${isCableAnimating ? ' g2-claw--descending' : ''}`}
      style={{
        ['--g2-claw-x' as string]: `${render.xPercent}%`,
        ['--g2-claw-rail-y' as string]: `${GAME2_CLAW.railY}%`,
        ['--g2-claw-cable-length' as string]: `${render.cableLengthPercent}%`,
        ['--g2-claw-rig-width' as string]: `${render.rigWidthPercent}%`,
        ['--g2-claw-depth-scale' as string]: `${render.depthScale}`,
        ['--g2-arm-l' as string]: `${pose.armLeft}deg`,
        ['--g2-arm-r' as string]: `${pose.armRight}deg`,
        ['--g2-lower-l' as string]: `${pose.lowerLeft}deg`,
        ['--g2-lower-r' as string]: `${pose.lowerRight}deg`,
        ['--g2-tip-l' as string]: `${pose.tipShiftLeft}%`,
        ['--g2-tip-r' as string]: `${pose.tipShiftRight}%`,
        ['--g2-joint-top' as string]: `${pose.jointTop}%`,
      }}
      aria-hidden="true"
    >
      <div className="g2-claw__cable" />
      <div className="g2-claw__rig">
        <div className="g2-claw__stem" />
        <div className="g2-claw__body">
          <div className="g2-claw__body-cap g2-claw__body-cap--top" />
          <div className="g2-claw__body-core" />
          <div className="g2-claw__body-cap g2-claw__body-cap--bottom" />
          <div className="g2-claw__pivot g2-claw__pivot--left" />
          <div className="g2-claw__pivot g2-claw__pivot--right" />
        </div>
        <div className="g2-claw__arms">
          <div className="g2-claw__link g2-claw__link--left" />
          <div className="g2-claw__link g2-claw__link--right" />
          <div className="g2-claw__arm g2-claw__arm--left">
            <div className="g2-claw__arm-upper">
              <div className="g2-claw__arm-bar g2-claw__arm-bar--upper" />
            </div>
            <div className="g2-claw__arm-joint" />
            <div className="g2-claw__arm-lower">
              <div className="g2-claw__arm-bar g2-claw__arm-bar--lower" />
              <div className="g2-claw__tip" />
            </div>
          </div>
          <div className="g2-claw__arm g2-claw__arm--right">
            <div className="g2-claw__arm-upper">
              <div className="g2-claw__arm-bar g2-claw__arm-bar--upper" />
            </div>
            <div className="g2-claw__arm-joint" />
            <div className="g2-claw__arm-lower">
              <div className="g2-claw__arm-bar g2-claw__arm-bar--lower" />
              <div className="g2-claw__tip" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
