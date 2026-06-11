import type { DollVisual } from '../../game/clawGameConfig'

export type GamePhase = 'spinning' | 'striking' | 'result'

export type DollState = {
  captured: boolean
  falling: boolean
  clipOpen: boolean
}

export type VisibleDoll = {
  doll: DollState
  index: number
  visual: DollVisual
}

export type OrbitSize = {
  w: number
  h: number
}
