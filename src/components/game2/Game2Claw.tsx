import type { Game2ClawState } from '../../game/game2Config'
import {
  GAME2_CLAW,
  GAME2_CLAW_POSE,
  GAME2_STAGE,
} from '../../game/game2Config'
import { GAME3_GRAB } from '../../game/game3Config'
import {
  getClawRenderFromPlayPosition,
  getDefaultGame2ClawState,
  type Game2ClawRender,
} from '../../game/game2PlayArea'

type Game2ClawProps = {
  claw?: Partial<Game2ClawState>
  heldDoll?: {
    imageSrc: string
    rotateDeg: number
    faceScaleX: number
    depthScale: number
  } | null
  renderOverride?: Game2ClawRender
  /** CSS 변수 오버라이드 (Game3 등에서 레일·케이블 조정) */
  varOverrides?: Record<string, string | number>
  /** playfield y%/x% → rig 오프셋 변환 (기본 Game2 stage 비율) */
  playfieldAspectHOverW?: number
}

type ClawPose = { [K in keyof typeof GAME2_CLAW_POSE.open]: number }

/** 닫힘 포즈 보간 — gripT 0: closed 그대로 … 1: open과 동일 */
function lerpClawPose(gripT: number): ClawPose {
  const closed = GAME2_CLAW_POSE.closed
  const opened = GAME2_CLAW_POSE.open
  const t = Math.min(1, Math.max(0, gripT))

  return {
    armLeft: closed.armLeft + (opened.armLeft - closed.armLeft) * t,
    armRight: closed.armRight + (opened.armRight - closed.armRight) * t,
    lowerLeft: closed.lowerLeft + (opened.lowerLeft - closed.lowerLeft) * t,
    lowerRight: closed.lowerRight + (opened.lowerRight - closed.lowerRight) * t,
    tipShiftLeft: closed.tipShiftLeft + (opened.tipShiftLeft - closed.tipShiftLeft) * t,
    tipShiftRight: closed.tipShiftRight + (opened.tipShiftRight - closed.tipShiftRight) * t,
    jointTop: closed.jointTop + (opened.jointTop - closed.jointTop) * t,
  }
}

/**
 * 좌·우 팔 독립 오므림 — Game3 인형 실루엣 맞춤.
 * 어깨(윗팔)·관절 위치·팁은 벌린 상태로 고정하고, 다리(아랫팔)만 gripT로 움직인다.
 */
function lerpClawPoseSplit(gripTLeft: number, gripTRight: number): ClawPose {
  const opened = GAME2_CLAW_POSE.open
  const tl = Math.min(1, Math.max(0, gripTLeft))
  const tr = Math.min(1, Math.max(0, gripTRight))

  // 어깨 고정 시 다리가 인형까지 닿도록 Game3 전용으로 더 깊이 접는다
  const closedLowerL = GAME3_GRAB.lowerClosedLeftDeg
  const closedLowerR = GAME3_GRAB.lowerClosedRightDeg

  return {
    armLeft: opened.armLeft,
    armRight: opened.armRight,
    lowerLeft: closedLowerL + (opened.lowerLeft - closedLowerL) * tl,
    lowerRight: closedLowerR + (opened.lowerRight - closedLowerR) * tr,
    tipShiftLeft: opened.tipShiftLeft,
    tipShiftRight: opened.tipShiftRight,
    jointTop: opened.jointTop,
  }
}

