import { useCallback, useLayoutEffect, useRef } from 'react'
import game2MachineBackground from '../../assets/game2-machine-background.png'
import { applyStageContentVars } from '../../game/stageContentRect'
import { GAME2_CLAW, type Game2ClawState } from '../../game/game2Config'
import { getDefaultGame2ClawState } from '../../game/game2PlayArea'
import { Game2Claw } from './Game2Claw'
import { Game2ClawFloorMarker } from './Game2ClawFloorMarker'
import { Game2Dolls } from './Game2Dolls'
import { Game2FloorGuide } from './Game2FloorGuide'
import './game2-machine.css'

type Game2ViewportProps = {
  claw?: Game2ClawState
}

export function Game2Viewport({ claw = getDefaultGame2ClawState() }: Game2ViewportProps) {
  const stageRef = useRef<HTMLDivElement>(null)

  const updateStageScale = useCallback(() => {
    const stage = stageRef.current
    if (!stage) return

    const rect = stage.getBoundingClientRect()
    const content = applyStageContentVars(stage, rect.width, rect.height)
    stage.style.setProperty('--g2-stage-scale', String(content.scale))
    stage.style.setProperty('--g2-claw-rail-y', `${GAME2_CLAW.railY}%`)
  }, [])

  useLayoutEffect(() => {
    updateStageScale()

    const stage = stageRef.current
    if (!stage) return

    const observer = new ResizeObserver(updateStageScale)
    observer.observe(stage)
    return () => observer.disconnect()
  }, [updateStageScale])

  return (
    <div className="g2-viewport">
      <div className="g2-stage" ref={stageRef}>
        <img
          className="g2-stage__bg"
          src={game2MachineBackground}
          alt=""
          draggable={false}
        />

        <div className="g2-stage__playfield">
          <Game2FloorGuide />
          <Game2Dolls />
          <Game2ClawFloorMarker claw={claw} />
          <Game2Claw claw={claw} />
        </div>
      </div>
    </div>
  )
}
