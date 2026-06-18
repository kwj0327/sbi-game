import { useCallback, useEffect, useRef, useState } from 'react'
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
  findGame3GrabTarget,
  getGame3ChuteCenterX,
  getGame3DollById,
  getGame3GripTForDoll,
  getGame3HeldDollOffsets,
  getGame3HeldDollReleasePoint,
  getGame3StackLiftAt,
  lerpGame3ClawX,
  moveGame3ClawX,
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
    const clawX = clawRef.current.xPercent
    const stackLift = getGame3StackLiftAt(dollsRef.current, clawX)

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
        clawLiftPercent: stackLift,
      }
    })
  }, [])

  useEffect(() => {
    if (claw.phase !== 'descending') return

    const start = performance.now()
    const { descendDurationMs } = GAME3_CLAW
    let frame = 0

    const animate = (now: number) => {
      const linear = Math.min(1, (now - start) / descendDurationMs)
      const eased = easeOutCubic(linear)

      setClaw((prev) => {
        if (prev.phase !== 'descending') return prev
        if (linear >= 1) {
          const target = findGame3GrabTarget(dollsRef.current, prev.xPercent)

          return {
            ...prev,
            phase: 'down',
            descendT: 1,
            open: false,
            gripT: 1,
            heldDollId: target?.id ?? null,
            heldOffsetX: 0,
            heldOffsetY: 0,
          }
        }
        return { ...prev, descendT: eased }
      })

      if (linear < 1) frame = requestAnimationFrame(animate)
    }

    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [claw.phase])

  // 바닥에서 집게 오므리기 → 잠깐 멈춤 → 상승 (게임2 방식)
  useEffect(() => {
    if (claw.phase !== 'down') return

    const start = performance.now()
    const { closeDurationMs, holdAtBottomMs } = GAME3_CLAW
    const heldId = clawRef.current.heldDollId
    const heldDoll = heldId !== null ? getGame3DollById(dollsRef.current, heldId) : null
    // 인형 테두리에 맞추되, 집게가 항상 눈에 띄게 닫히도록 상한을 둔다
    const targetGripT = heldDoll
      ? Math.min(getGame3GripTForDoll(heldDoll), GAME3_CLAW.maxGrabGripT)
      : 0
    let frame = 0
    let holdTimer: number | null = null

    const animate = (now: number) => {
      const t = Math.min(1, (now - start) / closeDurationMs)
      const gripT = 1 - t * (1 - targetGripT)
      setClaw((prev) => {
        if (prev.phase !== 'down') return prev
        return { ...prev, gripT }
      })

      if (t < 1) {
        frame = requestAnimationFrame(animate)
      } else {
        holdTimer = window.setTimeout(() => {
          setClaw((prev) => {
            if (prev.phase !== 'down') return prev
            const held = getGame3DollById(dollsRef.current, prev.heldDollId)
            if (!held) return { ...prev, phase: 'ascending' }

            const offsets = getGame3HeldDollOffsets(
              {
                xPercent: prev.xPercent,
                descendT: 1,
                clawLiftPercent: prev.clawLiftPercent,
              },
              held,
            )

            return {
              ...prev,
              phase: 'ascending',
              heldOffsetX: offsets.heldOffsetX,
              heldOffsetY: offsets.heldOffsetY,
            }
          })
        }, holdAtBottomMs)
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
