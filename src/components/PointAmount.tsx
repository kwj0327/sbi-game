import { PointCoinIcon } from './PointCoinIcon'
import './PointAmount.css'

type PointAmountProps = {
  value: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function PointAmount({ value, size = 'md', className }: PointAmountProps) {
  const iconSize = size === 'lg' ? 'lg' : 'sm'

  return (
    <span
      className={`point-amount point-amount--${size}${className ? ` ${className}` : ''}`}
      aria-label={`${value.toLocaleString()}포인트`}
    >
      <PointCoinIcon size={iconSize} className="point-amount__icon" />
      <span className="point-amount__value">{value.toLocaleString()}</span>
    </span>
  )
}
