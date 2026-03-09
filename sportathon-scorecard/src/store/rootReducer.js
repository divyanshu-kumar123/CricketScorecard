import { combineReducers } from '@reduxjs/toolkit';
import matchReducer from '../features/matchSetup/matchSlice';
import inningsReducer from '../features/liveScoring/inningsSlice';
import eventsReducer from '../features/liveScoring/eventsSlice';

const rootReducer = combineReducers({
  match: matchReducer,
  innings: inningsReducer,
  events: eventsReducer,
});

export default rootReducer;