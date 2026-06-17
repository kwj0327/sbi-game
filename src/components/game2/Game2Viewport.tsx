import { forwardRef, useCallback, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import game2MachineBackground from '../../assets/game2-machine-background.png'
import { applyStageContentVars } from '../../game/stageContentRect'
import { GAME2_CLAW, GAME2_DOLLS, type Game2ClawState } from '../../game/game2Config'
import {
  getDefaultGame2ClawState,
  getGame2DollById,
  measureGame2HeldDollReleasePoint,
  type Game2DollState,
  type Game2HeldDollReleasePoint,
} from '../../game/game2PlayArea'
import { Game2Claw } from './Game2Claw'
import { Game2ClawFloorMarker } from './Game2ClawFloorMarker'
import { Game2Dolls } from './Game2Dolls'
import { Game2FallingDolls } from './Game2FallingDolls'
import { Game2FloorGuide } from './Game2FloorGuide'
import './game2-machine.css'

export type Game2ViewportHandle = {
  measureHeldDollRelease: () => Game2HeldDollReleasePoint | null
}

type Game2ViewportProps = {
  claw?: Game2ClawState
  dolls?: readonly Game2DollState[]
}

export const Game2Viewport = forwardRef<Game2ViewportHandle, Game2ViewportProps>(function Game2Viewport(
  { claw = getDefaultGame2ClawState(), dolls = [] },
  ref,
) {
  const stageRef = useRef<HTMLDivElement>(null)
  const playfieldRef = useRef<HTMLDivElement>(null)
  const [playfieldMetrics, setPlayfieldMetrics] = useState({
    width: 0,
    height: 0,
    scale: 1,
  })

  const updateStageScale = useCallback(() => {
    const stage = stageRef.current
    if (!stage) return

    const rect = stage.getBoundingClientRect()
    const content = applyStageContentVars(stage, rect.width, rect.height)
    stage.style.setProperty('--g2-stage-scale', String(content.scale))
    stage.style.setProperty('--g2-claw-rail-y', `${GAME2_CLAW.railY}%`)
    setPlayfieldMetrics({
      width: content.width,
      height: content.height,
      scale: content.scale,
    })
  }, [])

  useLayoutEffect(() => {
    updateStageScale()

    const stage = stageRef.current
    if (!stage) return

    const observer = new ResizeObserver(updateStageScale)
    observer.observe(stage)
    return () => observer.disconnect()
  }, [updateStageScale])

  useImperativeHandle(
    ref,
    () => ({
      measureHeldDollRelease: () => {
        const playfield = playfieldRef.current
        if (!playfield) return null
        return measureGame2HeldDollReleasePoint(playfield)
      },
    }),
    [],
  )

  const heldDoll = getGame2DollById(dolls, claw.heldDollId)

  return (
    <div className="g2-viewport">
      <div className="g2-stage" ref={stageRef}>
        <img
          className="g2-stage__bg"
          src={game2MachineBackground}
          alt=""
          draggable={false}
        />

        <div
          ref={playfieldRef}
          className="g2-stage__playfield"
          style={{ ['--g2-doll-size' as string]: `${GAME2_DOLLS.emojiSizePx}px` }}
        >
          <Game2FloorGuide />
          <Game2Dolls dolls={dolls} heldDollId={claw.heldDollId} />
          <Game2FallingDolls
            dolls={dolls}
            playfieldW={playfieldMetrics.width}
            playfieldH={playfieldMetrics.height}
            stageScale={playfieldMetrics.scale}
          />
          <Game2ClawFloorMarker claw={claw} dolls={dolls} />
          <Game2Claw
            claw={claw}
            heldDoll={
              heldDoll
                ? {
                    imageSrc: heldDoll.imageSrc,
                    rotateDeg: heldDoll.rotateDeg,
                    faceScaleX: heldDoll.faceScaleX,
                    depthScale: heldDoll.depthScale,
                  }
                : null
            }
          />
        </div>
      </div>
    </div>
  )
})
