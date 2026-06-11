type InstructionBarProps = {
  message: string
}

export function InstructionBar({ message }: InstructionBarProps) {
  return <p className="claw-game__instruction">{message}</p>
}
