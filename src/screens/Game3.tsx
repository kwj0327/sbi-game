import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { DrawTicketInsufficientPopup } from '../components/DrawTicketInsufficientPopup'
import { GameFooterStatus } from '../components/GameFooterStatus'
import { GameFooterBar } from '../components/GameFooterBar'
import { ClawGameSuccessPopup } from '../components/claw-game/ClawGameSuccessPopup'
import { Game2InstructionBar } from '../components/game2/Game2InstructionBar'
import { Game2PlayControls } from '../components/game2/Game2PlayControls'
import { Game3Viewport, type Game3ViewportHandle } from '../components/game3/Game3Viewport'
import { MobileLayout } from '../components/MobileLayout'
import { DRAW_TICKET_PLAY_COST, getClawCoinBalance, spendClawCoins } from '../game/clawCoins'
import { ALL_DOLL_IMAGES } from '../game/dollConfig'
import { addCollectedDoll } from '../game/dollCollection'
import { preloadDollAlphaMasks } from '../game/dollAlphaMask'
import { GAME2_CLAW } from '../game/game2Config'
import { easeOutCubic } from '../game/game2PlayArea'
import {
  GAME3_CLAW,
  GAME3_GUIDE,
  getDefaultGame3ClawState,
  getGame3ChuteFallSequenceMs,
  isGame3ClawMovementLocked,
} from '../game/game3Config'
import {
  createRandomGame3Dolls,
  getGame3ChuteCenterX,
  getGame3DollById,
  getGame3GripTForDollSplit,
  getGame3HeldDollAttachCenter,
  getGame3HeldDollOffsets,
  getGame3HeldDollReleasePoint,
  lerpGame3ClawX,
  moveGame3ClawX,
  resolveGame3DescentStop,
  type Game3DollState,
} from '../game/game3PlayArea'
import './Game3.css'

type Game3Props = {
  onExit: () => void
  onGoToAttendance: () => void
}

function getStatusMessage(phase: string, hasHeldDoll: boolean) {
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
      return hasHeldDoll ? '배출구에 도착했습니다.' : '배출구에 도착했습니다.'
    case 'openAtChute':
      return '집게가 벌어지며 인형이 떨어집니다…'
    case 'homeward':
      return '시작 위치로 돌아가는 중…'
    default:
      return '조이스틱 좌우로 이동 · ↓로 하강'
  }
}

