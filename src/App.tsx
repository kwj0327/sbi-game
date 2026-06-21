import { useState } from 'react'
import { FirebaseProvider } from './context/FirebaseContext'
import { type BottomNavTab } from './components/BottomNav'
import { ALL_DOLL_COUNT } from './game/dollConfig'
import { type GameId } from './game/games'
import { useCollectionSync } from './hooks/useCollectionSync'
import { usePointsSync } from './hooks/usePointsSync'
import { ClawGame } from './screens/ClawGame'
import { CollectionScreen } from './screens/CollectionScreen'
import { Game2 } from './screens/Game2'
// import { Game3 } from './screens/Game3' // Game 3 — 일시 비활성
import { HomeScreen } from './screens/HomeScreen'

type Screen = 'home' | GameId

function AppContent() {
  const [screen, setScreen] = useState<Screen>('home')
  const [homeTab, setHomeTab] = useState<BottomNavTab>('home')
  useCollectionSync(ALL_DOLL_COUNT)
  usePointsSync()

  const goToAttendance = () => {
    setHomeTab('attendance')
    setScreen('home')
  }

  if (screen === 'claw') {
    return <ClawGame onExit={() => setScreen('home')} onGoToAttendance={goToAttendance} />
  }

  if (screen === 'game2') {
    return <Game2 onExit={() => setScreen('home')} onGoToAttendance={goToAttendance} />
  }

  // Game 3 — 일시 비활성
  // if (screen === 'game3') {
  //   return <Game3 onExit={() => setScreen('home')} onGoToAttendance={goToAttendance} />
  // }

  if (screen === 'collection') {
    return <CollectionScreen onExit={() => setScreen('home')} />
  }

  return (
    <HomeScreen
      activeTab={homeTab}
      onTabChange={setHomeTab}
      onSelectGame={setScreen}
    />
  )
}

function App() {
  return (
    <FirebaseProvider>
      <AppContent />
    </FirebaseProvider>
  )
}

export default App
