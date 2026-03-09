import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentInnings: 1,
  battingTeamId: null,
  bowlingTeamId: null,
  strikerId: null,
  nonStrikerId: null,
  bowlerId: null,
  currentOver: 0,
};

const inningsSlice = createSlice({
  name: 'innings',
  initialState,
  reducers: {
    setInningsTeams: (state, action) => {
      state.battingTeamId = action.payload.battingTeamId;
      state.bowlingTeamId = action.payload.bowlingTeamId;
    },
    setActivePlayers: (state, action) => {
      state.strikerId = action.payload.strikerId;
      state.nonStrikerId = action.payload.nonStrikerId;
      state.bowlerId = action.payload.bowlerId;
    },
    changeStrike: (state) => {
      const temp = state.strikerId;
      state.strikerId = state.nonStrikerId;
      state.nonStrikerId = temp;
    },
    changeBatter: (state, action) => {
      const { outBatterId, inBatterId } = action.payload;
      if (state.strikerId === outBatterId) {
        state.strikerId = inBatterId;
      } else if (state.nonStrikerId === outBatterId) {
        state.nonStrikerId = inBatterId;
      }
    },
    startNextOver: (state, action) => {
      state.bowlerId = action.payload.nextBowlerId;
      state.currentOver += 1;
      const temp = state.strikerId;
      state.strikerId = state.nonStrikerId;
      state.nonStrikerId = temp;
    },
    // NEW REDUCER: Resets the pitch for Innings #2
    startNextInnings: (state) => {
      state.currentInnings = 2;
      state.currentOver = 0;
      
      const tempTeam = state.battingTeamId;
      state.battingTeamId = state.bowlingTeamId;
      state.bowlingTeamId = tempTeam;
      
      state.strikerId = null;
      state.nonStrikerId = null;
      state.bowlerId = null;
    },
    resetInnings: () => initialState,
  },
});

export const { setInningsTeams, setActivePlayers, changeStrike, changeBatter, startNextOver, startNextInnings, resetInnings } = inningsSlice.actions;
export default inningsSlice.reducer;