import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  matchDetails: {
    matchName: '',
    totalOvers: 10,
    playersPerTeam: 11,
    specialPlayersPerTeam: 1,
    bowlerOverLimit: 2, // NEW: Default bowler over limit
    date: null,
  },
  specialRules: {
    specialPlayerMultiplier: 2,
    mandatoryFirstOverBat: true,
    mandatoryFirstOverBowl: true,
  },
  teamA: { id: 'team_a', name: '', players: [] },
  teamB: { id: 'team_b', name: '', players: [] },
  toss: { winner: null, decision: null },
  isMatchActive: false,
};

const matchSlice = createSlice({
  name: 'match',
  initialState,
  reducers: {
    setMatchDetails: (state, action) => {
      state.matchDetails = action.payload;
    },
    setSpecialRules: (state, action) => {
      state.specialRules = action.payload;
    },
    updateTeamA: (state, action) => {
      state.teamA = { ...state.teamA, ...action.payload };
    },
    updateTeamB: (state, action) => {
      state.teamB = { ...state.teamB, ...action.payload };
    },
    setTossResult: (state, action) => {
      state.toss = action.payload;
    },
    startMatch: (state) => {
      state.isMatchActive = true;
    },
    resetMatch: () => initialState,
  },
});

export const { setMatchDetails, setSpecialRules, updateTeamA, updateTeamB, setTossResult, startMatch, resetMatch } = matchSlice.actions;
export default matchSlice.reducer;