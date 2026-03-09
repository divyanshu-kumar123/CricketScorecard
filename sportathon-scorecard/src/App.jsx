import { Routes, Route } from 'react-router-dom';
import MatchSetup from './pages/MatchSetup';
import PlayerRegistration from './pages/PlayerRegistration';
import Toss from './pages/Toss';
import OpeningLineup from './pages/OpeningLineup';

function App() {

  return (
     <Routes>
      <Route path="/" element={<MatchSetup />} />
      <Route path="/registration" element={<PlayerRegistration />} />
      <Route path="/toss" element={<Toss />} />
      <Route path="/opening-lineup" element={<OpeningLineup />} />
      <Route path="/live-score" element={<div>Live Scoring Dashboard Coming Soon</div>} />
    </Routes>
  )
}

export default App
