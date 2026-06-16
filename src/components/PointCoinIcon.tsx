import pointCoinImage from '../assets/point-coin.png'
import './point-coin-icon.css'

type PointCoinIconProps = {
  size?: 'sm' | 'lg'
  className?: string
}

export function PointCoinIcon({ size = 'lg', className }: PointCoinIconProps) {
  return (
    <img
      src={pointCoinImage}
      alt=""
      className={`point-coin-icon point-coin-icon--${size}${className ? ` ${className}` : ''}`}
      draggable={false}
      aria-hidden="true"
    />
  )
}
