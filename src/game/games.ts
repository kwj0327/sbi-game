import clawGameIcon from '../assets/claw-game-icon.png'
import game2Icon from '../assets/game2-icon.png'
import game3CollectionIcon from '../assets/game3-collection-icon.png'

export type GameId = 'claw' | 'game2' | /* 'game3' | */ 'collection'

export type GameInfo = {
  id: GameId
  title: string
  description: string
  emoji?: string
  icon?: string
}

export const GAMES: readonly GameInfo[] = [
  {
    id: 'claw',
    title: '회전 인형 뽑기',
    description: '타이밍에 맞춰 STOP!\n인형을 뽑아보세요.',
    icon: clawGameIcon,
  },
  {
    id: 'game2',
    title: '집게 인형 뽑기',
    description: '조이스틱으로 집게를 이동!\n↓로 하강!',
    icon: game2Icon,
  },
  // Game 3 — 일시 비활성
  // {
  //   id: 'game3',
  //   title: '2D 인형 뽑기',
  //   description: '조이스틱으로 좌우 이동!\n넓은 방을 탐험해요.',
  //   icon: game2Icon,
  // },
  {
    id: 'collection',
    title: '획득한 인형',
    description: '뽑기에서 모은\n인형을 확인해요.',
    icon: game3CollectionIcon,
  },
] as const
