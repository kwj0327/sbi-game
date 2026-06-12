import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { BottomButtons } from '../components/claw-game/BottomButtons'
import { ClawGameSuccessPopup } from '../components/claw-game/ClawGameSuccessPopup'
import { InstructionBar } from '../components/claw-game/InstructionBar'
import { MachineViewport } from '../components/claw-game/MachineViewport'
import { applyStageContentVars } from '../game/stageContentRect'
import {
  DOLL_FALL_SEQUENCE_MS,
  ROD_REST_PX,
  ROD_TIP_PX,
} from '../components/claw-game/constants'
import type { DollState, GamePhase } from '../components/claw-game/types'
import { MobileLayout } from '../components/MobileLayout'
import {
  DOLL_COUNT,
  DOLL_IMAGES,
  ARC,
  RESULT_DELAY_MS,
  ROD_STRIKE_DURATION_MS,
  SPIN_SPEED,
  getClipPoint,
  getDollAngle,
  getDollVisual,
  getStrikeTarget,
} from '../game/clawGameConfig'
import './ClawGame.css'

function computeRodTravelPx(orbit: HTMLElement, strikeAngle: number, orbitScale: number) {
  const rod = orbit.parentElement?.querySelector<HTMLElement>('.machine-claw__rod')
  if (!rod) return 96 * orbitScale

  const orbitRect = orbit.getBoundingClientRect()
  const rodRect = rod.getBoundingClientRect()
  const rodTopFromStage = rodRect.top - orbitRect.top
  const railY = ARC.ringY / 100
  const clipY = getClipPoint(strikeAngle).y / 100
  const strikeY = (clipY * orbitScale + railY * (1 - orbitScale)) * orbitRect.height
  const restPx = ROD_REST_PX * orbitScale
  const tipPx = ROD_TIP_PX * orbitScale

  return Math.max(20 * orbitScale, strikeY - rodTopFromStage - restPx - tipPx)
}

type ClawGameProps = {
  onExit: () => void
}

