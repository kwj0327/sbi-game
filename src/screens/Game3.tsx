import { useCallback, useEffect, useRef, useState } from 'react'
import { DrawTicketInsufficientPopup } from '../components/DrawTicketInsufficientPopup'
import { GameFooterStatus } from '../components/GameFooterStatus'
import { GameFooterBar } from '../components/GameFooterBar'
import { ClawGameSuccessPopup } from '../components/claw-game/ClawGameSuccessPopup'
import { Game2InstructionBar } from '../components/game2/Game2InstructionBar'
import { Game2PlayControls } from '../components/game2/Game2PlayControls'
import { Game3Viewport, type Game3TipAnchor, type Game3TipAnchors, type Game3ViewportHandle } from '../components/game3/Game3Viewport'
import { MobileLayout } from '../components/MobileLayout'
import { DRAW_TICKET_PLAY_COST, getClawCoinBalance, spendClawCoins } from '../game/clawCoins'
import { ALL_DOLL_IMAGES, getDollDisplayNameByImageSrc } from '../game/dollConfig'
import { addCollectedDoll } from '../game/dollCollection'
import { preloadDollAlphaMasks } from '../game/dollAlphaMask'
import { GAME2_CLAW } from '../game/game2Config'
import { easeOutCubic } from '../game/game2PlayArea'
import {
  GAME3_CLAW,
  GAME3_DOLLS,
  GAME3_GUIDE,
  GAME3_PHYSICS,
  GAME3_WORLD,
  getDefaultGame3ClawState,
  getGame3ChuteFallSequenceMs,
  isGame3ClawMovementLocked,
} from '../game/game3Config'
import {
  createRandomGame3Dolls,
  getGame3ChuteCenterX,
  getGame3DollById,
  getGame3HeldDollReleasePoint,
  lerpGame3ClawX,
  moveGame3ClawXWithPlayLock,
  hasGame3ClawCrossedPlayBoundary,
  stepGame3CloseDollRotate,
  stepGame3DescentPush,
  type Game3DollState,
} from '../game/game3PlayArea'
import './Game3.css'

type Game3Props = {
  onExit: () => void
  onGoToAttendance: () => void
}

