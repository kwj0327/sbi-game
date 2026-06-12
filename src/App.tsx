import { useState } from 'react'
import { type GameId } from './game/games'
import { ClawGame } from './screens/ClawGame'
import { Game2 } from './screens/Game2'
import { Game3 } from './screens/Game3'
import { HomeScreen } from './screens/HomeScreen'

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
    return <Game3 onExit={() => setScreen('home')} />
  }

  return <HomeScreen onSelectGame={setScreen} />
}

export default App
