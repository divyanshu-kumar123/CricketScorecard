import { Routes, Route } from 'react-router-dom';
import GlobalHeader from './components/GlobalHeader'; // IMPORT HEADER
import MatchSetup from './pages/MatchSetup';
import PlayerRegistration from './pages/PlayerRegistration';
import Toss from './pages/Toss';
import OpeningLineup from './pages/OpeningLineup';
import LiveScorecard from './pages/LiveScorecard';
import MatchSummary from './pages/MatchSummary';

function App() {
  return (
    <>
      <GlobalHeader /> {/* RENDER ON EVERY PAGE */}
      <Routes>
        <Route path="/" element={<MatchSetup />} />
        <Route path="/registration" element={<PlayerRegistration />} />
        <Route path="/toss" element={<Toss />} />
        <Route path="/opening-lineup" element={<OpeningLineup />} />
        <Route path="/live-score" element={<LiveScorecard />} />
        <Route path="/match-summary" element={<MatchSummary />} />
      </Routes>
    </>
  );
}

export default App;