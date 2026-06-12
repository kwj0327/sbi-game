import { useCallback, useEffect, useRef, useState } from 'react'
import { GameFooterBar } from '../components/GameFooterBar'
import { ClawGameSuccessPopup } from '../components/claw-game/ClawGameSuccessPopup'
import { Game2InstructionBar } from '../components/game2/Game2InstructionBar'
import { Game2PlayControls } from '../components/game2/Game2PlayControls'
import { Game2Viewport, type Game2ViewportHandle } from '../components/game2/Game2Viewport'
import { MobileLayout } from '../components/MobileLayout'
import { ALL_DOLL_IMAGES, pickRandomGame2DollIndices } from '../game/dollConfig'
import { addCollectedDoll } from '../game/dollCollection'
import {
  GAME2_CLAW,
  GAME2_CLOSE_SIM,
  GAME2_DROP,
  GAME2_SPAWN_DOLL_COUNT,
  getGame2ChuteFallSequenceMs,
  type Game2ClawPhase,
  type Game2ClawState,
} from '../game/game2Config'
import {
  createInitialGame2Dolls,
  easeOutCubic,
  getDefaultGame2ClawState,
  getDefaultGame2PlayPosition,
  createClawCloseSimContext,
  getChuteProximityT,
  getGame2ChuteBounds,
  getGame2ChuteCenter,
  getGame2DollById,
  getGame2HeldDollReleasePoint,
  getHeldDollAttachCenter,
  isClawMovementLocked,
  lerpPlayPosition,
  movePlayPosition,
  stepClawClose,
  type ClawCloseSimContext,
  type Game2DollState,
} from '../game/game2PlayArea'
import { preloadDollAlphaMasks } from '../game/dollAlphaMask'
import './Game2.css'

type Game2Props = {
  onExit: () => void
}

function getClawStatusMessage(phase: Game2ClawPhase, hasHeldDoll: boolean) {
  switch (phase) {
    case 'descending':
      return '집게가 하강 중입니다…'
    case 'down':
      return hasHeldDoll ? '인형을 잡았습니다!' : '집게가 닫혔습니다…'
    case 'ascending':
      return hasHeldDoll ? '인형을 들어 올리는 중…' : '집게가 상승 중입니다…'
    case 'returning':
      return hasHeldDoll ? '인형을 배출구로 옮기는 중…' : '배출구로 이동 중입니다…'
    case 'atChute':
      return '배출구에 도착했습니다.'
    case 'openAtChute':
      return '집게를 놓는 중…'
    case 'homeward':
      return '시작 위치로 돌아가는 중…'
    default:
      return '방향키로 이동 · ↓ 버튼으로 하강'
  }
}

