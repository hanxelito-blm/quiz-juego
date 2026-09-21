import { Routes, Route } from 'react-router-dom'
import HomePage from '../pages/HomePage.jsx'
import GamePage from '../pages/GamePage.jsx'
import ScoresPage from '../pages/ScoresPage.jsx'

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/juego/:nivel" element={<GamePage />} />
      <Route path="/puntajes" element={<ScoresPage />} />
    </Routes>
  )
}

export default AppRoutes