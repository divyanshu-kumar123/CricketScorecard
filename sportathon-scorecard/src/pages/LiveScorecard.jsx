import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Box, Button, Typography, Paper, Grid, Divider, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem } from '@mui/material';
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

  const [endOfOverModalOpen, setEndOfOverModalOpen] = useState(false);
  const [nextBowlerId, setNextBowlerId] = useState('');

  const [extrasModalOpen, setExtrasModalOpen] = useState(false);
  const [extraType, setExtraType] = useState('wide');
  const [extraRuns, setExtraRuns] = useState(0);

  const [endOfInningsModalOpen, setEndOfInningsModalOpen] = useState(false);

  const outPlayers = ballByBallHistory
    .filter(ball => ball.isWicket && ball.innings === currentInnings)
    .map(ball => ball.wicketDetails.playerOutId);

  const availableBatters = battingTeam?.players?.filter(p => 
    p.id !== strikerId && 
    p.id !== nonStrikerId && 
    !outPlayers.includes(p.id)
  ) || [];

  const isLastWicket = availableBatters.length === 0;

  const availableBowlers = bowlingTeam?.players?.filter(p => p.id !== bowlerId) || [];

  const currentInningsEvents = ballByBallHistory.filter(ball => ball.innings === currentInnings);
  const totalRuns = currentInningsEvents.reduce((sum, ball) => sum + ball.totalRuns, 0);
  const totalWickets = currentInningsEvents.filter(ball => ball.isWicket).length;
  
  const legalDeliveries = currentInningsEvents.filter(ball => !ball.extras.type || ball.extras.type === 'bye' || ball.extras.type === 'legBye').length;
  const displayOvers = `${Math.floor(legalDeliveries / matchDetails.ballsPerOver)}.${legalDeliveries % matchDetails.ballsPerOver}`;

  const ballsPerOver = matchDetails?.ballsPerOver || 6;
  const completedOvers = Math.floor(legalDeliveries / ballsPerOver);
  const safeCurrentOver = currentOver || 0; 
  const totalTargetOvers = matchDetails?.totalOvers || 10;

  // NEW: Target Calculation for 2nd Innings
  let targetScore = null;
  let runsNeeded = null;
  let ballsRemaining = null;
  if (currentInnings === 2) {
    const firstInningsEvents = ballByBallHistory.filter(ball => ball.innings === 1);
    targetScore = firstInningsEvents.reduce((sum, ball) => sum + ball.totalRuns, 0) + 1;
    runsNeeded = targetScore - totalRuns;
    ballsRemaining = (totalTargetOvers * ballsPerOver) - legalDeliveries;
  }

  const isAllOut = totalWickets >= ((matchDetails?.playersPerTeam || 5) - 1);
  const isOversDone = completedOvers >= totalTargetOvers;
  // NEW: Auto-end match if target is chased down
  const isTargetReached = currentInnings === 2 && targetScore !== null && totalRuns >= targetScore;

  useEffect(() => {
    if (isAllOut || (isOversDone && completedOvers > 0) || isTargetReached) {
      setEndOfInningsModalOpen(true);
      setEndOfOverModalOpen(false); 
    } else if (completedOvers > safeCurrentOver && completedOvers < totalTargetOvers) {
      setEndOfOverModalOpen(true);
    }
  }, [completedOvers, safeCurrentOver, totalTargetOvers, isAllOut, isOversDone, isTargetReached]);

  const handleScoreRuns = (runsBat) => {
    const multiplier = striker.isSpecial ? (specialRules?.specialPlayerMultiplier || 2) : 1;
    const finalRuns = runsBat * multiplier;

    const deliveryPayload = {
      id: uuidv4(),
      innings: currentInnings,
      overNumber: displayOvers,
      strikerId: striker.id,
      nonStrikerId: nonStriker.id,
      bowlerId: bowler.id,
      runsBat: runsBat,
      multiplierApplied: multiplier,
      totalRuns: finalRuns,
      extras: { type: null, runs: 0 },
      isWicket: false,
      wicketDetails: null,
    };

    dispatch(recordDelivery(deliveryPayload));

    if (runsBat % 2 !== 0) dispatch(changeStrike());
  };

  const handleExtrasSubmit = () => {
    let totalPenalty = Number(extraRuns);
    if (extraType === 'wide' || extraType === 'noBall') totalPenalty += 1; 

    const deliveryPayload = {
      id: uuidv4(),
      innings: currentInnings,
      overNumber: displayOvers,
      strikerId: striker.id,
      nonStrikerId: nonStriker.id,
      bowlerId: bowler.id,
      runsBat: 0,
      multiplierApplied: 1, 
      totalRuns: totalPenalty,
      extras: { type: extraType, runs: totalPenalty },
      isWicket: false,
      wicketDetails: null,
    };

    dispatch(recordDelivery(deliveryPayload));
    setExtrasModalOpen(false);
    setExtraRuns(0);

    if (Number(extraRuns) % 2 !== 0) dispatch(changeStrike());
  };

