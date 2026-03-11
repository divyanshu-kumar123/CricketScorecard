import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setInningsTeams, setActivePlayers } from '../features/liveScoring/inningsSlice';
import { startMatch } from '../features/matchSetup/matchSlice';
import { Box, Button, Typography, Paper, MenuItem, TextField, Alert } from '@mui/material';

const OpeningLineup = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { teamA, teamB, toss, specialRules } = useSelector((state) => state.match);
  // NEW: Pull the current innings and team IDs from the innings slice
  const { currentInnings, battingTeamId, bowlingTeamId } = useSelector((state) => state.innings);

  // THE FIX: Determine teams dynamically based on the current innings
  let battingTeam, bowlingTeam;

  if (currentInnings === 1 || !currentInnings) {
    // Innings 1: Derive from the Toss
    battingTeam = toss.decision === 'bat' 
      ? (toss.winner === teamA.id ? teamA : teamB) 
      : (toss.winner === teamA.id ? teamB : teamA);
    bowlingTeam = battingTeam.id === teamA.id ? teamB : teamA;
  } else {
    // Innings 2: Derive from the properly swapped IDs in the Redux store
    battingTeam = teamA.id === battingTeamId ? teamA : teamB;
    bowlingTeam = teamA.id === bowlingTeamId ? teamA : teamB;
  }

  const [striker, setStriker] = useState('');
  const [nonStriker, setNonStriker] = useState('');
  const [bowler, setBowler] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const specialBatters = battingTeam?.players.filter(p => p.isSpecial) || [];
    const specialBowlers = bowlingTeam?.players.filter(p => p.isSpecial) || [];
    
    if (specialBatters.length > 0 && !striker) setStriker(specialBatters[0].id);
    if (specialBowlers.length > 0 && !bowler) setBowler(specialBowlers[0].id);
  }, [battingTeam, bowlingTeam]); 

  const handleStartMatch = () => {
    if (!striker || !nonStriker || !bowler) {
      setError('Please select the Striker, Non-Striker, and Bowler to begin.');
      return;
    }
    if (striker === nonStriker) {
      setError('Striker and Non-Striker cannot be the same player.');
      return;
    }

    const selectedStriker = battingTeam.players.find(p => p.id === striker);
    const selectedBowler = bowlingTeam.players.find(p => p.id === bowler);

    if (specialRules?.mandatoryFirstOverBat && !selectedStriker.isSpecial) {
      setError('Match rules dictate a Special Player must take the strike for the first over.');
      return;
    }

    if (specialRules?.mandatoryFirstOverBowl && !selectedBowler.isSpecial) {
      setError('Match rules dictate a Special Player must bowl the first over.');
      return;
    }

    // Save the derived teams back to Redux (crucial for Innings 1)
    dispatch(setInningsTeams({ battingTeamId: battingTeam.id, bowlingTeamId: bowlingTeam.id }));
    dispatch(setActivePlayers({ strikerId: striker, nonStrikerId: nonStriker, bowlerId: bowler }));
    
    if (currentInnings === 1) {
      dispatch(startMatch());
    }

    navigate('/live-score');
  };

  if (!battingTeam || !bowlingTeam) return <Typography>Loading Lineup...</Typography>;

  return (
    <Box sx={{ padding: 4, maxWidth: 600, margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom textAlign="center">Opening Lineup</Typography>
      
      {error && <Alert severity="error" sx={{ marginBottom: 3 }}>{error}</Alert>}

      <Paper sx={{ padding: 3, marginBottom: 3 }}>
        <Typography variant="h6" color="primary" gutterBottom>
          Batting: {battingTeam.name}
        </Typography>
        
        <TextField select fullWidth label="Striker" value={striker} onChange={(e) => setStriker(e.target.value)} sx={{ mb: 2 }}>
          {battingTeam.players.map(p => (
            <MenuItem key={p.id} value={p.id}>{p.name} {p.isSpecial ? '(Special)' : ''}</MenuItem>
          ))}
        </TextField>

        <TextField select fullWidth label="Non-Striker" value={nonStriker} onChange={(e) => setNonStriker(e.target.value)}>
          {battingTeam.players.map(p => (
            <MenuItem key={p.id} value={p.id}>{p.name} {p.isSpecial ? '(Special)' : ''}</MenuItem>
          ))}
        </TextField>
      </Paper>

      <Paper sx={{ padding: 3, marginBottom: 3 }}>
        <Typography variant="h6" color="secondary" gutterBottom>
          Bowling: {bowlingTeam.name}
        </Typography>

        <TextField select fullWidth label="Bowler" value={bowler} onChange={(e) => setBowler(e.target.value)}>
          {bowlingTeam.players.map(p => (
            <MenuItem key={p.id} value={p.id}>{p.name} {p.isSpecial ? '(Special)' : ''}</MenuItem>
          ))}
        </TextField>
      </Paper>

      <Button variant="contained" color="success" size="large" fullWidth onClick={handleStartMatch}>
        Play Ball (Start Innings {currentInnings || 1})
      </Button>
    </Box>
  );
};

export default OpeningLineup;