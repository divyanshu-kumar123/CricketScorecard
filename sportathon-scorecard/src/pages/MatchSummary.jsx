import React from 'react';
import { useSelector } from 'react-redux';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Grid, Divider } from '@mui/material';

const MatchSummary = () => {
  const { matchDetails, teamA, teamB } = useSelector((state) => state.match);
  const { ballByBallHistory } = useSelector((state) => state.events);

  // Helper to find player name
  const getPlayerName = (id) => {
    const playerA = teamA.players.find(p => p.id === id);
    if (playerA) return `${playerA.name} ${playerA.isSpecial ? '(S)' : ''}`;
    const playerB = teamB.players.find(p => p.id === id);
    return playerB ? `${playerB.name} ${playerB.isSpecial ? '(S)' : ''}` : 'Unknown';
  };

  // NEW: Helper to determine which team a player belongs to
  const getTeamFromPlayerId = (playerId) => {
    if (teamA.players.some(p => p.id === playerId)) return teamA;
    if (teamB.players.some(p => p.id === playerId)) return teamB;
    return null;
  };

  // NEW: Derive who batted first and second from the ledger
  const firstBallInnings1 = ballByBallHistory.find(ball => ball.innings === 1);
  const teamBattingFirst = firstBallInnings1 ? getTeamFromPlayerId(firstBallInnings1.strikerId) : teamA;
  const teamBattingSecond = teamBattingFirst?.id === teamA.id ? teamB : teamA;

  // Helper to aggregate stats for a specific innings
  const generateInningsStats = (inningsNumber) => {
    const inningsEvents = ballByBallHistory.filter(ball => ball.innings === inningsNumber);
    const totalRuns = inningsEvents.reduce((sum, ball) => sum + ball.totalRuns, 0);
    const totalWickets = inningsEvents.filter(ball => ball.isWicket).length;
    
    const legalDeliveries = inningsEvents.filter(ball => !ball.extras.type || ball.extras.type === 'bye' || ball.extras.type === 'legBye').length;
    const overs = `${Math.floor(legalDeliveries / matchDetails.ballsPerOver)}.${legalDeliveries % matchDetails.ballsPerOver}`;

    const batting = {};
    inningsEvents.forEach(ball => {
      if (!batting[ball.strikerId]) {
        batting[ball.strikerId] = { runs: 0, balls: 0, fours: 0, sixes: 0 };
      }
      if (ball.extras.type !== 'wide') {
        batting[ball.strikerId].balls += 1;
      }
      if (!ball.extras.type) {
        batting[ball.strikerId].runs += ball.totalRuns;
        if (ball.runsBat === 4) batting[ball.strikerId].fours += 1;
        if (ball.runsBat === 6) batting[ball.strikerId].sixes += 1;
      }
    });

    const bowling = {};
    inningsEvents.forEach(ball => {
      if (!bowling[ball.bowlerId]) {
        bowling[ball.bowlerId] = { balls: 0, runsConceded: 0, wickets: 0 };
      }
      if (ball.extras.type !== 'wide' && ball.extras.type !== 'noBall') {
        bowling[ball.bowlerId].balls += 1;
      }
      if (ball.extras.type !== 'bye' && ball.extras.type !== 'legBye') {
        bowling[ball.bowlerId].runsConceded += ball.totalRuns;
      }
      if (ball.isWicket && ball.wicketDetails.type !== 'runOut') {
        bowling[ball.bowlerId].wickets += 1;
      }
    });

    return { totalRuns, totalWickets, overs, batting, bowling };
  };

  const innings1 = generateInningsStats(1);
  const innings2 = generateInningsStats(2);

  // NEW: Determine Winner using dynamic team names
  let resultText = "Match in Progress";
  if (innings2.totalRuns > innings1.totalRuns) {
    resultText = `${teamBattingSecond?.name} Won by ${((matchDetails.playersPerTeam - 1) - innings2.totalWickets)} Wickets`;
  } else if (innings1.totalRuns > innings2.totalRuns) {
    resultText = `${teamBattingFirst?.name} Won by ${innings1.totalRuns - innings2.totalRuns} Runs`;
  } else if (innings1.totalRuns === innings2.totalRuns && innings2.overs !== "0.0") {
    resultText = "Match Tied!";
  }

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(ballByBallHistory, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", matchDetails.matchName.replace(/\s+/g, '_') + "_Scorecard.json");
    document.body.appendChild(downloadAnchorNode); 
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const renderBattingTable = (battingStats) => (
    <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
      <Table size="small">
        <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
          <TableRow>
            <TableCell><strong>Batter</strong></TableCell>
            <TableCell align="right"><strong>R</strong></TableCell>
            <TableCell align="right"><strong>B</strong></TableCell>
            <TableCell align="right"><strong>4s</strong></TableCell>
            <TableCell align="right"><strong>6s</strong></TableCell>
            <TableCell align="right"><strong>SR</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Object.entries(battingStats).map(([id, stats]) => (
            <TableRow key={id}>
              <TableCell>{getPlayerName(id)}</TableCell>
              <TableCell align="right">{stats.runs}</TableCell>
              <TableCell align="right">{stats.balls}</TableCell>
              <TableCell align="right">{stats.fours}</TableCell>
              <TableCell align="right">{stats.sixes}</TableCell>
              <TableCell align="right">{stats.balls > 0 ? ((stats.runs / stats.balls) * 100).toFixed(1) : 0}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderBowlingTable = (bowlingStats) => (
    <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
      <Table size="small">
        <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
          <TableRow>
            <TableCell><strong>Bowler</strong></TableCell>
            <TableCell align="right"><strong>O</strong></TableCell>
            <TableCell align="right"><strong>R</strong></TableCell>
            <TableCell align="right"><strong>W</strong></TableCell>
            <TableCell align="right"><strong>Econ</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Object.entries(bowlingStats).map(([id, stats]) => {
            const overs = `${Math.floor(stats.balls / matchDetails.ballsPerOver)}.${stats.balls % matchDetails.ballsPerOver}`;
            const oversDecimal = stats.balls / matchDetails.ballsPerOver;
            return (
              <TableRow key={id}>
                <TableCell>{getPlayerName(id)}</TableCell>
                <TableCell align="right">{overs}</TableCell>
                <TableCell align="right">{stats.runsConceded}</TableCell>
                <TableCell align="right">{stats.wickets}</TableCell>
                <TableCell align="right">{oversDecimal > 0 ? (stats.runsConceded / oversDecimal).toFixed(1) : 0}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box sx={{ padding: 4, maxWidth: 900, margin: '0 auto' }}>
      <Paper sx={{ padding: 4, mb: 4, textAlign: 'center', backgroundColor: '#4caf50', color: 'white' }}>
        <Typography variant="h3" gutterBottom>{resultText}</Typography>
        <Typography variant="h6">{matchDetails.matchName} - Final Scorecard</Typography>
      </Paper>

      <Grid container spacing={4}>
        {/* NEW: Dynamic Team Names in Innings Headers */}
        <Grid item xs={12} md={6}>
          <Typography variant="h5" color="primary" gutterBottom>
            {teamBattingFirst?.name} ({innings1.totalRuns}/{innings1.totalWickets} in {innings1.overs} ov)
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle1" gutterBottom>Batting</Typography>
          {renderBattingTable(innings1.batting)}
          <Typography variant="subtitle1" gutterBottom>Bowling</Typography>
          {renderBowlingTable(innings1.bowling)}
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="h5" color="primary" gutterBottom>
            {teamBattingSecond?.name} ({innings2.totalRuns}/{innings2.totalWickets} in {innings2.overs} ov)
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle1" gutterBottom>Batting</Typography>
          {renderBattingTable(innings2.batting)}
          <Typography variant="subtitle1" gutterBottom>Bowling</Typography>
          {renderBowlingTable(innings2.bowling)}
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button variant="contained" color="secondary" size="large" onClick={handleExportData}>
          Download Raw Match Data (JSON)
        </Button>
      </Box>
    </Box>
  );
};

export default MatchSummary;