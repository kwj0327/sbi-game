import ticketImage from '../assets/draw-ticket.png'
import './draw-ticket-icon.css'

type DrawTicketIconProps = {
  size?: 'sm' | 'lg'
  className?: string
}

export function DrawTicketIcon({ size = 'lg', className }: DrawTicketIconProps) {
  return (
    <span
      className={`draw-ticket-icon-wrap draw-ticket-icon-wrap--${size}${className ? ` ${className}` : ''}`}
      aria-hidden="true"
    >
      <img src={ticketImage} alt="" className="draw-ticket-icon" draggable={false} />
    </span>
  )
}
