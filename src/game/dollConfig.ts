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

/** 기존 Game 1·2 인형 (1~10) */
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

/** 전체 인형 도감 — 원본 10 + 캐릭터 50 = 60종 */
export const ALL_DOLL_IMAGES = [...ORIGINAL_DOLL_IMAGES, ...CHARACTER_IMAGES] as const

export const ALL_DOLL_COUNT = ALL_DOLL_IMAGES.length

export const ORIGINAL_DOLL_COUNT = ORIGINAL_DOLL_IMAGES.length

/** 전체 인형 표시 이름 (도감·팝업 등) */
export const ALL_DOLL_NAMES = [
  '말랑토끼',
  '포근곰돌이',
  '댕댕이',
  '펭귄',
  '아기공룡',
  '구름이',
  '삐약이',
  '냥냥이',
  '아기물범',
  '딸기햄스터',
  '마이멜로디',
  '폼폼푸린',
  '쿠로미',
  '헬로키티',
  '포차코',
  '배드바츠마루',
  '짱구',
  '한교동',
  '리틀트윈스타',
  '시나모롤',
  '도라에몽',
  '케로케로케로피',
  '토토로',
  '태닝키티',
  '악어짱구',
  '호퍼',
  '흰둥이',
  '조지왕',
  '타마마',
  '도로로',
  '기로로',
  '리락쿠마',
  '리치베리',
  '메타~몽',
  '맹구',
  '샐러리쿵야',
  '소방관 춘식이',
  '액션가면 짱구',
  '양파쿵야',
  '주먹밥콩콩',
  '참깨콩콩',
  '치이카와',
  '케로로',
  '파자마 짱구',
  '하치와레',
  '별의 커비',
  '슬라임',
  '우사기',
  '카피바라',
  '코리락쿠마',
  '쿠루루',
  '테리어몬',
  '그로밋',
  '코로몬',
  '마루',
  '토끼 마루',
  '개구리 마루',
  '검은고양이 지지',
  '가오나시',
  '몬치치',
] as const

/** 도감·상세 화면용 표시 이름 */
export function getDollDisplayName(index: number): string {
  return ALL_DOLL_NAMES[index] ?? '인형'
}

/** imageSrc → 표시 이름 */
export function getDollDisplayNameByImageSrc(imageSrc: string): string {
  const index = (ALL_DOLL_IMAGES as readonly string[]).indexOf(imageSrc)
  return index >= 0 ? getDollDisplayName(index) : '인형'
}

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
