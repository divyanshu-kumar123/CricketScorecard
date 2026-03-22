import React from 'react';
import { useSelector } from 'react-redux';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Grid, Divider } from '@mui/material';
import { generateExcelScorecard } from '../utils/exportToExcel';

/** Centered scorecard width; tables share one visual system (dark stadium UI). */
const SCORECARD_MAX_WIDTH = 1520;

const tableContainerSx = {
  mb: 2,
  width: '100%',
  maxWidth: '100%',
  borderRadius: 2,
  border: '1px solid rgba(212, 175, 55, 0.28)',
  backgroundColor: 'rgba(12, 24, 42, 0.82)',
  overflow: 'auto',
  WebkitOverflowScrolling: 'touch',
};

const tableHeadRowSx = {
  backgroundColor: 'rgba(30, 45, 70, 0.95)',
  '& th': {
    borderColor: 'rgba(255, 255, 255, 0.08)',
    color: '#d4af37',
    fontSize: '0.68rem',
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    py: 1,
    px: 0.75,
    whiteSpace: 'nowrap',
  },
};

const bodyCellSx = {
  py: 0.75,
  px: 0.75,
  fontSize: '0.75rem',
  verticalAlign: 'top',
  wordBreak: 'break-word',
  overflowWrap: 'anywhere',
};

const sectionTitleSx = {
  color: 'primary.main',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  fontWeight: 700,
  fontSize: '0.75rem',
  mb: 1,
  mt: 0,
};

const teamHeadingSx = {
  textAlign: 'center',
  mb: 1.5,
};

