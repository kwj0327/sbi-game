export type TicketMission = {
  id: string
  title: string
  rewardTickets: number
}

/** 티켓 모으기 미션 버튼 클릭 시 이동 URL */
export const TICKET_MISSION_LINK_URL = 'https://www.sbisb.co.kr/mai0020100.act'

export const TICKET_MISSIONS: readonly TicketMission[] = [
  {
    id: 'group-account',
    title: '모임통장 가입',
    rewardTickets: 10,
  },
  {
    id: 'check-card',
    title: '체크카드 신규',
    rewardTickets: 10,
  },
  {
    id: 'savings-account',
    title: '신규 적금 가입',
    rewardTickets: 20,
  },
  {
    id: 'deposit-account',
    title: '신규 예금 가입',
    rewardTickets: 30,
  },
] as const
