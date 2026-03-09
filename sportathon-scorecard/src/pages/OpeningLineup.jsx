import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setInningsTeams, setActivePlayers } from '../features/liveScoring/inningsSlice';
import { startMatch } from '../features/matchSetup/matchSlice';
import { Box, Button, Typography, Paper, MenuItem, TextField, Alert } from '@mui/material';
//optional to log in console
import { store } from '../store/store';

const OpeningLineup = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { teamA, teamB, toss } = useSelector((state) => state.match);

  // Derive batting and bowling teams dynamically based on the toss
  const battingTeam = toss.decision === 'bat' 
    ? (toss.winner === teamA.id ? teamA : teamB) 
    : (toss.winner === teamA.id ? teamB : teamA);
    
  const bowlingTeam = battingTeam.id === teamA.id ? teamB : teamA;

  const [striker, setStriker] = useState('');
  const [nonStriker, setNonStriker] = useState('');
  const [bowler, setBowler] = useState('');
  const [error, setError] = useState('');

  // Auto-select the special players to enforce corporate rules
  useEffect(() => {
    const specialBatter = battingTeam.players.find(p => p.isSpecial);
    const specialBowler = bowlingTeam.players.find(p => p.isSpecial);
    
    if (specialBatter) setStriker(specialBatter.id);
    if (specialBowler) setBowler(specialBowler.id);
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

    // Save active teams and players to Redux
    dispatch(setInningsTeams({ battingTeamId: battingTeam.id, bowlingTeamId: bowlingTeam.id }));
    dispatch(setActivePlayers({ strikerId: striker, nonStrikerId: nonStriker, bowlerId: bowler }));
    dispatch(startMatch());

    // --- TEST LOG ---
    console.log("FINAL SETUP STATE:", store.getState());
    // ----------------

    // Navigate to the main scoring dashboard
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
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          * The Special Player is locked as the opening Striker.
        </Typography>
        
        <TextField select fullWidth label="Striker" value={striker} sx={{ mb: 2 }} disabled>
          {battingTeam.players.map(p => (
            <MenuItem key={p.id} value={p.id}>{p.name} {p.isSpecial ? '(Special)' : ''}</MenuItem>
          ))}
        </TextField>

        <TextField select fullWidth label="Non-Striker" value={nonStriker} onChange={(e) => setNonStriker(e.target.value)}>
          {battingTeam.players.map(p => (
             // Disable the special player from being selected as non-striker
            <MenuItem key={p.id} value={p.id} disabled={p.isSpecial}>
              {p.name}
            </MenuItem>
          ))}
        </TextField>
      </Paper>

      <Paper sx={{ padding: 3, marginBottom: 3 }}>
        <Typography variant="h6" color="secondary" gutterBottom>
          Bowling: {bowlingTeam.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          * The Special Player is locked as the opening Bowler.
        </Typography>

        <TextField select fullWidth label="Bowler" value={bowler} disabled>
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