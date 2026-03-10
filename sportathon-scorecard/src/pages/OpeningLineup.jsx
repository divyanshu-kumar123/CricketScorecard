import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setInningsTeams, setActivePlayers } from '../features/liveScoring/inningsSlice';
import { startMatch } from '../features/matchSetup/matchSlice';
import { Box, Button, Typography, Paper, MenuItem, TextField, Alert } from '@mui/material';

const OpeningLineup = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // NEW: Pulling specialRules from Redux for dynamic validation
  const { teamA, teamB, toss, specialRules } = useSelector((state) => state.match);

  const battingTeam = toss.decision === 'bat' 
    ? (toss.winner === teamA.id ? teamA : teamB) 
    : (toss.winner === teamA.id ? teamB : teamA);
    
  const bowlingTeam = battingTeam.id === teamA.id ? teamB : teamA;

  const [striker, setStriker] = useState('');
  const [nonStriker, setNonStriker] = useState('');
  const [bowler, setBowler] = useState('');
  const [error, setError] = useState('');

  // Auto-select the first special player as a convenience, but leave the dropdown unlocked so it can be changed
  useEffect(() => {
    const specialBatters = battingTeam.players.filter(p => p.isSpecial);
    const specialBowlers = bowlingTeam.players.filter(p => p.isSpecial);
    
    if (specialBatters.length > 0 && !striker) setStriker(specialBatters[0].id);
    if (specialBowlers.length > 0 && !bowler) setBowler(specialBowlers[0].id);
  }, [battingTeam, bowlingTeam]); // Intentionally omitting striker/bowler to prevent infinite loops

  const handleStartMatch = () => {
    if (!striker || !nonStriker || !bowler) {
      setError('Please select the Striker, Non-Striker, and Bowler to begin.');
      return;
    }
    if (striker === nonStriker) {
      setError('Striker and Non-Striker cannot be the same player.');
      return;
    }

    // NEW: Dynamic Validation based on Match Setup rules
    const selectedStriker = battingTeam.players.find(p => p.id === striker);
    const selectedBowler = bowlingTeam.players.find(p => p.id === bowler);

    // If the rules dictate a special player MUST bat first, enforce it here
    if (specialRules?.mandatoryFirstOverBat && !selectedStriker.isSpecial) {
      setError('Match rules dictate a Special Player must take the strike for the first over.');
      return;
    }

    // If the rules dictate a special player MUST bowl first, enforce it here
    if (specialRules?.mandatoryFirstOverBowl && !selectedBowler.isSpecial) {
      setError('Match rules dictate a Special Player must bowl the first over.');
      return;
    }

    dispatch(setInningsTeams({ battingTeamId: battingTeam.id, bowlingTeamId: bowlingTeam.id }));
    dispatch(setActivePlayers({ strikerId: striker, nonStrikerId: nonStriker, bowlerId: bowler }));
    dispatch(startMatch());

    navigate('/live-score');
  };

  return (
    <Box sx={{ padding: 4, maxWidth: 600, margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom textAlign="center">Opening Lineup</Typography>
      
      {error && <Alert severity="error" sx={{ marginBottom: 3 }}>{error}</Alert>}

      <Paper sx={{ padding: 3, marginBottom: 3 }}>
        <Typography variant="h6" color="primary" gutterBottom>
          Batting: {battingTeam.name}
        </Typography>
        
        {/* DROPDOWNS ARE NOW UNLOCKED */}
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

        {/* DROPDOWN IS NOW UNLOCKED */}
        <TextField select fullWidth label="Bowler" value={bowler} onChange={(e) => setBowler(e.target.value)}>
          {bowlingTeam.players.map(p => (
            <MenuItem key={p.id} value={p.id}>{p.name} {p.isSpecial ? '(Special)' : ''}</MenuItem>
          ))}
        </TextField>
      </Paper>

      <Button variant="contained" color="success" size="large" fullWidth onClick={handleStartMatch}>
        Play Ball (Start Match)
      </Button>
    </Box>
  );
};

export default OpeningLineup;