const MatchSummary = () => {
  const { matchDetails, teamA, teamB } = useSelector((state) => state.match);
  const { ballByBallHistory } = useSelector((state) => state.events);

  const getPlayerName = (id) => {
    const playerA = teamA.players.find(p => p.id === id);
    if (playerA) return `${playerA.name} ${playerA.isSpecial ? '(S)' : ''}`;
    const playerB = teamB.players.find(p => p.id === id);
    return playerB ? `${playerB.name} ${playerB.isSpecial ? '(S)' : ''}` : 'Unknown';
  };

  const getTeamFromPlayerId = (playerId) => {
    if (teamA.players.some(p => p.id === playerId)) return teamA;
    if (teamB.players.some(p => p.id === playerId)) return teamB;
    return null;
  };

  const firstBallInnings1 = ballByBallHistory.find(ball => ball.innings === 1);
  const teamBattingFirst = firstBallInnings1 ? getTeamFromPlayerId(firstBallInnings1.strikerId) : teamA;
  const teamBattingSecond = teamBattingFirst?.id === teamA.id ? teamB : teamA;

  const generateInningsStats = (inningsNumber) => {
    const inningsEvents = ballByBallHistory.filter(ball => ball.innings === inningsNumber);
    const totalRuns = inningsEvents.reduce((sum, ball) => sum + ball.totalRuns, 0);
    // Exclude retirements from total wickets
    const totalWickets = inningsEvents.filter(ball => ball.isWicket && ball.wicketDetails.type !== 'retiredNotOut').length;
    
    // Only count actual deliveries, ignore retirements
    const actualDeliveries = inningsEvents.filter(ball => ball.isDelivery !== false);
    const legalDeliveries = actualDeliveries.filter(ball => !ball.extras.type || ball.extras.type === 'bye' || ball.extras.type === 'legBye').length;
    const overs = `${Math.floor(legalDeliveries / (matchDetails.ballsPerOver || 6))}.${legalDeliveries % (matchDetails.ballsPerOver || 6)}`;

    const batting = {};
    inningsEvents.forEach(ball => {
      if (!batting[ball.strikerId]) {
        batting[ball.strikerId] = { runs: 0, balls: 0, fours: 0, sixes: 0 };
      }
      
      // Do not count retirements against batter balls
      if (ball.isDelivery !== false) {
        if (ball.extras.type !== 'wide') {
          batting[ball.strikerId].balls += 1;
        }
        if (!ball.extras.type) {
          batting[ball.strikerId].runs += ball.totalRuns;
          if (ball.runsBat === 4) batting[ball.strikerId].fours += 1;
          if (ball.runsBat === 6) batting[ball.strikerId].sixes += 1;
        }
      }
    });

    const bowling = {};
    inningsEvents.forEach(ball => {
      if (!bowling[ball.bowlerId]) {
        bowling[ball.bowlerId] = { balls: 0, runsConceded: 0, wickets: 0 };
      }
      
      // Do not count retirements against bowler stats
      if (ball.isDelivery !== false) {
        if (ball.extras.type !== 'wide' && ball.extras.type !== 'noBall') {
          bowling[ball.bowlerId].balls += 1;
        }
        if (ball.extras.type !== 'bye' && ball.extras.type !== 'legBye') {
          bowling[ball.bowlerId].runsConceded += ball.totalRuns;
        }
      }
      if (ball.isWicket && ball.wicketDetails.type !== 'runOut' && ball.wicketDetails.type !== 'retiredNotOut') {
        bowling[ball.bowlerId].wickets += 1;
      }
    });

    return { totalRuns, totalWickets, overs, batting, bowling };
  };

  const getOversData = (inningsNumber) => {
    const events = ballByBallHistory.filter(b => b.innings === inningsNumber);
    const overs = [];
    let currentOver = [];
    let legals = 0;
    const ballsPerOver = matchDetails?.ballsPerOver || 6;

    events.forEach(ball => {
      currentOver.push(ball);
      if (ball.isDelivery !== false) {
        if (!ball.extras.type || ball.extras.type === 'bye' || ball.extras.type === 'legBye') legals++;
      }
      if (legals === ballsPerOver) {
        overs.push(currentOver);
        currentOver = [];
        legals = 0;
      }
    });
    if (currentOver.length > 0) overs.push(currentOver);
    return overs;
  };

  const formatOverHistory = (overEvents) => {
    if (!overEvents || overEvents.length === 0) return { bowlerId: null, history: '-' };
    
    // Find the bowler for this over
    const bowlerId = overEvents.find(b => b.bowlerId)?.bowlerId || overEvents[0].bowlerId;
    
    // Create the comma-separated string
    const historyText = overEvents.map(ball => {
      if (ball.isDelivery === false && ball.wicketDetails?.type === 'retiredNotOut') return 'RTD';
      if (ball.isWicket) {
        if (ball.wicketDetails?.type === 'runOut' && ball.runsBat > 0) return `${ball.runsBat}+W`;
        return 'W';
      }
      if (ball.extras.type) return `${ball.totalRuns}${ball.extras.type[0].toUpperCase()}`;
      if (ball.runsBat === 4) return '4';
      if (ball.runsBat === 6) return '6';
      return ball.totalRuns.toString();
    }).join(', ');

    return { bowlerId, history: historyText };
  };

  const innings1Overs = getOversData(1);
  const innings2Overs = getOversData(2);
  const maxOvers = Math.max(innings1Overs.length, innings2Overs.length);
  
  const comparisonRows = [];
  for (let i = 0; i < maxOvers; i++) {
    const in1 = formatOverHistory(innings1Overs[i]);
    const in2 = formatOverHistory(innings2Overs[i]);
    comparisonRows.push({
      overNum: i + 1,
      in1Bowler: in1.bowlerId ? getPlayerName(in1.bowlerId) : '-',
      in1History: in1.history,
      in2Bowler: in2.bowlerId ? getPlayerName(in2.bowlerId) : '-',
      in2History: in2.history
    });
  }

  const innings1 = generateInningsStats(1);
  const innings2 = generateInningsStats(2);

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
    downloadAnchorNode.setAttribute("download", matchDetails.matchName.replace(/\s+/g, '_') + "_Raw_Data.json");
    document.body.appendChild(downloadAnchorNode); 
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const renderBattingTable = (battingStats) => (
    <TableContainer component={Paper} variant="outlined" sx={tableContainerSx}>
      <Table size="small" sx={{ minWidth: 280 }}>
        <TableHead>
          <TableRow sx={tableHeadRowSx}>
            <TableCell>Batter</TableCell>
            <TableCell align="right">R</TableCell>
            <TableCell align="right">B</TableCell>
            <TableCell align="right">4s</TableCell>
            <TableCell align="right">6s</TableCell>
            <TableCell align="right">SR</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Object.entries(battingStats).map(([id, stats]) => (
            <TableRow key={id} hover>
              <TableCell sx={bodyCellSx}>{getPlayerName(id)}</TableCell>
              <TableCell align="right" sx={bodyCellSx}>{stats.runs}</TableCell>
              <TableCell align="right" sx={bodyCellSx}>{stats.balls}</TableCell>
              <TableCell align="right" sx={bodyCellSx}>{stats.fours}</TableCell>
              <TableCell align="right" sx={bodyCellSx}>{stats.sixes}</TableCell>
              <TableCell align="right" sx={bodyCellSx}>{stats.balls > 0 ? ((stats.runs / stats.balls) * 100).toFixed(1) : 0}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderBowlingTable = (bowlingStats) => (
    <TableContainer component={Paper} variant="outlined" sx={tableContainerSx}>
      <Table size="small" sx={{ minWidth: 260 }}>
        <TableHead>
          <TableRow sx={tableHeadRowSx}>
            <TableCell>Bowler</TableCell>
            <TableCell align="right">O</TableCell>
            <TableCell align="right">R</TableCell>
            <TableCell align="right">W</TableCell>
            <TableCell align="right">Econ</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Object.entries(bowlingStats).map(([id, stats]) => {
            const overs = `${Math.floor(stats.balls / (matchDetails.ballsPerOver || 6))}.${stats.balls % (matchDetails.ballsPerOver || 6)}`;
            const oversDecimal = stats.balls / (matchDetails.ballsPerOver || 6);
            return (
              <TableRow key={id} hover>
                <TableCell sx={bodyCellSx}>{getPlayerName(id)}</TableCell>
                <TableCell align="right" sx={bodyCellSx}>{overs}</TableCell>
                <TableCell align="right" sx={bodyCellSx}>{stats.runsConceded}</TableCell>
                <TableCell align="right" sx={bodyCellSx}>{stats.wickets}</TableCell>
                <TableCell align="right" sx={bodyCellSx}>{oversDecimal > 0 ? (stats.runsConceded / oversDecimal).toFixed(1) : 0}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        px: { xs: 1.5, sm: 2, md: 3 },
        py: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: SCORECARD_MAX_WIDTH,
          mx: 'auto',
        }}
      >
        <Paper
          className="app-result-banner"
          sx={{ padding: 4, mb: 4, width: '100%', textAlign: 'center', backgroundColor: '#4caf50', color: 'white' }}
        >
          <Typography variant="h3" gutterBottom>{resultText}</Typography>
          <Typography variant="h6">{matchDetails.matchName} - Final Scorecard</Typography>
        </Paper>

        <Grid container spacing={3} sx={{ width: '100%', alignItems: 'flex-start', justifyContent: 'center' }}>
          <Grid item xs={12} md={4} sx={{ minWidth: 0 }}>
            <Typography variant="h5" color="primary" gutterBottom sx={teamHeadingSx}>
              {teamBattingFirst?.name} ({innings1.totalRuns}/{innings1.totalWickets} in {innings1.overs} ov)
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" sx={sectionTitleSx}>Batting</Typography>
            {renderBattingTable(innings1.batting)}
            <Typography variant="subtitle2" sx={sectionTitleSx}>Bowling</Typography>
            {renderBowlingTable(innings1.bowling)}
          </Grid>

          <Grid item xs={12} md={4} sx={{ minWidth: 0 }}>
            <Typography variant="h5" color="primary" gutterBottom sx={{ ...teamHeadingSx, mb: 2 }}>
              Over-by-Over Comparison
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ ...tableContainerSx, mb: 0 }}>
              <Table size="small" sx={{ minWidth: 640, tableLayout: 'auto' }}>
                <TableHead>
                  <TableRow sx={tableHeadRowSx}>
                    <TableCell colSpan={2} align="center">
                      {teamBattingFirst?.name || 'Team A'}
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ backgroundColor: 'rgba(212, 175, 55, 0.12) !important', color: '#f0e6c8 !important' }}
                    >
                      Over
                    </TableCell>
                    <TableCell colSpan={2} align="center">
                      {teamBattingSecond?.name || 'Team B'}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {comparisonRows.map((row) => (
                    <TableRow key={row.overNum} hover>
                      <TableCell sx={bodyCellSx}>{row.in1Bowler}</TableCell>
                      <TableCell sx={{ ...bodyCellSx, fontFamily: 'var(--font-mono, ui-monospace, monospace)', fontSize: '0.7rem' }}>
                        {row.in1History}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          ...bodyCellSx,
                          fontWeight: 700,
                          backgroundColor: 'rgba(255, 255, 255, 0.04)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {row.overNum}
                      </TableCell>
                      <TableCell sx={bodyCellSx}>{row.in2Bowler}</TableCell>
                      <TableCell sx={{ ...bodyCellSx, fontFamily: 'var(--font-mono, ui-monospace, monospace)', fontSize: '0.7rem' }}>
                        {row.in2History}
                      </TableCell>
                    </TableRow>
                  ))}

                  <TableRow sx={{ backgroundColor: 'rgba(30, 45, 70, 0.55)' }}>
                    <TableCell colSpan={2} align="center" sx={bodyCellSx}>
                      <Typography component="span" fontWeight="bold" sx={{ fontSize: '0.8rem' }}>
                        {teamBattingFirst?.name}: {innings1.totalRuns} / {innings1.totalWickets}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ ...bodyCellSx, fontWeight: 700 }}>Total</TableCell>
                    <TableCell colSpan={2} align="center" sx={bodyCellSx}>
                      <Typography component="span" fontWeight="bold" sx={{ fontSize: '0.8rem' }}>
                        {teamBattingSecond?.name}: {innings2.totalRuns} / {innings2.totalWickets}
                      </Typography>
                    </TableCell>
                  </TableRow>

                  <TableRow sx={{ backgroundColor: 'rgba(67, 160, 71, 0.18)' }}>
                    <TableCell colSpan={2} align="right" sx={bodyCellSx}>
                      <Typography variant="subtitle1" color="success.light" fontWeight="bold">
                        Winner
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={bodyCellSx}>🏆</TableCell>
                    <TableCell colSpan={2} sx={bodyCellSx}>
                      <Typography variant="subtitle1" color="success.light" fontWeight="bold">
                        {resultText.includes('Match Tied')
                          ? 'Match Tied'
                          : (innings2.totalRuns > innings1.totalRuns ? teamBattingSecond?.name : teamBattingFirst?.name)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          <Grid item xs={12} md={4} sx={{ minWidth: 0 }}>
            <Typography variant="h5" color="primary" gutterBottom sx={teamHeadingSx}>
              {teamBattingSecond?.name} ({innings2.totalRuns}/{innings2.totalWickets} in {innings2.overs} ov)
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" sx={sectionTitleSx}>Batting</Typography>
            {renderBattingTable(innings2.batting)}
            <Typography variant="subtitle2" sx={sectionTitleSx}>Bowling</Typography>
            {renderBowlingTable(innings2.bowling)}
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 2 }}>
          <Button variant="outlined" color="secondary" size="large" onClick={handleExportData}>
            Download Raw JSON
          </Button>
          <Button variant="contained" color="primary" size="large" onClick={() => generateExcelScorecard(matchDetails, ballByBallHistory, teamA, teamB)}>
            Download Excel Spreadsheet
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default MatchSummary;