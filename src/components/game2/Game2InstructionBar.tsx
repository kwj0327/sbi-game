type Game2InstructionBarProps = {
  message: string
}

export function Game2InstructionBar({ message }: Game2InstructionBarProps) {
  return <p className="game2__instruction">{message}</p>
}
