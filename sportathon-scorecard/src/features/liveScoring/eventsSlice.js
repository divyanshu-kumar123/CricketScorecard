import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // This array will hold every single delivery of the match
  ballByBallHistory: [], 
};

const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    recordDelivery: (state, action) => {
      // Pushes the new delivery object onto the ledger
      state.ballByBallHistory.push(action.payload);
    },
    undoLastDelivery: (state) => {
      // Instantly reverts the last ball bowled if the scorer makes a mistake
      state.ballByBallHistory.pop();
    },
    resetEvents: () => initialState,
  },
});

export const { recordDelivery, undoLastDelivery, resetEvents } = eventsSlice.actions;
export default eventsSlice.reducer;