export function Game2({ onExit }: Game2Props) {
  const [claw, setClaw] = useState<Game2ClawState>(getDefaultGame2ClawState)
  const [dolls, setDolls] = useState<Game2DollState[]>(() => {
    if (GAME2_SPAWN_DOLL_COUNT <= 0) return []
    const sessionIndices = pickRandomGame2DollIndices()
    return createInitialGame2Dolls(sessionIndices.map((index) => ALL_DOLL_IMAGES[index]))
  })
  const [successDollImage, setSuccessDollImage] = useState<string | null>(null)
  const clawRef = useRef(claw)
  clawRef.current = claw
  const dollsRef = useRef(dolls)
  dollsRef.current = dolls
  const successDollImageRef = useRef(successDollImage)
  successDollImageRef.current = successDollImage
  const returnOriginRef = useRef<{ x: number; y: number } | null>(null)
  const homewardOriginRef = useRef<{ x: number; y: number } | null>(null)
  const viewportRef = useRef<Game2ViewportHandle>(null)
  const closeSimCtxRef = useRef<ClawCloseSimContext | null>(null)

  const controlsLocked = isClawMovementLocked(claw) || successDollImage !== null

  useEffect(() => {
    preloadDollAlphaMasks(dollsRef.current.map((doll) => doll.imageSrc))
  }, [])

  const handleMove = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    setClaw((prev) => {
      if (isClawMovementLocked(prev)) return prev
      const next = movePlayPosition({ x: prev.xPercent, y: prev.playY }, direction)
      return { ...prev, xPercent: next.x, playY: next.y }
    })
  }, [])

  const handleDescend = useCallback(() => {
    setClaw((prev) => {
      if (prev.phase !== 'idle') return prev
      return {
        ...prev,
        open: true,
        phase: 'descending',
        descendT: 0,
        heldDollId: null,
        gripT: 0,
        heldOffsetX: 0,
        heldOffsetY: 0,
        heldGripQuality: 1,
      }
    })
  }, [])

  /** 운반 중 낙하 — 들고 있던 인형을 떨어뜨린 그 지점 바로 아래에 떨어뜨림 */
  const dropHeldDoll = useCallback(() => {
    const current = clawRef.current
    const heldId = current.heldDollId
    if (heldId === null) return

    const release =
      viewportRef.current?.measureHeldDollRelease() ??
      getGame2HeldDollReleasePoint(current)
    // 보정 없이 떨어뜨린 시점의 위치 그대로 착지
    const floor = { x: release.x, y: current.playY }

    // 배출구 구멍 위에서 놓쳤다면 — 그대로 배출구로 들어가 획득
    const chute = getGame2ChuteBounds()
    const overChute =
      floor.x >= chute.leftX &&
      floor.x <= chute.rightX &&
      floor.y >= chute.topY &&
      floor.y <= chute.bottomY

    if (overChute) {
      setDolls((prev) =>
        prev.map((doll) =>
          doll.id === heldId
            ? {
                ...doll,
                falling: true,
                xPercent: release.x,
                playY: release.y,
                depthScale: release.depthScale,
              }
            : doll,
        ),
      )
      setClaw((prev) => ({
        ...prev,
        heldDollId: null,
        heldOffsetX: 0,
        heldOffsetY: 0,
        // 인형이 빠지는 순간 집게가 도로 살짝 벌어짐
        gripT: Math.min(1, prev.gripT + GAME2_CLOSE_SIM.slipReopenT),
        heldGripQuality: 1,
      }))

      window.setTimeout(() => {
        // 부수효과(도감 저장·팝업)는 updater 밖에서 — StrictMode 중복 실행 방지
        const captured = getGame2DollById(dollsRef.current, heldId)
        if (captured) {
          const dollIndex = ALL_DOLL_IMAGES.indexOf(captured.imageSrc)
          if (dollIndex >= 0) addCollectedDoll(dollIndex, 'game2')
          setSuccessDollImage(captured.imageSrc)
        }
        setDolls((prev) =>
          prev.map((doll) =>
            doll.id === heldId ? { ...doll, falling: false, captured: true } : doll,
          ),
        )
      }, getGame2ChuteFallSequenceMs())
      return
    }

    const heldDoll = getGame2DollById(dollsRef.current, heldId)
    const baseRotate = heldDoll?.rotateDeg ?? 0
    const toppled = Math.random() < GAME2_DROP.dropToppleChance
    const endRotate = toppled
      ? baseRotate + (Math.random() < 0.5 ? -1 : 1) * (60 + Math.random() * 50)
      : baseRotate + (Math.random() * 24 - 12)

    // depthScale은 건드리지 않음 — 잡힐 당시 크기 그대로 떨어져야 자연스러움
    setDolls((prev) =>
      prev.map((doll) =>
        doll.id === heldId
          ? {
              ...doll,
              falling: true,
              fallKind: 'floor' as const,
              xPercent: release.x,
              playY: release.y,
              fallTargetXPercent: floor.x,
              fallTargetPlayY: floor.y,
              fallEndRotateDeg: endRotate,
            }
          : doll,
      ),
    )
    setClaw((prev) => ({
      ...prev,
      heldDollId: null,
      heldOffsetX: 0,
      heldOffsetY: 0,
      // 인형이 빠지는 순간 집게가 도로 살짝 벌어짐
      gripT: Math.min(1, prev.gripT + GAME2_CLOSE_SIM.slipReopenT),
      heldGripQuality: 1,
    }))

    window.setTimeout(() => {
      setDolls((prev) =>
        prev.map((doll) =>
          doll.id === heldId
            ? {
                ...doll,
                falling: false,
                fallKind: undefined,
                xPercent: floor.x,
                playY: floor.y,
                rotateDeg: endRotate,
              }
            : doll,
        ),
      )
    }, GAME2_DROP.fallDurationMs)
  }, [])

  useEffect(() => {
    if (claw.phase !== 'descending') return

    const start = performance.now()
    const { descendDurationMs } = GAME2_CLAW
    let frame = 0

    const animate = (now: number) => {
      const linear = Math.min(1, (now - start) / descendDurationMs)
      const eased = easeOutCubic(linear)

      setClaw((prev) => {
        if (prev.phase !== 'descending') return prev
        if (linear >= 1) {
          // 사전 판정 없음 — 벌린 채(gripT 1) 착지, 오므림 시뮬레이션이 결과를 결정
          return {
            ...prev,
            phase: 'down',
            descendT: 1,
            open: false,
            heldDollId: null,
            gripT: 1,
            heldOffsetX: 0,
            heldOffsetY: 0,
          }
        }
        return { ...prev, descendT: eased }
      })

      if (linear < 1) {
        frame = requestAnimationFrame(animate)
      }
    }

    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [claw.phase])

  useEffect(() => {
    if (claw.phase !== 'down') return

    let frame = 0
    let holdTimeout = 0
    let last = performance.now()
    closeSimCtxRef.current = createClawCloseSimContext()

    const animate = (now: number) => {
      const dt = Math.min(50, now - last)
      last = now

      const current = clawRef.current
      const result = stepClawClose(
        { x: current.xPercent, y: current.playY, gripT: current.gripT },
        dollsRef.current,
        dt,
        closeSimCtxRef.current ?? createClawCloseSimContext(),
      )

      // 밀리거나 쓰러진 인형들 — 위치·기울기 반영 (실패해도 그 자리에 남음)
      if (result.dollUpdates.length > 0) {
        setDolls((prev) =>
          prev.map((doll) => {
            const update = result.dollUpdates.find((u) => u.id === doll.id)
            return update
              ? {
                  ...doll,
                  xPercent: update.xPercent,
                  playY: update.playY,
                  rotateDeg: update.rotateDeg,
                }
              : doll
          }),
        )
      }

      if (!result.done) {
        setClaw((prev) =>
          prev.phase === 'down' ? { ...prev, gripT: result.gripT } : prev,
        )
        frame = requestAnimationFrame(animate)
        return
      }

      // 오므림 종료 — 양 팁이 동시에 물고 있으면 그 인형이 잡힌 것
      setClaw((prev) => {
        if (prev.phase !== 'down') return prev

        let heldOffsetX = 0
        let heldOffsetY = 0
        if (result.grabbedId !== null) {
          const heldDoll = getGame2DollById(dollsRef.current, result.grabbedId)
          if (heldDoll) {
            const attach = getHeldDollAttachCenter({
              xPercent: prev.xPercent,
              playY: prev.playY,
              descendT: 1,
            })
            heldOffsetX = heldDoll.xPercent - attach.x
            heldOffsetY = heldDoll.playY - attach.y
          }
        }

        return {
          ...prev,
          gripT: result.gripT,
          heldDollId: result.grabbedId,
          heldOffsetX,
          heldOffsetY,
          heldGripQuality: result.grabbedId !== null ? result.grabQuality : 1,
        }
      })

      holdTimeout = window.setTimeout(() => {
        setClaw((prev) => {
          if (prev.phase !== 'down') return prev
          return { ...prev, phase: 'ascending', open: false }
        })
      }, GAME2_CLOSE_SIM.holdAfterCloseMs)
    }

    frame = requestAnimationFrame(animate)
    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(holdTimeout)
    }
  }, [claw.phase])

  useEffect(() => {
    if (claw.phase !== 'ascending') return

    const start = performance.now()
    const { ascendDurationMs } = GAME2_CLAW
    let frame = 0

    // 들어 올리기 낙하 — 물림 품질이 낮을수록, 배출구에 가까울수록 잘 떨어짐 (상승 시작 시 1회 판정)
    const quality = clawRef.current.heldGripQuality
    const proximity = getChuteProximityT({
      x: clawRef.current.xPercent,
      y: clawRef.current.playY,
    })
    const proximityFactor =
      GAME2_DROP.chuteDistanceFactorFar +
      (GAME2_DROP.chuteDistanceFactorNear - GAME2_DROP.chuteDistanceFactorFar) *
        proximity
    const dropChance =
      (GAME2_DROP.liftDropChanceMin +
        (GAME2_DROP.liftDropChanceMax - GAME2_DROP.liftDropChanceMin) *
          (1 - quality)) *
      proximityFactor
    const willDrop =
      clawRef.current.heldDollId !== null && Math.random() < dropChance
    const dropAtT = 0.3 + Math.random() * 0.55
    let dropped = false

    const animate = (now: number) => {
      const linear = Math.min(1, (now - start) / ascendDurationMs)
      const eased = easeOutCubic(linear)

      if (willDrop && !dropped && linear >= dropAtT) {
        dropped = true
        dropHeldDoll()
      }

      setClaw((prev) => {
        if (prev.phase !== 'ascending') return prev
        if (linear >= 1) {
          returnOriginRef.current = { x: prev.xPercent, y: prev.playY }
          return { ...prev, phase: 'returning', descendT: 0, open: false }
        }
        return { ...prev, descendT: 1 - eased }
      })

      if (linear < 1) {
        frame = requestAnimationFrame(animate)
      }
    }

    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [claw.phase, dropHeldDoll])

  useEffect(() => {
    if (claw.phase !== 'returning') return

    const from = returnOriginRef.current ?? {
      x: clawRef.current.xPercent,
      y: clawRef.current.playY,
    }
    returnOriginRef.current = from

    const to = getGame2ChuteCenter()
    const start = performance.now()
    const { returnToChuteDurationMs } = GAME2_CLAW
    let frame = 0
    let lastTime = start

    const animate = (now: number) => {
      const dt = now - lastTime
      lastTime = now

      // 운반 중 낙하 — 품질이 낮을수록, 배출구에 다가갈수록 초당 확률 증가
      if (clawRef.current.heldDollId !== null) {
        const quality = clawRef.current.heldGripQuality
        const proximity = getChuteProximityT({
          x: clawRef.current.xPercent,
          y: clawRef.current.playY,
        })
        const proximityFactor =
          GAME2_DROP.chuteDistanceFactorFar +
          (GAME2_DROP.chuteDistanceFactorNear - GAME2_DROP.chuteDistanceFactorFar) *
            proximity
        const perSec =
          (GAME2_DROP.carryDropPerSecMin +
            (GAME2_DROP.carryDropPerSecMax - GAME2_DROP.carryDropPerSecMin) *
              (1 - quality)) *
          proximityFactor
        if (Math.random() < (perSec * dt) / 1000) {
          dropHeldDoll()
        }
      }

      const linear = Math.min(1, (now - start) / returnToChuteDurationMs)
      const eased = easeOutCubic(linear)
      const next = lerpPlayPosition(from, to, eased)

      setClaw((prev) => {
        if (prev.phase !== 'returning') return prev
        if (linear >= 1) {
          return {
            ...prev,
            phase: 'atChute',
            xPercent: to.x,
            playY: to.y,
            descendT: 0,
            open: false,
          }
        }
        return {
          ...prev,
          xPercent: next.x,
          playY: next.y,
          descendT: 0,
          open: false,
        }
      })

      if (linear < 1) {
        frame = requestAnimationFrame(animate)
      }
    }

    frame = requestAnimationFrame(animate)
    return () => {
      cancelAnimationFrame(frame)
      returnOriginRef.current = null
    }
  }, [claw.phase, dropHeldDoll])

  useEffect(() => {
    if (claw.phase !== 'atChute') return

    const timeout = window.setTimeout(() => {
      const heldId = clawRef.current.heldDollId
      if (heldId !== null) {
        const release =
          viewportRef.current?.measureHeldDollRelease() ??
          getGame2HeldDollReleasePoint(clawRef.current)
        setDolls((prev) =>
          prev.map((doll) =>
            doll.id === heldId
              ? {
                  ...doll,
                  falling: true,
                  xPercent: release.x,
                  playY: release.y,
                  depthScale: release.depthScale,
                }
              : doll,
          ),
        )

        window.setTimeout(() => {
          // 부수효과(도감 저장·팝업)는 updater 밖에서 — StrictMode 중복 실행 방지
          const captured = getGame2DollById(dollsRef.current, heldId)
          if (captured) {
            const dollIndex = ALL_DOLL_IMAGES.indexOf(captured.imageSrc)
            if (dollIndex >= 0) addCollectedDoll(dollIndex, 'game2')
            setSuccessDollImage(captured.imageSrc)
          }
          setDolls((prev) =>
            prev.map((doll) =>
              doll.id === heldId ? { ...doll, falling: false, captured: true } : doll,
            ),
          )
        }, getGame2ChuteFallSequenceMs())
      }

      setClaw((prev) => {
        if (prev.phase !== 'atChute') return prev
        return { ...prev, phase: 'openAtChute', open: true, heldDollId: null }
      })
    }, GAME2_CLAW.holdAtChuteMs)

    return () => window.clearTimeout(timeout)
  }, [claw.phase])

  useEffect(() => {
    if (claw.phase !== 'openAtChute') return

    const timeout = window.setTimeout(() => {
      setClaw((prev) => {
        if (prev.phase !== 'openAtChute') return prev
        homewardOriginRef.current = { x: prev.xPercent, y: prev.playY }
        return { ...prev, phase: 'homeward', open: true }
      })
    }, GAME2_CLAW.holdAfterOpenAtChuteMs)

    return () => window.clearTimeout(timeout)
  }, [claw.phase])

  useEffect(() => {
    if (claw.phase !== 'homeward') return

    const from = homewardOriginRef.current ?? {
      x: clawRef.current.xPercent,
      y: clawRef.current.playY,
    }
    homewardOriginRef.current = from

    const to = getDefaultGame2PlayPosition()
    const start = performance.now()
    const { returnToHomeDurationMs } = GAME2_CLAW
    let frame = 0

    const animate = (now: number) => {
      const linear = Math.min(1, (now - start) / returnToHomeDurationMs)
      const eased = easeOutCubic(linear)
      const next = lerpPlayPosition(from, to, eased)

      setClaw((prev) => {
        if (prev.phase !== 'homeward') return prev
        if (linear >= 1) {
          return {
            ...prev,
            phase: 'idle',
            xPercent: to.x,
            playY: to.y,
            descendT: 0,
            open: true,
            heldDollId: null,
          }
        }
        return {
          ...prev,
          xPercent: next.x,
          playY: next.y,
          descendT: 0,
          open: true,
        }
      })

      if (linear < 1) {
        frame = requestAnimationFrame(animate)
      }
    }

    frame = requestAnimationFrame(animate)
    return () => {
      cancelAnimationFrame(frame)
      homewardOriginRef.current = null
    }
  }, [claw.phase])

  const handleMoveRef = useRef(handleMove)
  handleMoveRef.current = handleMove

  useEffect(() => {
    const held = new Set<string>()
    let interval: number | null = null

    const tick = () => {
      if (isClawMovementLocked(clawRef.current)) return
      if (successDollImageRef.current !== null) return
      if (held.has('ArrowUp')) handleMoveRef.current('up')
      if (held.has('ArrowDown')) handleMoveRef.current('down')
      if (held.has('ArrowLeft')) handleMoveRef.current('left')
      if (held.has('ArrowRight')) handleMoveRef.current('right')
    }

    const stop = () => {
      if (interval !== null) {
        window.clearInterval(interval)
        interval = null
      }
    }

    const start = () => {
      if (interval !== null) return
      if (isClawMovementLocked(clawRef.current)) return
      tick()
      interval = window.setInterval(tick, GAME2_CLAW.moveRepeatMs)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return
      event.preventDefault()
      if (isClawMovementLocked(clawRef.current)) return
      if (held.has(event.key)) return
      held.add(event.key)
      start()
    }

    const onKeyUp = (event: KeyboardEvent) => {
      held.delete(event.key)
      if (held.size === 0) stop()
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    return () => {
      stop()
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  return (
    <MobileLayout
      onExit={onExit}
      footer={
        <GameFooterBar className="game-footer-bar--game2">
          <Game2PlayControls
            onMove={handleMove}
            onDescend={handleDescend}
            disabled={controlsLocked}
          />
        </GameFooterBar>
      }
    >
      <div className="game2">
        <Game2InstructionBar
          message={getClawStatusMessage(claw.phase, claw.heldDollId !== null)}
        />
        <Game2Viewport ref={viewportRef} claw={claw} dolls={dolls} />
        {successDollImage !== null ? (
          <ClawGameSuccessPopup
            imageSrc={successDollImage}
            onConfirm={() => setSuccessDollImage(null)}
          />
        ) : null}
      </div>
    </MobileLayout>
  )
}
