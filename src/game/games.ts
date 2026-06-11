import clawGameIcon from '../assets/claw-game-icon.png'
import game2Icon from '../assets/game2-icon.png'

export type GameId = 'claw' | 'game2' | 'game3'

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
  {
    id: 'game3',
    title: '게임 3',
    description: '새로운 미니게임 (준비 중)',
    emoji: '🎯',
  },
] as const
