import { combineReducers } from '@reduxjs/toolkit';
import matchReducer from '../features/matchSetup/matchSlice';
import inningsReducer from '../features/liveScoring/inningsSlice';

const rootReducer = combineReducers({
  match: matchReducer,
  innings: inningsReducer,
  // events: eventsReducer (coming next)
});

export default rootReducer;