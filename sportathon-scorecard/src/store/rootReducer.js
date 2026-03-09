import { combineReducers } from '@reduxjs/toolkit';
import matchReducer from '../features/matchSetup/matchSlice.js'

const rootReducer = combineReducers({
    match : matchReducer
  // We will add our actual slices here soon: matchSlice, eventsSlice, statsSlice
});

export default rootReducer;