import ticketImage from '../assets/draw-ticket.png'
import './draw-ticket-icon.css'

type DrawTicketIconProps = {
  size?: 'sm' | 'lg'
  className?: string
}

export function DrawTicketIcon({ size = 'lg', className }: DrawTicketIconProps) {
  return (
    <img
      src={ticketImage}
      alt=""
      className={`draw-ticket-icon draw-ticket-icon--${size}${className ? ` ${className}` : ''}`}
      draggable={false}
      aria-hidden="true"
    />
  )
}
