import { DrawTicketIcon } from './DrawTicketIcon'
import './TicketAmount.css'

type TicketAmountProps = {
  value: number
  size?: 'sm' | 'lg'
  className?: string
}

export function TicketAmount({ value, size = 'sm', className }: TicketAmountProps) {
  return (
    <span
      className={`ticket-amount ticket-amount--${size}${className ? ` ${className}` : ''}`}
      aria-label={`뽑기 티켓 ${value.toLocaleString()}장`}
    >
      <DrawTicketIcon size={size === 'lg' ? 'lg' : 'sm'} className="ticket-amount__icon" />
      <span className="ticket-amount__value">{value.toLocaleString()}</span>
    </span>
  )
}
