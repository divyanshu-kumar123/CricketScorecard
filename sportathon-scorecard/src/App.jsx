import { Routes, Route } from 'react-router-dom';
import MatchSetup from './pages/MatchSetup';
import PlayerRegistration from './pages/PlayerRegistration';
import Toss from './pages/Toss';

function App() {

  return (
     <Routes>
      <Route path="/" element={<MatchSetup />} />
      <Route path="/registration" element={<PlayerRegistration />} />
      <Route path="/toss" element={<Toss />} />
      <Route path="/opening-lineup" element={<div>Opening Lineup Component Coming Soon</div>} />
    </Routes>
  )
}

export default App
