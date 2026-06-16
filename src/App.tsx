import { useState } from 'react'
import { FirebaseProvider } from './context/FirebaseContext'
import { ALL_DOLL_COUNT } from './game/dollConfig'
import { type GameId } from './game/games'
import { useCollectionSync } from './hooks/useCollectionSync'
import { usePointsSync } from './hooks/usePointsSync'
import { ClawGame } from './screens/ClawGame'
import { Game2 } from './screens/Game2'
import { Game3 } from './screens/Game3'
import { HomeScreen } from './screens/HomeScreen'

type Screen = 'home' | GameId

function AppContent() {
  const [screen, setScreen] = useState<Screen>('home')
  useCollectionSync(ALL_DOLL_COUNT)
  usePointsSync()

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

function App() {
  return (
    <FirebaseProvider>
      <AppContent />
    </FirebaseProvider>
  )
}

export default App