function findNearestGame3GrabDollId(
  clawXPercent: number,
  dolls: readonly Game3DollState[],
): number | null {
  let bestId: number | null = null
  let bestDist = Number.POSITIVE_INFINITY
  for (const doll of dolls) {
    if (doll.captured || doll.falling) continue
    const dist = Math.abs(doll.xPercent - clawXPercent)
    if (dist > GAME3_DOLLS.grabRadiusX) continue
    if (dist < bestDist) {
      bestDist = dist
      bestId = doll.id
    }
  }
  return bestId
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
  /** 빨간 경계선을 한 번 넘으면 하강·복귀 전까지 배출구 쪽 재진입 불가 */
  const playBoundaryLockedRef = useRef(false)
  useEffect(() => {
    preloadDollAlphaMasks(ALL_DOLL_IMAGES)
  }, [])

  // 잡힌 뒤 홀드 → 상승 (effect cleanup에 타이머가 있어 Strict Mode에서도 재스케줄됨)
  useEffect(() => {
    if (claw.phase !== 'down' || claw.heldDollId === null) return

    const timer = window.setTimeout(() => {
      setClaw((prev) => {
        if (prev.phase !== 'down' || prev.heldDollId === null) return prev
        return { ...prev, phase: 'ascending' as const }
      })
    }, GAME3_CLAW.holdAtBottomMs)

    return () => window.clearTimeout(timer)
  }, [claw.phase, claw.heldDollId])

  const controlsLocked = isGame3ClawMovementLocked(claw) || successDollImage !== null

  const handleMove = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (direction !== 'left' && direction !== 'right') return

    setClaw((prev) => {
      if (isGame3ClawMovementLocked(prev)) return prev
      const gripOpen = prev.open ? 1 : (prev.gripT ?? 1)
      const clampOpts = {
        clawLiftPercent: prev.clawLiftPercent ?? 0,
        gripTLeft: prev.gripTLeft ?? gripOpen,
        gripTRight: prev.gripTRight ?? gripOpen,
        clawTiltDeg: prev.clawTiltDeg ?? 0,
        playBoundaryLocked: playBoundaryLockedRef.current,
      }
      const moved = moveGame3ClawXWithPlayLock(prev.xPercent, direction, clampOpts)
      playBoundaryLockedRef.current = moved.playBoundaryLocked
      return { ...prev, xPercent: moved.xPercent }
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
      const gripOpen = prev.open ? 1 : (prev.gripT ?? 1)
      const clampOpts = {
        clawLiftPercent: prev.clawLiftPercent ?? 0,
        gripTLeft: prev.gripTLeft ?? gripOpen,
        gripTRight: prev.gripTRight ?? gripOpen,
        clawTiltDeg: prev.clawTiltDeg ?? 0,
      }
      if (hasGame3ClawCrossedPlayBoundary(prev.xPercent, clampOpts)) {
        playBoundaryLockedRef.current = true
      }
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
        heldPinCenterX: undefined,
        heldPinCenterY: undefined,
        heldGripDeltaX: undefined,
        heldGripDeltaY: undefined,
        grabArmTiltDeg: undefined,
        clawLiftPercent: GAME3_CLAW.cableVisualLift,
        clawTiltDeg: 0,
      }
    })
  }, [])

  // 하강 — 팁이 인형에 닿으면 접촉 지점 pin 후 몸체를 계속 꺾으며 하강.
  // pin 중 정지: 바닥, 몸통 얹힘, 다른 인형(비-pin) 접촉. (옆으로 밀리지 않음)
  useEffect(() => {
    if (claw.phase !== 'descending') return

    const startLift = GAME3_CLAW.cableVisualLift
    let currentLift: number = startLift
    let currentX = clawRef.current.xPercent
    let currentTilt = 0
    const floorY = GAME3_WORLD.floorY

    type TipPin = { x: number; y: number; dollId: number }
    let leftPin: TipPin | null = null
    let rightPin: TipPin | null = null

    const { descendDurationMs } = GAME3_CLAW
    let ratePctPerMs = 0
    let rateInitialized = false
    const {
      maxDescentTiltDeg,
      tipPinMaxTiltDeg,
      tipPinTiltGainY,
      tipPinTiltGainX,
      tipPinDescentTiltRate,
    } = GAME3_PHYSICS
    let last = performance.now()
    let frame = 0
    let settled = false

    const clampTilt = (pinned: boolean) => {
      const limit = pinned ? tipPinMaxTiltDeg : maxDescentTiltDeg
      currentTilt = Math.max(-limit, Math.min(limit, currentTilt))
    }

    const clampLiftToFloor = () => {
      const lowest = viewportRef.current?.measureClawLowestBottom()
      if (lowest != null && lowest > floorY + 1e-3) {
        currentLift += lowest - floorY
      }
      const minLift = viewportRef.current?.measureFloorLiftFromDom(currentLift)
      if (minLift != null) {
        currentLift = Math.max(minLift, currentLift)
      }
    }

    const updateTipPins = (tips: Game3TipAnchors) => {
      if (!leftPin && tips.left.touch && tips.left.dollId != null) {
        leftPin = { x: tips.left.x, y: tips.left.y, dollId: tips.left.dollId }
      }
      if (!rightPin && tips.right.touch && tips.right.dollId != null) {
        rightPin = { x: tips.right.x, y: tips.right.y, dollId: tips.right.dollId }
      }
    }

    const applyTipPinTilt = (tips: Game3TipAnchors, descendStep: number) => {
      const pinned = leftPin != null || rightPin != null
      if (leftPin) {
        const errY = tips.left.y - leftPin.y
        const errX = tips.left.x - leftPin.x
        currentTilt += errY * tipPinTiltGainY - errX * tipPinTiltGainX
        currentTilt += descendStep * tipPinDescentTiltRate
      }
      if (rightPin) {
        const errY = tips.right.y - rightPin.y
        const errX = tips.right.x - rightPin.x
        currentTilt -= errY * tipPinTiltGainY + errX * tipPinTiltGainX
        currentTilt -= descendStep * tipPinDescentTiltRate
      }
      if (!pinned) {
        currentTilt *= 0.92
      }
      clampTilt(pinned)
    }

    const getPinnedDollIds = () => {
      const ids = new Set<number>()
      if (leftPin) ids.add(leftPin.dollId)
      if (rightPin) ids.add(rightPin.dollId)
      return ids
    }

    const isOtherDollBlock = (tips: Game3TipAnchors | null | undefined) => {
      if (!tips) return false
      const pinnedIds = getPinnedDollIds()
      if (pinnedIds.size === 0) return false
      const otherTipTouchesForeignDoll = (tip: Game3TipAnchor, pin: TipPin | null) => {
        if (pin != null) return false
        return tip.touch && tip.dollId != null && !pinnedIds.has(tip.dollId)
      }
      return (
        otherTipTouchesForeignDoll(tips.left, leftPin) ||
        otherTipTouchesForeignDoll(tips.right, rightPin)
      )
    }

    const finalize = (lift: number, x: number, tilt: number) => {
      descentStopRef.current = {
        clawLiftPercent: lift,
        hitDollId: findNearestGame3GrabDollId(x, dollsRef.current),
      }
      setClaw((prev) =>
        prev.phase === 'descending'
          ? {
              ...prev,
              phase: 'down',
              xPercent: x,
              descendT: 1,
              clawLiftPercent: lift,
              clawTiltDeg: tilt,
              open: false,
              gripT: 1,
              gripTLeft: 1,
              gripTRight: 1,
              heldDollId: null,
              heldOffsetX: 0,
              heldOffsetY: 0,
              heldPinCenterX: undefined,
              heldPinCenterY: undefined,
              heldGripDeltaX: undefined,
              heldGripDeltaY: undefined,
              grabArmTiltDeg: undefined,
            }
          : prev,
      )
    }

    const animate = (now: number) => {
      if (settled) return
      const dt = Math.min(50, now - last)
      last = now

      const tips = viewportRef.current?.measureTipAnchors()
      if (tips) updateTipPins(tips)
      if (!rateInitialized) {
        const minLift = viewportRef.current?.measureFloorLiftFromDom(currentLift) ?? 0
        ratePctPerMs = Math.max(0.0001, (startLift - minLift) / descendDurationMs)
        rateInitialized = true
      }
      const minLift =
        viewportRef.current?.measureFloorLiftFromDom(currentLift) ?? 0
      const descendStep = ratePctPerMs * dt

      const contact = viewportRef.current?.measureClawContact()

      const hasPin = leftPin != null || rightPin != null
      const bodyResting = (contact?.body.inside ?? 0) >= 3
      const bothTipsOnDoll =
        !hasPin &&
        tips?.left.touch === true &&
        tips?.right.touch === true &&
        tips.left.dollId != null &&
        tips.left.dollId === tips.right.dollId
      const atFloor = currentLift <= minLift + 1e-3
      const otherDollBlock = isOtherDollBlock(tips)
      if (atFloor || bodyResting || otherDollBlock || bothTipsOnDoll) {
        clampLiftToFloor()
        const lift = atFloor ? minLift : currentLift
        setClaw((prev) =>
          prev.phase === 'descending'
            ? { ...prev, clawLiftPercent: lift, xPercent: currentX, clawTiltDeg: currentTilt }
            : prev,
        )
        settled = true
        finalize(lift, currentX, currentTilt)
        return
      }

      currentLift = Math.max(minLift, currentLift - descendStep)
      clampLiftToFloor()
      if (tips) applyTipPinTilt(tips, descendStep)

      // 팁 pin 중에는 집게가 옆으로 밀리지 않음 — 인형 밀기도 비활성
      const pushUpdates =
        leftPin || rightPin
          ? []
          : stepGame3DescentPush(currentX, currentLift, dollsRef.current, dt)
      if (pushUpdates.length > 0) {
        setDolls((prev) =>
          prev.map((doll) => {
            const u = pushUpdates.find((up) => up.id === doll.id)
            return u ? { ...doll, xPercent: u.xPercent, rotateDeg: u.rotateDeg } : doll
          }),
        )
      }

      setClaw((prev) =>
        prev.phase === 'descending'
          ? {
              ...prev,
              xPercent: currentX,
              clawLiftPercent: currentLift,
              clawTiltDeg: currentTilt,
            }
          : prev,
      )

      frame = requestAnimationFrame(animate)
    }

    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [claw.phase])

  // 오므림 — 좌·우 다리를 각각 닫다가 집게발 팁이 인형 실루엣에 닿으면 그 다리는
  // 멈춘다. 둘 다 멈추면 양쪽 팁이 같은 인형에 닿았는지(잡힘) 판정한다.
  useEffect(() => {
    if (claw.phase !== 'down') return

    const { closeDurationMs } = GAME3_CLAW
    const startTilt = clawRef.current.clawTiltDeg ?? 0
    // 벌린 상태의 팁이 인형을 살짝 스치는 것을 무시하기 위한 최소 닫힘량
    const CONTACT_GATE = 0.12
    let last = performance.now()
    let frame = 0
    let leftDone = false
    let rightDone = false

    const finishClose = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setClaw((prev) => {
            if (prev.phase !== 'down') return prev

            const preferredId =
              descentStopRef.current.hitDollId ??
              findNearestGame3GrabDollId(prev.xPercent, dollsRef.current)
            const inRange = dollsRef.current
              .filter(
                (d) =>
                  !d.captured &&
                  !d.falling &&
                  Math.abs(d.xPercent - prev.xPercent) <= GAME3_DOLLS.grabRadiusX * 1.3,
              )
              .sort(
                (a, b) =>
                  Math.abs(a.xPercent - prev.xPercent) -
                  Math.abs(b.xPercent - prev.xPercent),
              )
            const candidates =
              preferredId !== null
                ? [preferredId, ...inRange.map((d) => d.id)]
                : inRange.map((d) => d.id)

            let hitId: number | null = null
            for (const id of candidates) {
              if (viewportRef.current?.measureSegmentGrasp(id)?.valid) {
                hitId = id
                break
              }
            }

            if (hitId === null) {
              return {
                ...prev,
                phase: 'ascending',
                heldDollId: null,
              }
            }

            const held = getGame3DollById(dollsRef.current, hitId)
            if (!held) return prev

            const floorMeasure = viewportRef.current?.measureDollCenter(hitId)
            const tips = viewportRef.current?.measureTipAnchors()
            let heldGripDeltaX: number | undefined
            let heldGripDeltaY: number | undefined
            if (floorMeasure && tips) {
              const midX = (tips.left.x + tips.right.x) / 2
              const midY = (tips.left.y + tips.right.y) / 2
              heldGripDeltaX = floorMeasure.xPercent - midX
              heldGripDeltaY = floorMeasure.centerYPercent - midY
            }

            const syncGripL = prev.gripTLeft ?? 1
            const syncGripR = prev.gripTRight ?? 1

            return {
              ...prev,
              heldDollId: hitId,
              heldOffsetX: 0,
              heldOffsetY: 0,
              heldPinCenterX: floorMeasure?.xPercent,
              heldPinCenterY: floorMeasure?.centerYPercent,
              heldGripDeltaX,
              heldGripDeltaY,
              grabArmTiltDeg: startTilt,
              gripTLeft: syncGripL,
              gripTRight: syncGripR,
              gripT: Math.min(syncGripL, syncGripR),
              clawTiltDeg: startTilt,
            }
          })
        })
      })
    }

    const animate = (now: number) => {
      const dt = Math.min(50, now - last)
      last = now
      const gripStep = dt / closeDurationMs

      // 렌더된(=clawRef) 현재 grip으로 DOM 접촉을 측정 — 측정과 상태 일치
      const cur = clawRef.current
      const curL = cur.gripTLeft ?? 1
      const curR = cur.gripTRight ?? 1
      const tipContact = viewportRef.current?.measureTipContact()

      // 집게발 팁(빨간 채움)이 인형 실루엣에 닿으면 그 다리는 멈춤
      if (!leftDone && 1 - curL > CONTACT_GATE && tipContact?.left) {
        leftDone = true
      }
      if (!rightDone && 1 - curR > CONTACT_GATE && tipContact?.right) {
        rightDone = true
      }

      const nextL = leftDone ? curL : Math.max(0, curL - gripStep)
      const nextR = rightDone ? curR : Math.max(0, curR - gripStep)
      if (nextL <= 0) leftDone = true
      if (nextR <= 0) rightDone = true

      const rotUpdates = stepGame3CloseDollRotate(
        {
          xPercent: cur.xPercent,
          clawLiftPercent: cur.clawLiftPercent ?? 0,
          gripTLeft: curL,
          gripTRight: curR,
        },
        { gripTLeft: nextL, gripTRight: nextR },
        dollsRef.current,
      )
      if (rotUpdates.length > 0) {
        setDolls((prev) =>
          prev.map((doll) => {
            const u = rotUpdates.find((up) => up.id === doll.id)
            return u ? { ...doll, rotateDeg: u.rotateDeg } : doll
          }),
        )
      }

      setClaw((prev) =>
        prev.phase === 'down'
          ? {
              ...prev,
              gripTLeft: nextL,
              gripTRight: nextR,
              gripT: Math.min(nextL, nextR),
              clawTiltDeg: startTilt,
            }
          : prev,
      )

      if (leftDone && rightDone) {
        finishClose()
      } else {
        frame = requestAnimationFrame(animate)
      }
    }

    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
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
              clawTiltDeg: 0,
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
            clawTiltDeg: 0,
            heldPinCenterX: undefined,
            heldPinCenterY: undefined,
            heldGripDeltaX: undefined,
            heldGripDeltaY: undefined,
            grabArmTiltDeg: undefined,
          }
        }

        const frozenArmTilt = prev.grabArmTiltDeg ?? prev.clawTiltDeg ?? 0
        const bodyTilt = frozenArmTilt * (1 - eased)
        return {
          ...prev,
          descendT: 1 - eased,
          clawTiltDeg: bodyTilt,
        }
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
          heldPinCenterX: undefined,
          heldPinCenterY: undefined,
          heldGripDeltaX: undefined,
          heldGripDeltaY: undefined,
          grabArmTiltDeg: undefined,
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
          playBoundaryLockedRef.current = false
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
            clawTiltDeg: 0,
            heldPinCenterX: undefined,
            heldPinCenterY: undefined,
            heldGripDeltaX: undefined,
            heldGripDeltaY: undefined,
            grabArmTiltDeg: undefined,
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
          dollName={getDollDisplayNameByImageSrc(successDollImage)}
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
