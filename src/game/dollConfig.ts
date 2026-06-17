import game1Doll01 from '../assets/dolls/game1-doll-01.png'
import game1Doll02 from '../assets/dolls/game1-doll-02.png'
import game1Doll03 from '../assets/dolls/game1-doll-03.png'
import game1Doll04 from '../assets/dolls/game1-doll-04.png'
import game1Doll05 from '../assets/dolls/game1-doll-05.png'
import game1Doll06 from '../assets/dolls/game1-doll-06.png'
import game1Doll07 from '../assets/dolls/game1-doll-07.png'
import game1Doll08 from '../assets/dolls/game1-doll-08.png'
import game1Doll09 from '../assets/dolls/game1-doll-09.png'
import game1Doll10 from '../assets/dolls/game1-doll-10.png'
import { CHARACTER_IMAGES } from './characterConfig'

/** 기존 Game 1·2 인형 (No.1~10) */
export const ORIGINAL_DOLL_IMAGES = [
  game1Doll01,
  game1Doll02,
  game1Doll03,
  game1Doll04,
  game1Doll05,
  game1Doll06,
  game1Doll07,
  game1Doll08,
  game1Doll09,
  game1Doll10,
] as const

/** 전체 인형 도감 — 원본 10 + 캐릭터 13 = 23종 */
export const ALL_DOLL_IMAGES = [...ORIGINAL_DOLL_IMAGES, ...CHARACTER_IMAGES] as const

export const ALL_DOLL_COUNT = ALL_DOLL_IMAGES.length

/** Game 1 회전 레일 슬롯 수 */
export const GAME1_SLOT_COUNT = 10

/** Game 2 바닥 인형 수 */
export const GAME2_SLOT_COUNT = 20

function pickRandomDollIndices(count: number): number[] {
  const pool = Array.from({ length: ALL_DOLL_COUNT }, (_, index) => index)

  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }

  return pool.slice(0, count)
}

/** Game 1 진입 시 레일에 걸 10종 — 전체 23종 중 무작위 (중복 없음) */
export function pickRandomGame1DollIndices(): number[] {
  return pickRandomDollIndices(GAME1_SLOT_COUNT)
}

/** Game 2 진입 시 바닥에 둘 10종 — 전체 23종 중 무작위 (중복 없음) */
export function pickRandomGame2DollIndices(): number[] {
  return pickRandomDollIndices(GAME2_SLOT_COUNT)
}
