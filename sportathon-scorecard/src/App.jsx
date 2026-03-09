import { Routes, Route } from 'react-router-dom';
import MatchSetup from './pages/MatchSetup';
import PlayerRegistration from './pages/PlayerRegistration';

function App() {

  return (
     <Routes>
      <Route path="/" element={<MatchSetup />} />
      <Route path="/registration" element={<PlayerRegistration />} />
      <Route path="/toss" element={<div>Toss Component Coming Soon</div>} />
    </Routes>
  )
}

export default App
