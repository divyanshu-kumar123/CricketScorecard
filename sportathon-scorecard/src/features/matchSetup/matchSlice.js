import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    matchDetails: {
        matchName: '',
        date: '',
        totalOver: 4,
        ballsPerOver: 6,
        playersPerTeam: 5
    },
    specificRules: { //especially for female player
        specialPlayerMultiplier: 2,
        mandatoryFirstOverBat: true,
        mandatoryFirstOverBall: true,
    },
    teamA: {
        id: 'team_a',
        name: '',
        player: [], //Array of objects  : {id, name, gender, isSpecial}
        captianId: null
    },
    teamB: {
        id: 'team_a',
        name: '',
        player: [], //Array of objects  : {id, name, gender, isSpecial}
        captianId: null
    },
    toss: {
        winner: null, //team a or team b
        decision: null // Batting or bowling
    },
    status: 'setup' //setup, in_progress, completed
}

const matchSlice = createSlice({
    name: 'match',
    initialState,
    reducers: {
        setMatchDetails: (state, action) => {
            state.matchDetails = { ...state.matchDetails, ...action.payload };
        },
        setSpecificRules: (state, action) => {
            state.specificRules = { ...state.specialRules, ...action.payload };
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
            state.status = 'in_progress';
        },
    }
})
export const { 
  setMatchDetails, 
  setSpecialRules, 
  updateTeamA, 
  updateTeamB, 
  setTossResult, 
  startMatch 
} = matchSlice.actions;
export default matchSlice.reducer;