export function Game3({ onExit, onGoToAttendance }: Game3Props) {
  const [claw, setClaw] = useState(getDefaultGame3ClawState)
  const [dolls, setDolls] = useState<Game3DollState[]>(() =>
    createRandomGame3Dolls(ALL_DOLL_IMAGES, GAME3_GUIDE.giftBoxBoundaryX),
  )
  const [successDollImage, setSuccessDollImage] = useState<string | null>(null)
  const [playNotice, setPlayNotice] = useState('')
  const [ticketPopupOpen, setTicketPopupOpen] = useState(false)
  const clawRef = useRef(claw)
  clawRef.current = claw
  const dollsRef = useRef(dolls)
  dollsRef.current = dolls
  const returnOriginXRef = useRef<number | null>(null)
  const homewardOriginXRef = useRef<number | null>(null)
  const viewportRef = useRef<Game3ViewportHandle>(null)
  const descentStopRef = useRef<{ clawLiftPercent: number; hitDollId: number | null }>({
    clawLiftPercent: 0,
    hitDollId: null,
  })
  /** 오므림 직후 바닥 인형 위치 — useLayoutEffect에서 held 위치 보정용 */
  const pendingHeldSnapRef = useRef<{
    dollId: number
    xPercent: number
    centerYPercent: number
  } | null>(null)

  useEffect(() => {
    preloadDollAlphaMasks(ALL_DOLL_IMAGES)
  }, [])

  useLayoutEffect(() => {
    const pending = pendingHeldSnapRef.current
    if (!pending || claw.heldDollId !== pending.dollId) return

    const heldMeasure = viewportRef.current?.measureHeldDoll()
    if (!heldMeasure) return

    pendingHeldSnapRef.current = null
    const dX = pending.xPercent - heldMeasure.xPercent
    const dY = pending.centerYPercent - heldMeasure.centerYPercent
    if (Math.abs(dX) < 0.02 && Math.abs(dY) < 0.02) return

    setClaw((prev) => {
      if (prev.heldDollId !== pending.dollId) return prev
      return {
        ...prev,
        heldOffsetX: prev.heldOffsetX + dX,
        heldOffsetY: prev.heldOffsetY + dY,
      }
    })
  }, [claw.heldDollId])

  const controlsLocked = isGame3ClawMovementLocked(claw) || successDollImage !== null

  const handleMove = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (direction !== 'left' && direction !== 'right') return

    setClaw((prev) => {
      if (isGame3ClawMovementLocked(prev)) return prev
      return { ...prev, xPercent: moveGame3ClawX(prev.xPercent, direction) }
    })
  }, [])

  const handleDescend = useCallback(() => {
    if (clawRef.current.phase !== 'idle') return

    if (getClawCoinBalance() < DRAW_TICKET_PLAY_COST) {
      setTicketPopupOpen(true)
      return
    }

    if (spendClawCoins(DRAW_TICKET_PLAY_COST) === null) {
      setTicketPopupOpen(true)
      return
    }

    setPlayNotice('')
    // 정확한 정지 높이는 하강 effect에서 실제 DOM을 측정해 정한다
    descentStopRef.current = { clawLiftPercent: 0, hitDollId: null }

    setClaw((prev) => {
      if (prev.phase !== 'idle') return prev
      return {
        ...prev,
        open: true,
        phase: 'descending',
        // 하강은 lift를 직접 구동 — descendT=1 고정, clawLiftPercent로 높이 제어
        descendT: 1,
        heldDollId: null,
        gripT: 0,
        gripTLeft: undefined,
        gripTRight: undefined,
        heldOffsetX: 0,
        heldOffsetY: 0,
        clawLiftPercent: GAME3_CLAW.cableVisualLift,
      }
    })
  }, [])

  // 하강 — 실제 렌더된 집게(초록 몸통/빨강 다리)와 인형 실루엣을 DOM에서 측정해
  // 부품이 인형에 닿는(또는 바닥) 높이까지만 내려간다. 시각과 판정이 항상 일치.
  useEffect(() => {
    if (claw.phase !== 'descending') return

    const clawX = clawRef.current.xPercent
    const measured = viewportRef.current?.measureDescentStop() ?? null
    const fallback = resolveGame3DescentStop(clawX, dollsRef.current)
    const stopLift = measured?.clawLiftPercent ?? fallback.clawLiftPercent
    const hitDollId = measured?.hitDollId ?? fallback.hitDoll?.id ?? null
    descentStopRef.current = { clawLiftPercent: stopLift, hitDollId }

    const startLift = GAME3_CLAW.cableVisualLift
    const { descendDurationMs } = GAME3_CLAW
    const start = performance.now()
    let frame = 0

    const animate = (now: number) => {
      const linear = Math.min(1, (now - start) / descendDurationMs)
      const eased = easeOutCubic(linear)
      const lift = startLift + (stopLift - startLift) * eased

      if (linear >= 1) {
        setClaw((prev) =>
          prev.phase === 'descending'
            ? {
                ...prev,
                phase: 'down',
                descendT: 1,
                clawLiftPercent: stopLift,
                open: false,
                gripT: 1,
                gripTLeft: 1,
                gripTRight: 1,
                heldDollId: null,
                heldOffsetX: 0,
                heldOffsetY: 0,
              }
            : prev,
        )
        return
      }

      setClaw((prev) =>
        prev.phase === 'descending' ? { ...prev, clawLiftPercent: lift } : prev,
      )
      frame = requestAnimationFrame(animate)
    }

    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [claw.phase])

  // 바닥에서 집게 오므리기 → 잠깐 멈춤 → 상승 (게임2 방식)
  useEffect(() => {
    if (claw.phase !== 'down') return

    const start = performance.now()
    const { closeDurationMs, holdAtBottomMs } = GAME3_CLAW
    const grabId = descentStopRef.current.hitDollId
    const grabDoll =
      grabId !== null ? getGame3DollById(dollsRef.current, grabId) : null
    const clawAtGrab = {
      xPercent: clawRef.current.xPercent,
      descendT: 1 as const,
      clawLiftPercent: clawRef.current.clawLiftPercent,
    }
    const targetGrip = grabDoll
      ? getGame3GripTForDollSplit(grabDoll, clawAtGrab)
      : { left: 0, right: 0 }
    let frame = 0
    let holdTimer: number | null = null

    const animate = (now: number) => {
      const t = Math.min(1, (now - start) / closeDurationMs)
      const gripTLeft = 1 - t * (1 - targetGrip.left)
      const gripTRight = 1 - t * (1 - targetGrip.right)
      setClaw((prev) => {
        if (prev.phase !== 'down') return prev
        return {
          ...prev,
          gripTLeft,
          gripTRight,
          gripT: Math.min(gripTLeft, gripTRight),
        }
      })

      if (t < 1) {
        frame = requestAnimationFrame(animate)
      } else {
        // 오므림 완료 — DOM이 최종 grip 포즈로 그려진 뒤 실제 다리 위치로 파지 판정
        requestAnimationFrame(() => {
          setClaw((prev) => {
            if (prev.phase !== 'down') return prev
            const hitId = descentStopRef.current.hitDollId
            if (hitId === null) return prev

            const held = getGame3DollById(dollsRef.current, hitId)
            if (!held) return prev

            // hitId는 하강 DOM 측정(measureDescentStop)으로 정해짐 — 하강·오므림이 맞으면 파지

            const clawAtAttach = {
              xPercent: prev.xPercent,
              descendT: 1 as const,
              clawLiftPercent: prev.clawLiftPercent,
            }
            const floorMeasure = viewportRef.current?.measureDollCenter(hitId)
            if (floorMeasure) {
              pendingHeldSnapRef.current = {
                dollId: hitId,
                xPercent: floorMeasure.xPercent,
                centerYPercent: floorMeasure.centerYPercent,
              }
            }
            const offsets = floorMeasure
              ? (() => {
                  const attach = getGame3HeldDollAttachCenter(clawAtAttach)
                  return {
                    heldOffsetX: floorMeasure.xPercent - attach.x,
                    heldOffsetY: floorMeasure.centerYPercent - attach.y,
                  }
                })()
              : getGame3HeldDollOffsets(clawAtAttach, held)

            return {
              ...prev,
              heldDollId: hitId,
              heldOffsetX: offsets.heldOffsetX,
              heldOffsetY: offsets.heldOffsetY,
            }
          })

          holdTimer = window.setTimeout(() => {
            setClaw((prev) => {
              if (prev.phase !== 'down') return prev
              return { ...prev, phase: 'ascending' }
            })
          }, holdAtBottomMs)
        })
      }
    }

    frame = requestAnimationFrame(animate)
    return () => {
      cancelAnimationFrame(frame)
      if (holdTimer !== null) window.clearTimeout(holdTimer)
    }
  }, [claw.phase])

  useEffect(() => {
    if (claw.phase !== 'ascending') return

    const start = performance.now()
    const { ascendDurationMs } = GAME3_CLAW
    let frame = 0

    const animate = (now: number) => {
      const linear = Math.min(1, (now - start) / ascendDurationMs)
      const eased = easeOutCubic(linear)

      setClaw((prev) => {
        if (prev.phase !== 'ascending') return prev
        if (linear >= 1) {
          if (prev.heldDollId !== null) {
            returnOriginXRef.current = prev.xPercent
            return {
              ...prev,
              phase: 'returning',
              descendT: 0,
              open: false,
              clawLiftPercent: 0,
            }
          }

          return {
            ...prev,
            phase: 'idle',
            descendT: 0,
            open: true,
            heldDollId: null,
            gripT: 0,
            gripTLeft: undefined,
            gripTRight: undefined,
            clawLiftPercent: 0,
          }
        }
        return { ...prev, descendT: 1 - eased }
      })

      if (linear < 1) frame = requestAnimationFrame(animate)
    }

    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [claw.phase])

  // 배출구(선물상자)로 이동
  useEffect(() => {
    if (claw.phase !== 'returning') return

    const fromX = returnOriginXRef.current ?? clawRef.current.xPercent
    returnOriginXRef.current = fromX
    const toX = getGame3ChuteCenterX()
    const start = performance.now()
    const { returnToChuteDurationMs } = GAME3_CLAW
    let frame = 0

    const animate = (now: number) => {
      const linear = Math.min(1, (now - start) / returnToChuteDurationMs)
      const eased = easeOutCubic(linear)

      setClaw((prev) => {
        if (prev.phase !== 'returning') return prev
        if (linear >= 1) {
          return {
            ...prev,
            phase: 'atChute',
            xPercent: toX,
            descendT: 0,
            open: false,
          }
        }
        return {
          ...prev,
          xPercent: lerpGame3ClawX(fromX, toX, eased),
          descendT: 0,
          open: false,
        }
      })

      if (linear < 1) frame = requestAnimationFrame(animate)
    }

    frame = requestAnimationFrame(animate)
    return () => {
      cancelAnimationFrame(frame)
      returnOriginXRef.current = null
    }
  }, [claw.phase])

  // 배출구 도착 → 집게 벌림 → 인형 낙하 → 획득
  useEffect(() => {
    if (claw.phase !== 'atChute') return

    const timeout = window.setTimeout(() => {
      const heldId = clawRef.current.heldDollId
      if (heldId !== null) {
        // 매달린 인형의 실제 화면 위치를 측정해 그 자리에서 곧장 떨어지게 한다
        const measured = viewportRef.current?.measureHeldDoll() ?? null
        const release = getGame3HeldDollReleasePoint(clawRef.current)
        const fallX = measured?.xPercent ?? release.xPercent
        const fallCenterY = measured?.centerYPercent ?? release.visualY
        setDolls((prev) =>
          prev.map((doll) =>
            doll.id === heldId
              ? {
                  ...doll,
                  falling: true,
                  xPercent: fallX,
                  fallReleaseVisualY: fallCenterY,
                }
              : doll,
          ),
        )

        window.setTimeout(() => {
          const captured = getGame3DollById(dollsRef.current, heldId)
          if (captured) {
            const dollIndex = ALL_DOLL_IMAGES.indexOf(captured.imageSrc)
            if (dollIndex >= 0) {
              addCollectedDoll(dollIndex, 'game3')
              setSuccessDollImage(captured.imageSrc)
            }
          }
          setDolls((prev) =>
            prev.map((doll) =>
              doll.id === heldId ? { ...doll, falling: false, captured: true } : doll,
            ),
          )
        }, getGame3ChuteFallSequenceMs())
      }

      setClaw((prev) => {
        if (prev.phase !== 'atChute') return prev
        return {
          ...prev,
          phase: 'openAtChute',
          open: true,
          heldDollId: null,
          gripT: 1,
          gripTLeft: undefined,
          gripTRight: undefined,
        }
      })
    }, GAME3_CLAW.holdAtChuteMs)

    return () => window.clearTimeout(timeout)
  }, [claw.phase])

  useEffect(() => {
    if (claw.phase !== 'openAtChute') return

    const timeout = window.setTimeout(() => {
      setClaw((prev) => {
        if (prev.phase !== 'openAtChute') return prev
        homewardOriginXRef.current = prev.xPercent
        return { ...prev, phase: 'homeward', open: true }
      })
    }, GAME3_CLAW.holdAfterOpenAtChuteMs)

    return () => window.clearTimeout(timeout)
  }, [claw.phase])

  // 시작 x로 복귀
  useEffect(() => {
    if (claw.phase !== 'homeward') return

    const fromX = homewardOriginXRef.current ?? clawRef.current.xPercent
    homewardOriginXRef.current = fromX
    const toX = GAME3_CLAW.defaultX
    const start = performance.now()
    const { returnToHomeDurationMs } = GAME3_CLAW
    let frame = 0

    const animate = (now: number) => {
      const linear = Math.min(1, (now - start) / returnToHomeDurationMs)
      const eased = easeOutCubic(linear)

      setClaw((prev) => {
        if (prev.phase !== 'homeward') return prev
        if (linear >= 1) {
          return {
            ...prev,
            phase: 'idle',
            xPercent: toX,
            descendT: 0,
            open: true,
            heldDollId: null,
            gripT: 0,
            gripTLeft: undefined,
            gripTRight: undefined,
            clawLiftPercent: 0,
          }
        }
        return {
          ...prev,
          xPercent: lerpGame3ClawX(fromX, toX, eased),
          descendT: 0,
          open: true,
        }
      })

      if (linear < 1) frame = requestAnimationFrame(animate)
    }

    frame = requestAnimationFrame(animate)
    return () => {
      cancelAnimationFrame(frame)
      homewardOriginXRef.current = null
    }
  }, [claw.phase])

  useEffect(() => {
    const held = new Set<string>()
    let interval: number | null = null
    const handleMoveRef = { current: handleMove }

    const tick = () => {
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
      if (isGame3ClawMovementLocked(clawRef.current)) return
      tick()
      interval = window.setInterval(tick, GAME2_CLAW.moveRepeatMs)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return
      event.preventDefault()
      if (isGame3ClawMovementLocked(clawRef.current)) return
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
  }, [handleMove])

  return (
    <>
      <MobileLayout
        onExit={onExit}
        footer={
          <GameFooterBar className="game-footer-bar--game2" status={<GameFooterStatus />}>
            <Game2PlayControls
              onMove={handleMove}
              onDescend={handleDescend}
              disabled={controlsLocked}
              horizontalOnly
            />
          </GameFooterBar>
        }
      >
        <div className="game3-claw">
          <Game2InstructionBar
            message={playNotice || getStatusMessage(claw.phase, claw.heldDollId !== null)}
          />
          <Game3Viewport ref={viewportRef} claw={claw} dolls={dolls} />
        </div>
      </MobileLayout>

      {successDollImage !== null ? (
        <ClawGameSuccessPopup
          imageSrc={successDollImage}
          onConfirm={() => setSuccessDollImage(null)}
        />
      ) : null}

      {ticketPopupOpen ? (
        <DrawTicketInsufficientPopup
          onClose={() => setTicketPopupOpen(false)}
          onGoToAttendance={() => {
            setTicketPopupOpen(false)
            onGoToAttendance()
          }}
        />
      ) : null}
    </>
  )
}
