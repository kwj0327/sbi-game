import { useState } from 'react'
import { GAMES, type GameId } from './game/games'
import { ClawGame } from './screens/ClawGame'
import { Game2 } from './screens/Game2'
import { HomeScreen } from './screens/HomeScreen'
import { PlaceholderGame } from './screens/PlaceholderGame'

type Screen = 'home' | GameId

function App() {
  const [screen, setScreen] = useState<Screen>('home')

  if (screen === 'claw') {
    return <ClawGame onExit={() => setScreen('home')} />
  }

  if (screen === 'game2') {
    return <Game2 onExit={() => setScreen('home')} />
  }

  if (screen === 'game3') {
    const game = GAMES.find((entry) => entry.id === screen)
    if (!game) return <HomeScreen onSelectGame={setScreen} />

    return (
      <PlaceholderGame
        title={game.title}
        emoji={game.emoji ?? '🎮'}
        onExit={() => setScreen('home')}
      />
    )
  }

  return <HomeScreen onSelectGame={setScreen} />
}

export default App