const handleWicketSubmit = () => {
    // Allow submission if it's the last wicket, even without a nextBatterId
    if (!playerOutId || (!nextBatterId && !isLastWicket)) return;

    const deliveryPayload = {
      id: uuidv4(),
      innings: currentInnings,
      overNumber: displayOvers,
      strikerId: striker.id,
      nonStrikerId: nonStriker.id,
      bowlerId: bowler.id,
      runsBat: 0,
      multiplierApplied: 1,
      totalRuns: 0,
      extras: { type: null, runs: 0 },
      isWicket: true,
      wicketDetails: { type: wicketType, playerOutId: playerOutId },
    };
    
    dispatch(recordDelivery(deliveryPayload));
    
    // Only try to swap the batter if there is someone left to bat
    if (!isLastWicket) {
      dispatch(changeBatter({ outBatterId: playerOutId, inBatterId: nextBatterId }));
    }

    setWicketModalOpen(false);
    setPlayerOutId('');
    setNextBatterId('');
  };

  const handleNextOverSubmit = () => {
    if (!nextBowlerId) return;
    dispatch(startNextOver({ nextBowlerId }));
    setEndOfOverModalOpen(false);
    setNextBowlerId('');
  };

  const handleInningsComplete = () => {
    setEndOfInningsModalOpen(false);
    if (currentInnings === 1) {
      dispatch(startNextInnings());
      navigate('/opening-lineup'); 
    } else {
      navigate('/match-summary');
    }
  };

  if (!striker || !bowler) return <Typography>Loading Match Data...</Typography>;

  return (
    <Box sx={{ padding: 2, maxWidth: 900, margin: '0 auto' }}>
      <Paper sx={{ padding: 3, marginBottom: 3, textAlign: 'center', backgroundColor: '#1976d2', color: 'white' }}>
        <Typography variant="h5" gutterBottom>{battingTeam.name} Innings {currentInnings}</Typography>
        <Typography variant="h2" fontWeight="bold">
          {totalRuns} - {totalWickets}
        </Typography>
        <Typography variant="h6">Overs: {displayOvers} / {totalTargetOvers}</Typography>
        
        {/* NEW: Target Display for 2nd Innings */}
        {currentInnings === 2 && targetScore && (
          <Typography variant="h6" sx={{ mt: 1, color: '#ffeb3b', fontWeight: 'bold' }}>
            Target: {targetScore} | Need {Math.max(0, runsNeeded)} runs from {ballsRemaining} balls
          </Typography>
        )}
      </Paper>

      <Grid container spacing={2} sx={{ marginBottom: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ padding: 2, height: '100%' }}>
            <Typography variant="h6" color="primary">Batters</Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body1" fontWeight={striker.id ? "bold" : "normal"}>
              {striker.name} {striker.isSpecial ? '(Special)' : ''} * (Striker)
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {nonStriker.name}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ padding: 2, height: '100%' }}>
            <Typography variant="h6" color="secondary">Bowler</Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body1">
              {bowler.name} {bowler.isSpecial ? '(Special)' : ''}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ padding: 3 }}>
        <Typography variant="h6" gutterBottom>Runs</Typography>
        <Grid container spacing={1} sx={{ marginBottom: 3 }}>
          {[0, 1, 2, 3, 4, 6].map((run) => (
            <Grid item xs={4} sm={2} key={run}>
              <Button variant="contained" size="large" fullWidth onClick={() => handleScoreRuns(run)} sx={{ height: 60, fontSize: '1.2rem' }}>
                {run}
              </Button>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Button variant="outlined" color="warning" fullWidth onClick={() => dispatch(changeStrike())}>
              Swap Strike
            </Button>
          </Grid>
          <Grid item xs={4}>
            <Button variant="outlined" color="info" fullWidth onClick={() => setExtrasModalOpen(true)}>
              Extras
            </Button>
          </Grid>
          <Grid item xs={4}>
            <Button variant="contained" color="error" fullWidth onClick={() => { setPlayerOutId(striker.id); setWicketModalOpen(true); }}>
              Wicket
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* MODALS */}
      <Dialog open={extrasModalOpen} onClose={() => setExtrasModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Record Extras</DialogTitle>
        <DialogContent>
          <TextField select fullWidth label="Extra Type" value={extraType} onChange={(e) => setExtraType(e.target.value)} sx={{ mt: 2, mb: 2 }}>
            <MenuItem value="wide">Wide</MenuItem>
            <MenuItem value="noBall">No Ball</MenuItem>
            <MenuItem value="bye">Bye</MenuItem>
            <MenuItem value="legBye">Leg Bye</MenuItem>
          </TextField>
          <TextField fullWidth type="number" label="Additional Runs Run (Optional)" value={extraRuns} onChange={(e) => setExtraRuns(e.target.value)} helperText="Leave at 0 if no extra runs were physically run." />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExtrasModalOpen(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleExtrasSubmit}>Confirm Extra</Button>
        </DialogActions>
      </Dialog>

      {/* 2. Wicket Modal */}
      <Dialog open={wicketModalOpen} onClose={() => setWicketModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Record Wicket</DialogTitle>
        <DialogContent>
          <TextField select fullWidth label="Wicket Type" value={wicketType} onChange={(e) => setWicketType(e.target.value)} sx={{ mt: 2, mb: 2 }}>
            <MenuItem value="bowled">Bowled</MenuItem>
            <MenuItem value="caught">Caught</MenuItem>
            <MenuItem value="runOut">Run Out</MenuItem>
            <MenuItem value="lbw">LBW</MenuItem>
            <MenuItem value="stumped">Stumped</MenuItem>
          </TextField>
          <TextField select fullWidth label="Who is Out?" value={playerOutId} onChange={(e) => setPlayerOutId(e.target.value)} sx={{ mb: 2 }}>
            <MenuItem value={striker.id}>{striker.name} (Striker)</MenuItem>
            <MenuItem value={nonStriker.id}>{nonStriker.name} (Non-Striker)</MenuItem>
          </TextField>
          
          {/* Dynamically handle the final wicket UI */}
          {!isLastWicket ? (
            <TextField select fullWidth label="Next Batter" value={nextBatterId} onChange={(e) => setNextBatterId(e.target.value)}>
              {availableBatters.map((p) => (
                <MenuItem key={p.id} value={p.id}>{p.name} {p.isSpecial ? '(Special)' : ''}</MenuItem>
              ))}
            </TextField>
          ) : (
            <Typography variant="body1" color="error" sx={{ mt: 2, fontWeight: 'bold', textAlign: 'center' }}>
              This is the final wicket. The team will be all out!
            </Typography>
          )}
          
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWicketModalOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleWicketSubmit} 
            disabled={!playerOutId || (!nextBatterId && !isLastWicket)}
          >
            Confirm Wicket
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={endOfOverModalOpen && !endOfInningsModalOpen} disableEscapeKeyDown fullWidth maxWidth="sm">
        <DialogTitle>Over Complete</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mt: 1, mb: 3 }}>The over is finished. Select the next bowler.</Typography>
          <TextField select fullWidth label="Next Bowler" value={nextBowlerId} onChange={(e) => setNextBowlerId(e.target.value)}>
            {availableBowlers.map((p) => (
              <MenuItem key={p.id} value={p.id}>{p.name} {p.isSpecial ? '(Special)' : ''}</MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" color="primary" onClick={handleNextOverSubmit} disabled={!nextBowlerId}>Start Next Over</Button>
        </DialogActions>
      </Dialog>

      {/* NEW: Updated Match Completion Logic */}
      <Dialog open={endOfInningsModalOpen} disableEscapeKeyDown fullWidth maxWidth="sm">
        <DialogTitle>{currentInnings === 1 ? 'Innings Complete!' : 'Match Complete!'}</DialogTitle>
        <DialogContent>
          <Typography variant="h5" align="center" sx={{ mt: 2, mb: 2 }}>
            Final Score: {totalRuns} - {totalWickets}
          </Typography>
         <Typography variant="body1" align="center" color="text.secondary">
            {currentInnings === 1 
              ? (isAllOut ? 'The team has been bowled out.' : 'All assigned overs have been bowled.')
              : (isTargetReached 
                  ? `${battingTeam.name} wins the match!` 
                  : (totalRuns === targetScore - 1 ? 'Match Tied!' : `${bowlingTeam.name} wins the match!`))
            }
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button variant="contained" color="success" size="large" onClick={handleInningsComplete}>
            {currentInnings === 1 ? 'Start 2nd Innings' : 'View Match Summary'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default LiveScorecard;