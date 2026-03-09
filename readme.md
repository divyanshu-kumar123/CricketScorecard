# Corporate Sportathon Cricket Scorecard App



## 1. High-Level Architecture
* **Frontend Core:** React, Redux Toolkit, React Router, Material UI (MUI), Redux Persist (offline-first caching)
* **Backend Core:** Node.js, Express, Socket.io (live spectator syncing)
* **Database Layer:** MongoDB, Mongoose ODM
* **Export & Report Tools:** PDFKit, jsPDF, ExcelJS

## 2. Match Setup Flow (Pre-Game)



* **Match Settings:** Match Name, Date, Number of Overs, Balls per over, Max players per team
* **Special Player Configuration:** Number of special players, Rule type (Multiplier, Addition, Custom), Mandatory first-over batting rule, Mandatory first-over bowling rule
* **Team Registration (Team A & Team B):** Team Name, Player Names, Player Genders, Special Player Toggles
* **The Toss (Optional):** Digital coin animation, Manual selection override, Winner declaration, Bat/Bowl decision
* **Lineup Initialization:** Opening striker, Opening non-striker, Opening bowler, Special player validation check

## 3. Match Engine Flow (Live Scoring)



* **Live Scoreboard Display:** Total Score, Wickets, Current Overs, Current Run Rate, Required Run Rate, Projected Score
* **Active Players Display:** Current Striker, Current Non-striker, Current Bowler, Partnership Runs, Partnership Balls
* **Ball Input Actions:** 0, 1, 2, 3, 4, 6
* **Extras Input:** Wide, No Ball, Bye, Leg Bye, Penalty Runs
* **Wicket Input:** Bowled, Catch, LBW, Stumped, Hit Wicket, Run Out (Striker), Run Out (Non-striker), Retired Out, Retired Hurt
* **Match Control Actions:** Undo Last Ball, Manual Change Strike, Substitute Player, End Over, Declare Innings

## 4. Player Management & Substitutions
* **Status Tracking States:** Yet to Bat, Currently Batting, Out, Retired Hurt, Substituted
* **Substitution Logic:** Enforce special player mandatory first-over rule, Unlock special player substitution after over 1, Process medical exceptions for standard male players

## 5. Real-Time Statistics Engine (Derived from Event History)
* **Batting Stats:** Runs Scored, Balls Faced, Strike Rate, Fours, Sixes, Dot Balls
* **Bowling Stats:** Overs Bowled, Maidens, Runs Conceded, Wickets Taken, Economy Rate, Extras Bowled
* **Match Stats:** Runs per over, Partnership totals, Current run rate, Required run rate

## 6. Post-Match & Export Flow
* **Match Result:** Winning Team, Win Margin (Runs/Wickets), Player of the Match Calculation
* **Full Scorecard View:** Team A Innings Summary, Team B Innings Summary, Fall of Wickets Timeline
* **Export Formats:** PDF Scorecard Download, Excel Raw Data, JSON Event Payload

## 7. Redux Store Design
* **matchSlice:** teams, players, rules, status
* **inningsSlice:** currentOver, striker, nonStriker, bowler
* **eventsSlice:** ballByBallHistory (Core source of truth)