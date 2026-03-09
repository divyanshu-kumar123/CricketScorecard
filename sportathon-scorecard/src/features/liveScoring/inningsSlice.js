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
  },
});

export const { setInningsTeams, setActivePlayers, changeStrike } = inningsSlice.actions;
export default inningsSlice.reducer;