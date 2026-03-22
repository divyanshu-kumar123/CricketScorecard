# 🏏 Sportathon Cricket Scorer

A professional, offline-first React application designed for live cricket match scoring, corporate tournament management, and detailed statistical analysis.

## Overview
This application replaces traditional paper scorebooks with a robust digital ledger. It is built to handle dynamic match rules, edge cases like run-outs with completed runs, and special corporate multiplier rules, all while maintaining a strict, unchangeable history of every delivery.

## Features
- **Live Ball-by-Ball Scoring:** Track every run, extra, and wicket with an interactive visual timeline.
- **Corporate Rules Engine:** Dynamic minimums for female/special players and custom run multipliers.
- **Offline-First Reliability:** Powered by `redux-persist`. Accidentally close the browser? Your match state is perfectly saved.
- **Over-by-Over Analysis:** View historical over timelines directly on the live scoreboard and the final summary page.
- **Instant Undo:** Make a mistake? Rewind the last delivery and restore the exact pitch state (striker, non-striker, and bowler).
- **Advanced Wicket Handling:** Support for run-outs with completed runs and mid-innings batter retirements (allowing them to return later).
- **Mid-Over Bowler Changes:** Seamlessly swap bowlers in the middle of an over due to injury or max-over limits.
- **Excel Export:** Download a multi-tab `.xlsx` ledger of the entire match for the leadership team.

## Tech Stack
- **Frontend:** React, React Router
- **State Management:** Redux Toolkit, Redux Persist
- **UI Framework:** Material UI (MUI), Custom CSS
- **Utilities:** ExcelJS (reporting), UUID (unique event IDs)

## Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) and npm installed on your local machine.

### Installation
1. Clone the repository to your local machine:
   ```bash
   git clone <your-repository-url>
   ```
2. Navigate into the project directory:
   ```bash
   cd sportathon-scorer
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Application Structure
The application relies on a strictly managed Redux state to ensure data integrity:
- **`matchSlice.js`**: Handles pre-game setup, team registration, match rules, and toss logic.
- **`inningsSlice.js`**: Manages the active pitch state, striker rotation, bowler assignments, and over counts.
- **`eventsSlice.js`**: The master ledger that records every single delivery, extra, and wicket as an immutable timeline.
- **`exportToExcel.js`**: Utility to compile the Redux ledger into a multi-tab, formatted Excel report without needing a backend server.

## Data Persistence & Match Reset
This app uses local storage to save the match state. The match can be safely resumed from the exact last delivery even after a browser refresh. To start a completely new match, use the **"Start New Match"** button in the global header to wipe the cache and begin fresh.
