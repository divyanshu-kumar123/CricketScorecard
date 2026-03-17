import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Box, Button, Typography, Paper, Grid, Divider, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Avatar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { recordDelivery } from '../features/liveScoring/eventsSlice';
import { changeStrike, changeBatter, startNextOver, startNextInnings } from '../features/liveScoring/inningsSlice';

const LiveScorecard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { matchDetails, specialRules, teamA, teamB } = useSelector((state) => state.match);
  const { battingTeamId, bowlingTeamId, strikerId, nonStrikerId, bowlerId, currentOver, currentInnings } = useSelector((state) => state.innings);
  const { ballByBallHistory } = useSelector((state) => state.events);

  const battingTeam = teamA.id === battingTeamId ? teamA : teamB;
  const bowlingTeam = teamA.id === bowlingTeamId ? teamA : teamB;

  const striker = battingTeam?.players?.find((p) => p.id === strikerId);
  const nonStriker = battingTeam?.players?.find((p) => p.id === nonStrikerId);
  const bowler = bowlingTeam?.players?.find((p) => p.id === bowlerId);

  // Modals State
  const [wicketModalOpen, setWicketModalOpen] = useState(false);
  const [wicketType, setWicketType] = useState('bowled');
  const [playerOutId, setPlayerOutId] = useState('');
  const [nextBatterId, setNextBatterId] = useState('');
  const [runOutRuns, setRunOutRuns] = useState(0); // NEW: For Run Out/Wicket with completed runs

  const [endOfOverModalOpen, setEndOfOverModalOpen] = useState(false);
  const [nextBowlerId, setNextBowlerId] = useState('');

  const [extrasModalOpen, setExtrasModalOpen] = useState(false);
  const [extraType, setExtraType] = useState('wide');
  const [extraRuns, setExtraRuns] = useState(0);

  const [endOfInningsModalOpen, setEndOfInningsModalOpen] = useState(false);

  // THE FIX: Retired players are NOT included in the outPlayers list so they can bat again!
  const currentInningsEvents = ballByBallHistory.filter(ball => ball.innings === currentInnings);
  const outPlayers = currentInningsEvents
    .filter(ball => ball.isWicket && ball.wicketDetails.type !== 'retiredNotOut')
    .map(ball => ball.wicketDetails.playerOutId);

  const availableBatters = battingTeam?.players?.filter(p => p.id !== strikerId && p.id !== nonStrikerId && !outPlayers.includes(p.id)) || [];

  // THE FIX: Enforce Bowler Limits
  const getBowlerOvers = (id) => {
    const balls = currentInningsEvents.filter(b => b.bowlerId === id && (!b.extras.type || b.extras.type === 'bye' || b.extras.type === 'legBye')).length;
    return Math.floor(balls / (matchDetails.ballsPerOver || 6));
  };
  const availableBowlers = bowlingTeam?.players?.filter(p => p.id !== bowlerId && getBowlerOvers(p.id) < (matchDetails.bowlerOverLimit || 99)) || [];

  const totalRuns = currentInningsEvents.reduce((sum, ball) => sum + ball.totalRuns, 0);
  const totalWickets = currentInningsEvents.filter(ball => ball.isWicket && ball.wicketDetails.type !== 'retiredNotOut').length;
  
  const legalDeliveries = currentInningsEvents.filter(ball => !ball.extras.type || ball.extras.type === 'bye' || ball.extras.type === 'legBye').length;
  const displayOvers = `${Math.floor(legalDeliveries / (matchDetails.ballsPerOver || 6))}.${legalDeliveries % (matchDetails.ballsPerOver || 6)}`;

  const ballsPerOver = matchDetails?.ballsPerOver || 6;
  const completedOvers = Math.floor(legalDeliveries / ballsPerOver);
  const safeCurrentOver = currentOver || 0; 
  const totalTargetOvers = matchDetails?.totalOvers || 10;

  // NEW: Current Over Timeline Extraction
  const getOverTimeline = () => {
    const oversArray = [];
    let currentArray = [];
    let legals = 0;
    currentInningsEvents.forEach(ball => {
      currentArray.push(ball);
      if (!ball.extras.type || ball.extras.type === 'bye' || ball.extras.type === 'legBye') legals++;
      if (legals === ballsPerOver) { oversArray.push(currentArray); currentArray = []; legals = 0; }
    });
    if (currentArray.length > 0) oversArray.push(currentArray);
    return oversArray.length > 0 ? oversArray[oversArray.length - 1] : [];
  };
  const currentOverTimeline = getOverTimeline();

  // Target Logic
  let targetScore = null;
  let runsNeeded = null;
  let ballsRemaining = null;
  if (currentInnings === 2) {
    const firstInningsEvents = ballByBallHistory.filter(ball => ball.innings === 1);
    targetScore = firstInningsEvents.reduce((sum, ball) => sum + ball.totalRuns, 0) + 1;
    runsNeeded = targetScore - totalRuns;
    ballsRemaining = (totalTargetOvers * ballsPerOver) - legalDeliveries;
  }

  const isAllOut = totalWickets >= ((matchDetails?.playersPerTeam || 11) - 1);
  const isOversDone = completedOvers >= totalTargetOvers;
  const isTargetReached = currentInnings === 2 && targetScore !== null && totalRuns >= targetScore;

  useEffect(() => {
    if (isAllOut || (isOversDone && completedOvers > 0) || isTargetReached) {
      setEndOfInningsModalOpen(true);
      setEndOfOverModalOpen(false); 
    } else if (completedOvers > safeCurrentOver && completedOvers < totalTargetOvers) {
      setEndOfOverModalOpen(true);
    }
  }, [completedOvers, safeCurrentOver, totalTargetOvers, isAllOut, isOversDone, isTargetReached]);

  // LIVE STATS CALCULATOR
  const generateLiveStats = () => {
    const batting = {};
    const bowling = {};
    currentInningsEvents.forEach(ball => {
      if (!batting[ball.strikerId]) batting[ball.strikerId] = { runs: 0, balls: 0, fours: 0, sixes: 0 };
      if (ball.extras.type !== 'wide') batting[ball.strikerId].balls += 1;
      if (!ball.extras.type) {
        batting[ball.strikerId].runs += ball.totalRuns;
        if (ball.runsBat === 4) batting[ball.strikerId].fours += 1;
        if (ball.runsBat === 6) batting[ball.strikerId].sixes += 1;
      }
      if (!bowling[ball.bowlerId]) bowling[ball.bowlerId] = { balls: 0, runsConceded: 0, wickets: 0 };
      if (ball.extras.type !== 'wide' && ball.extras.type !== 'noBall') bowling[ball.bowlerId].balls += 1;
      if (ball.extras.type !== 'bye' && ball.extras.type !== 'legBye') bowling[ball.bowlerId].runsConceded += ball.totalRuns;
      if (ball.isWicket && ball.wicketDetails.type !== 'runOut' && ball.wicketDetails.type !== 'retiredNotOut') bowling[ball.bowlerId].wickets += 1;
    });
    return { batting, bowling };
  };
  const liveStats = generateLiveStats();

  const handleScoreRuns = (runsBat) => {
    const multiplier = striker.isSpecial ? (specialRules?.specialPlayerMultiplier || 2) : 1;
    const finalRuns = runsBat * multiplier;
    dispatch(recordDelivery({
      id: uuidv4(), innings: currentInnings, overNumber: displayOvers,
      strikerId: striker.id, nonStrikerId: nonStriker.id, bowlerId: bowler.id,
      runsBat, multiplierApplied: multiplier, totalRuns: finalRuns,
      extras: { type: null, runs: 0 }, isWicket: false, wicketDetails: null,
    }));
    if (runsBat % 2 !== 0) dispatch(changeStrike());
  };

  const handleExtrasSubmit = () => {
    let totalPenalty = Number(extraRuns);
    if (extraType === 'wide' || extraType === 'noBall') totalPenalty += 1; 
    dispatch(recordDelivery({
      id: uuidv4(), innings: currentInnings, overNumber: displayOvers,
      strikerId: striker.id, nonStrikerId: nonStriker.id, bowlerId: bowler.id,
      runsBat: 0, multiplierApplied: 1, totalRuns: totalPenalty,
      extras: { type: extraType, runs: totalPenalty }, isWicket: false, wicketDetails: null,
    }));
    setExtrasModalOpen(false); setExtraRuns(0);
    if (Number(extraRuns) % 2 !== 0) dispatch(changeStrike());
  };

  const handleWicketSubmit = () => {
    const isLastWicket = availableBatters.length === 0;
    if (!playerOutId || (!nextBatterId && !isLastWicket && wicketType !== 'retiredNotOut')) return;

    // Handle Run Out Runs
    const addedRuns = Number(runOutRuns);

    dispatch(recordDelivery({
      id: uuidv4(), innings: currentInnings, overNumber: displayOvers,
      strikerId: striker.id, nonStrikerId: nonStriker.id, bowlerId: bowler.id,
      runsBat: addedRuns, multiplierApplied: 1, totalRuns: addedRuns,
      extras: { type: null, runs: 0 }, isWicket: true,
      wicketDetails: { type: wicketType, playerOutId: playerOutId },
    }));
    
    if (!isLastWicket || wicketType === 'retiredNotOut') {
      dispatch(changeBatter({ outBatterId: playerOutId, inBatterId: nextBatterId }));
    }

    // If they completed an odd number of runs before the run out, swap strike
    if (addedRuns > 0 && addedRuns % 2 !== 0) dispatch(changeStrike());

    setWicketModalOpen(false); setPlayerOutId(''); setNextBatterId(''); setRunOutRuns(0); setWicketType('bowled');
  };

  const handleNextOverSubmit = () => {
    if (!nextBowlerId) return;
    dispatch(startNextOver({ nextBowlerId }));
    setEndOfOverModalOpen(false); setNextBowlerId('');
  };

  const handleInningsComplete = () => {
    setEndOfInningsModalOpen(false);
    if (currentInnings === 1) {
      dispatch(startNextInnings()); navigate('/opening-lineup'); 
    } else {
      navigate('/match-summary');
    }
  };

  if (!striker || !bowler) return <Typography>Loading Match Data...</Typography>;

  return (
    <Box sx={{ padding: 2, maxWidth: 900, margin: '0 auto' }}>
      <Paper sx={{ padding: 3, marginBottom: 2, textAlign: 'center', backgroundColor: '#1976d2', color: 'white' }}>
        <Typography variant="h5" gutterBottom>{battingTeam.name} Innings {currentInnings}</Typography>
        <Typography variant="h2" fontWeight="bold">{totalRuns} - {totalWickets}</Typography>
        <Typography variant="h6">Overs: {displayOvers} / {totalTargetOvers}</Typography>
        {currentInnings === 2 && targetScore && (
          <Typography variant="h6" sx={{ mt: 1, color: '#ffeb3b', fontWeight: 'bold' }}>
            Target: {targetScore} | Need {Math.max(0, runsNeeded)} from {ballsRemaining} balls
          </Typography>
        )}
      </Paper>

      {/* NEW: Interactive Current Over Timeline */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">Current Over</Typography>
        <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', py: 1 }}>
          {currentOverTimeline.map((ball, idx) => {
            let label = ball.totalRuns; let color = '#e0e0e0'; let txt = '#000';
            if (ball.isWicket) { label = 'W'; color = '#d32f2f'; txt = '#fff'; }
            else if (ball.extras.type) { label = `${ball.totalRuns}${ball.extras.type[0].toUpperCase()}`; color = '#ed6c02'; txt = '#fff'; }
            else if (ball.runsBat === 4) { label = '4'; color = '#0288d1'; txt = '#fff'; }
            else if (ball.runsBat === 6) { label = '6'; color = '#9c27b0'; txt = '#fff'; }
            else if (ball.totalRuns === 0) { label = '0'; color = '#9e9e9e'; txt = '#fff'; }
            return <Avatar key={idx} sx={{ bgcolor: color, color: txt, width: 36, height: 36, fontWeight: 'bold' }}>{label}</Avatar>;
          })}
          {currentOverTimeline.length === 0 && <Typography variant="body2" color="text.secondary">Waiting for first delivery...</Typography>}
        </Box>
      </Paper>

      <Grid container spacing={2} sx={{ marginBottom: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ padding: 2, height: '100%' }}>
            <Typography variant="h6" color="primary">Batters</Typography>
            <Divider sx={{ my: 1 }} />
            {/* NEW: LIVE STATS ON ACTIVE PLAYERS */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body1" fontWeight="bold">▶ {striker.name} {striker.isSpecial?'(S)':''}</Typography>
              <Typography variant="body1" fontWeight="bold">{liveStats.batting[striker.id]?.runs || 0} ({liveStats.batting[striker.id]?.balls || 0})</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body1" color="text.secondary">&nbsp;&nbsp;&nbsp;{nonStriker.name} {nonStriker.isSpecial?'(S)':''}</Typography>
              <Typography variant="body1" color="text.secondary">{liveStats.batting[nonStriker.id]?.runs || 0} ({liveStats.batting[nonStriker.id]?.balls || 0})</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ padding: 2, height: '100%' }}>
            <Typography variant="h6" color="secondary">Bowler</Typography>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body1" fontWeight="bold">{bowler.name} {bowler.isSpecial?'(S)':''}</Typography>
              <Typography variant="body1" fontWeight="bold">
                {liveStats.bowling[bowler.id]?.wickets || 0} - {liveStats.bowling[bowler.id]?.runsConceded || 0}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ padding: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Score Runs</Typography>
        <Grid container spacing={1} sx={{ marginBottom: 3 }}>
          {[0, 1, 2, 3, 4, 6].map((run) => (
            <Grid item xs={4} sm={2} key={run}>
              <Button variant="contained" size="large" fullWidth onClick={() => handleScoreRuns(run)} sx={{ height: 60, fontSize: '1.2rem', backgroundColor: run===4?'#0288d1':run===6?'#9c27b0':'' }}>
                {run}
              </Button>
            </Grid>
          ))}
        </Grid>
        <Divider sx={{ my: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={3}><Button variant="outlined" color="warning" fullWidth onClick={() => dispatch(changeStrike())}>Swap</Button></Grid>
          <Grid item xs={3}><Button variant="outlined" color="info" fullWidth onClick={() => setExtrasModalOpen(true)}>Extra</Button></Grid>
          <Grid item xs={3}><Button variant="outlined" color="success" fullWidth onClick={() => { setWicketType('retiredNotOut'); setPlayerOutId(striker.id); setWicketModalOpen(true); }}>Retire</Button></Grid>
          <Grid item xs={3}><Button variant="contained" color="error" fullWidth onClick={() => { setWicketType('bowled'); setPlayerOutId(striker.id); setWicketModalOpen(true); }}>Wicket</Button></Grid>
        </Grid>
      </Paper>

      {/* NEW: Bottom Live Tables */}
      <Typography variant="h6" sx={{ mt: 4, mb: 1 }}>Innings Batting</Typography>
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#f5f5f5' }}><TableRow><TableCell>Batter</TableCell><TableCell>R</TableCell><TableCell>B</TableCell><TableCell>4s</TableCell><TableCell>6s</TableCell></TableRow></TableHead>
          <TableBody>
            {Object.entries(liveStats.batting).map(([id, s]) => {
              const p = battingTeam.players.find(pl=>pl.id===id);
              return p ? <TableRow key={id}><TableCell>{p.name}</TableCell><TableCell>{s.runs}</TableCell><TableCell>{s.balls}</TableCell><TableCell>{s.fours}</TableCell><TableCell>{s.sixes}</TableCell></TableRow> : null;
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="h6" sx={{ mb: 1 }}>Innings Bowling</Typography>
      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#f5f5f5' }}><TableRow><TableCell>Bowler</TableCell><TableCell>O</TableCell><TableCell>R</TableCell><TableCell>W</TableCell></TableRow></TableHead>
          <TableBody>
            {Object.entries(liveStats.bowling).map(([id, s]) => {
              const p = bowlingTeam.players.find(pl=>pl.id===id);
              return p ? <TableRow key={id}><TableCell>{p.name}</TableCell><TableCell>{Math.floor(s.balls/ballsPerOver)}.{s.balls%ballsPerOver}</TableCell><TableCell>{s.runsConceded}</TableCell><TableCell>{s.wickets}</TableCell></TableRow> : null;
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* MODALS */}
      <Dialog open={wicketModalOpen} onClose={() => setWicketModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{wicketType === 'retiredNotOut' ? 'Retire Batsman' : 'Record Wicket'}</DialogTitle>
        <DialogContent>
          {wicketType !== 'retiredNotOut' && (
            <TextField select fullWidth label="Wicket Type" value={wicketType} onChange={(e) => setWicketType(e.target.value)} sx={{ mt: 2, mb: 2 }}>
              <MenuItem value="bowled">Bowled</MenuItem>
              <MenuItem value="caught">Caught</MenuItem>
              <MenuItem value="runOut">Run Out</MenuItem>
              <MenuItem value="stumped">Stumped</MenuItem>
            </TextField>
          )}

          {/* NEW: Run Out Added Runs */}
          {(wicketType === 'runOut' || wicketType === 'stumped') && (
            <TextField fullWidth type="number" label="Runs Completed Before Wicket" value={runOutRuns} onChange={(e) => setRunOutRuns(e.target.value)} sx={{ mb: 2 }} helperText="e.g. They ran 1 run, but got run out on the 2nd." />
          )}

          <TextField select fullWidth label={wicketType === 'retiredNotOut' ? 'Who is Retiring?' : 'Who is Out?'} value={playerOutId} onChange={(e) => setPlayerOutId(e.target.value)} sx={{ mb: 2, mt: wicketType === 'retiredNotOut' ? 2 : 0 }}>
            <MenuItem value={striker.id}>{striker.name} (Striker)</MenuItem>
            <MenuItem value={nonStriker.id}>{nonStriker.name} (Non-Striker)</MenuItem>
          </TextField>

          {availableBatters.length > 0 ? (
            <TextField select fullWidth label="Next Batter" value={nextBatterId} onChange={(e) => setNextBatterId(e.target.value)}>
              {availableBatters.map((p) => <MenuItem key={p.id} value={p.id}>{p.name} {p.isSpecial ? '(Special)' : ''}</MenuItem>)}
            </TextField>
          ) : (
            <Typography color="error" sx={{ mt: 2, fontWeight: 'bold' }}>Final wicket! Team will be all out.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWicketModalOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleWicketSubmit} disabled={!playerOutId || (!nextBatterId && availableBatters.length > 0)}>Confirm</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={extrasModalOpen} onClose={() => setExtrasModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Record Extras</DialogTitle>
        <DialogContent>
          <TextField select fullWidth label="Extra Type" value={extraType} onChange={(e) => setExtraType(e.target.value)} sx={{ mt: 2, mb: 2 }}>
            <MenuItem value="wide">Wide</MenuItem><MenuItem value="noBall">No Ball</MenuItem><MenuItem value="bye">Bye</MenuItem><MenuItem value="legBye">Leg Bye</MenuItem>
          </TextField>
          <TextField fullWidth type="number" label="Additional Runs Run" value={extraRuns} onChange={(e) => setExtraRuns(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExtrasModalOpen(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleExtrasSubmit}>Confirm Extra</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={endOfOverModalOpen && !endOfInningsModalOpen} disableEscapeKeyDown fullWidth maxWidth="sm">
        <DialogTitle>Over Complete</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mt: 1, mb: 3 }}>Select the next bowler.</Typography>
          {availableBowlers.length > 0 ? (
            <TextField select fullWidth label="Next Bowler" value={nextBowlerId} onChange={(e) => setNextBowlerId(e.target.value)}>
              {availableBowlers.map((p) => <MenuItem key={p.id} value={p.id}>{p.name} {p.isSpecial ? '(Special)' : ''}</MenuItem>)}
            </TextField>
          ) : (
             <Typography color="error" fontWeight="bold">Error: All available bowlers have reached their max limit!</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" color="primary" onClick={handleNextOverSubmit} disabled={!nextBowlerId}>Start Next Over</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={endOfInningsModalOpen} disableEscapeKeyDown fullWidth maxWidth="sm">
        <DialogTitle>{currentInnings === 1 ? 'Innings Complete!' : 'Match Complete!'}</DialogTitle>
        <DialogContent>
          <Typography variant="h5" align="center" sx={{ mt: 2, mb: 2 }}>Final Score: {totalRuns} - {totalWickets}</Typography>
          <Typography variant="body1" align="center" color="text.secondary">
             {/* THE FIX: Show actual team names for the win instead of "Bowling/Batting Team" */}
            {currentInnings === 1 
              ? (isAllOut ? 'The team has been bowled out.' : 'All assigned overs have been bowled.')
              : (isTargetReached ? `${battingTeam.name} wins the match!` : (totalRuns === targetScore - 1 ? 'Match Tied!' : `${bowlingTeam.name} wins the match!`))
            }
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button variant="contained" color="success" size="large" onClick={handleInningsComplete}>{currentInnings === 1 ? 'Start 2nd Innings' : 'View Match Summary'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LiveScorecard;