export function Game2Claw({
  claw,
  heldDoll = null,
  renderOverride,
  varOverrides,
  playfieldAspectHOverW,
}: Game2ClawProps) {
  const defaults = getDefaultGame2ClawState()
  const xPercent = claw?.xPercent ?? defaults.xPercent
  const playY = claw?.playY ?? defaults.playY
  const open = claw?.open ?? defaults.open
  const phase = claw?.phase ?? defaults.phase
  const descendT = claw?.descendT ?? defaults.descendT
  const gripT = claw?.gripT ?? defaults.gripT
  const gripTLeft = claw?.gripTLeft
  const gripTRight = claw?.gripTRight
  const clawLiftPercent = claw?.clawLiftPercent ?? defaults.clawLiftPercent
  const useSplitGrip = gripTLeft !== undefined && gripTRight !== undefined
  const pose = open
    ? GAME2_CLAW_POSE.open
    : useSplitGrip
      ? lerpClawPoseSplit(gripTLeft, gripTRight)
      : lerpClawPose(gripT)

  const render =
    renderOverride ??
    getClawRenderFromPlayPosition(
      { x: xPercent, y: playY },
      {
        descendT,
        liftPercent: phase === 'idle' ? 0 : clawLiftPercent,
      },
    )

  // 잡은 지점 보존 — playfield % 오프셋을 rig 로컬 %로 변환 (rig는 depthScale로 스케일됨)
  const heldOffsetX = claw?.heldOffsetX ?? defaults.heldOffsetX
  const heldOffsetY = claw?.heldOffsetY ?? defaults.heldOffsetY
  const rigAspect = 380 / 319
  const rigOffXPercent =
    (heldOffsetX * 100) / (render.rigWidthPercent * render.depthScale)
  const aspectHOverW =
    playfieldAspectHOverW ?? GAME2_STAGE.viewHeight / GAME2_STAGE.viewWidth
  const rigOffYPercent =
    (heldOffsetY * aspectHOverW * 100) /
    (render.rigWidthPercent * rigAspect * render.depthScale)
  // 바닥 인형과 집게의 depth 스케일 차이 보정 (크기 점프 방지)
  const heldScaleFix = heldDoll ? heldDoll.depthScale / render.depthScale : 1
  const isCableAnimating =
    phase === 'descending' ||
    phase === 'down' ||
    phase === 'ascending' ||
    phase === 'returning' ||
    phase === 'homeward'

  return (
    <div
      className={`g2-claw${open ? ' g2-claw--open' : ' g2-claw--closed'}${isCableAnimating ? ' g2-claw--descending' : ''}${phase === 'down' ? ' g2-claw--closing' : ''}${heldDoll ? ' g2-claw--carrying' : ''}`}
      style={{
        ['--g2-claw-x' as string]: `${render.xPercent}%`,
        ['--g2-claw-rail-y' as string]: `${GAME2_CLAW.railY}%`,
        ['--g2-cable-visual-trim' as string]: `${GAME2_CLAW.cableVisualTrim}%`,
        ['--g2-cable-visual-extend' as string]: `${GAME2_CLAW.cableVisualExtend}%`,
        ['--g2-claw-cable-length' as string]: `${render.cableLengthPercent}%`,
        ['--g2-arm-height' as string]: `${GAME2_CLAW.rigArmHeightFrac * 100}%`,
        ['--g2-held-top' as string]: `${Math.max(GAME2_CLAW.rigTipYFrac - 0.02, 0.94) * 100}%`,
        ['--g2-held-top-closed' as string]: `${GAME2_CLAW.rigTipYFrac * 100}%`,
        ['--g2-claw-rig-width' as string]: `${render.rigWidthPercent}%`,
        ['--g2-claw-depth-scale' as string]: `${render.depthScale}`,
        ['--g2-arm-l' as string]: `${pose.armLeft}deg`,
        ['--g2-arm-r' as string]: `${pose.armRight}deg`,
        ['--g2-lower-l' as string]: `${pose.lowerLeft}deg`,
        ['--g2-lower-r' as string]: `${pose.lowerRight}deg`,
        ['--g2-tip-l' as string]: `${pose.tipShiftLeft}%`,
        ['--g2-tip-r' as string]: `${pose.tipShiftRight}%`,
        ['--g2-joint-top' as string]: `${pose.jointTop}%`,
        ...varOverrides,
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
        {heldDoll ? (
          <span
            className="g2-claw__held-doll"
            data-g2-depth-scale={heldDoll.depthScale}
            style={{
              ['--g2-held-rotate' as string]: `${heldDoll.rotateDeg}deg`,
              ['--g2-doll-face-x' as string]: `${heldDoll.faceScaleX}`,
              ['--g2-held-off-x' as string]: `${rigOffXPercent}%`,
              ['--g2-held-off-y' as string]: `${rigOffYPercent}%`,
              ['--g2-held-scale' as string]: `${heldScaleFix}`,
            }}
            aria-hidden="true"
          >
            <img
              src={heldDoll.imageSrc}
              alt=""
              className="g2-doll-sprite"
              draggable={false}
            />
          </span>
        ) : null}
      </div>
    </div>
  )
}