export function ClawGame({ onExit }: ClawGameProps) {
  const [phase, setPhase] = useState<GamePhase>('spinning')
  const [trackOffset, setTrackOffset] = useState(0)
  const [rodProgress, setRodProgress] = useState(0)
  const [resultMessage, setResultMessage] = useState('')
  const [successDollIndex, setSuccessDollIndex] = useState<number | null>(null)
  const [strikeTargetIndex, setStrikeTargetIndex] = useState<number | null>(null)
  const [dolls, setDolls] = useState<DollState[]>(
    () => Array.from({ length: DOLL_COUNT }, () => ({ captured: false, falling: false, clipOpen: false })),
  )

  const trackOffsetRef = useRef(0)
  const phaseRef = useRef<GamePhase>('spinning')
  const orbitRef = useRef<HTMLDivElement>(null)
  const dollsRef = useRef(dolls)
  const [rodTravelPx, setRodTravelPx] = useState(96)
  const [orbitSize, setOrbitSize] = useState({ w: 0, h: 0 })
  const [orbitScale, setOrbitScale] = useState(1)

  useEffect(() => {
    dollsRef.current = dolls
  }, [dolls])

  const getCapturedFlags = useCallback(
    () => dollsRef.current.map((doll) => doll.captured),
    [],
  )

  const updateRodTravel = useCallback(() => {
    const orbit = orbitRef.current
    if (!orbit) return

    const gameStage = orbit.closest('.game-stage') as HTMLElement | null
    const stageRect = gameStage?.getBoundingClientRect()
    const content = gameStage
      ? applyStageContentVars(gameStage, stageRect?.width ?? 0, stageRect?.height ?? 0)
      : null
    const scale = content?.scale ?? 1

    if (gameStage) {
      gameStage.style.setProperty('--orbit-scale', String(scale))
      gameStage.style.setProperty('--orbit-rail-y', `${ARC.ringY}%`)
    }

    setOrbitScale(scale)
    setOrbitSize({ w: orbit.clientWidth, h: orbit.clientHeight })

    const strike = getStrikeTarget(trackOffsetRef.current, getCapturedFlags())
    const frontAngle = getDollAngle(strike.index, trackOffsetRef.current)
    setRodTravelPx(computeRodTravelPx(orbit, frontAngle, scale))
  }, [getCapturedFlags])

  useLayoutEffect(() => {
    updateRodTravel()

    const orbit = orbitRef.current
    const gameStage = orbit?.closest('.game-stage') as HTMLElement | null
    if (!orbit || !gameStage) return

    const observer = new ResizeObserver(updateRodTravel)
    observer.observe(gameStage)
    observer.observe(orbit)
    return () => observer.disconnect()
  }, [updateRodTravel])

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  useEffect(() => {
    trackOffsetRef.current = trackOffset
  }, [trackOffset])

  useEffect(() => {
    if (phase !== 'spinning') return

    let frameId = 0
    let lastTime = performance.now()

    const tick = (now: number) => {
      if (phaseRef.current !== 'spinning') return

      const delta = (now - lastTime) / 1000
      lastTime = now
      trackOffsetRef.current = (trackOffsetRef.current + SPIN_SPEED * delta) % 1
      setTrackOffset(trackOffsetRef.current)
      frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [phase])

  const resetRound = useCallback(() => {
    setStrikeTargetIndex(null)
    setRodProgress(0)
    setResultMessage('')
    setSuccessDollIndex(null)
    setPhase('spinning')
  }, [])

  const handlePlay = useCallback(() => {
    if (phaseRef.current !== 'spinning') return

    const strike = getStrikeTarget(trackOffsetRef.current, getCapturedFlags())
    if (strike.isEmptySlot) {
      return
    }

    setStrikeTargetIndex(strike.isHit ? strike.index : null)
    phaseRef.current = 'striking'
    setPhase('striking')
    setRodProgress(0)

    const orbit = orbitRef.current
    if (orbit) {
      const gameStage = orbit.closest('.game-stage') as HTMLElement | null
      const stageRect = gameStage?.getBoundingClientRect()
      const content = gameStage
        ? applyStageContentVars(gameStage, stageRect?.width ?? 0, stageRect?.height ?? 0)
        : null
      const scale = content?.scale ?? 1
      const frontAngle = getDollAngle(strike.index, trackOffsetRef.current)
      setRodTravelPx(computeRodTravelPx(orbit, frontAngle, scale))
    }

    const start = performance.now()

    const animateRod = (now: number) => {
      const progress = Math.min(1, (now - start) / ROD_STRIKE_DURATION_MS)
      setRodProgress(progress)

      if (progress < 1) {
        requestAnimationFrame(animateRod)
        return
      }

      if (strike.isHit) {
        setDolls((prev) =>
          prev.map((doll, index) =>
            index === strike.index ? { ...doll, clipOpen: true, falling: true } : doll,
          ),
        )
        setResultMessage('인형이 떨어지는 중…')
      } else {
        setResultMessage('실패! 집게를 맞추지 못했어요')
      }

      phaseRef.current = 'result'
      setPhase('result')

      window.setTimeout(() => {
        if (strike.isHit) {
          setDolls((prev) =>
            prev.map((doll, index) =>
              index === strike.index
                ? { ...doll, captured: true, falling: false, clipOpen: false }
                : doll,
            ),
          )
          setSuccessDollIndex(strike.index)
          setResultMessage('성공! 인형을 뽑았어요')
          return
        }
        resetRound()
      }, strike.isHit ? DOLL_FALL_SEQUENCE_MS : RESULT_DELAY_MS)
    }

    requestAnimationFrame(animateRod)
  }, [getCapturedFlags, resetRound])

  const visibleDolls = useMemo(() => {
    return dolls
      .map((doll, index) => ({ doll, index, visual: getDollVisual(index, trackOffset) }))
      .filter(({ doll }) => !doll.captured)
      .sort((a, b) => a.visual.zIndex - b.visual.zIndex)
  }, [dolls, trackOffset])

  const instruction =
    phase === 'spinning'
      ? '인형이 멈출 타이밍에 STOP을 누르세요'
      : resultMessage || '막대기가 내려가는 중...'

  return (
    <MobileLayout
      onExit={onExit}
      footer={<BottomButtons phase={phase} onStop={handlePlay} />}
    >
      <div className="claw-game">
        <InstructionBar message={instruction} />
        <div className="claw-game__machine">
          <MachineViewport
            orbitRef={orbitRef}
            phase={phase}
            rodProgress={rodProgress}
            rodTravelPx={rodTravelPx}
            visibleDolls={visibleDolls}
            strikeTargetIndex={strikeTargetIndex}
            orbitSize={orbitSize}
            orbitScale={orbitScale}
          />
          {successDollIndex !== null ? (
            <ClawGameSuccessPopup
              imageSrc={DOLL_IMAGES[successDollIndex % DOLL_IMAGES.length]}
              onConfirm={resetRound}
            />
          ) : null}
        </div>
      </div>
    </MobileLayout>
  )
}
