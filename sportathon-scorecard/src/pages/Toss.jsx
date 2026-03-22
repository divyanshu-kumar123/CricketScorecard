import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setTossResult } from '../features/matchSetup/matchSlice';
import { Box, Button, Typography, Paper, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel, Alert } from '@mui/material';

const Toss = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { teamA, teamB } = useSelector((state) => state.match);

  const [tossWinner, setTossWinner] = useState('');
  const [decision, setDecision] = useState('');
  const [error, setError] = useState('');

  const handleRandomToss = () => {
    // Generate a clean string to perfectly match the Radio values
    const winner = Math.random() < 0.5 ? 'teamA' : 'teamB';
    setTossWinner(winner);
    setError('');
  };

  const handleSaveToss = () => {
    if (!tossWinner || !decision) {
      setError('Please select both a toss winner and their decision.');
      return;
    }

    // Map the strict string back to the actual team ID for Redux
    const winningTeamId = tossWinner === 'teamA' ? teamA.id : teamB.id;

    dispatch(setTossResult({ 
      winner: winningTeamId, 
      decision: decision 
    }));

    navigate('/opening-lineup');
  };

  return (
    <Box className="app-page app-page--narrow" sx={{ textAlign: 'center' }}>
      <Typography variant="h4" gutterBottom>The Toss</Typography>

      {error && <Alert severity="error" sx={{ marginBottom: 3 }}>{error}</Alert>}

      <Paper sx={{ padding: 4, marginBottom: 4 }}>
        <Button 
          variant="outlined" 
          color="secondary" 
          size="large" 
          onClick={handleRandomToss}
          sx={{ marginBottom: 4 }}
        >
          Flip Digital Coin
        </Button>

        <Typography variant="body1" sx={{ marginBottom: 2, color: 'text.secondary' }}>
          - OR SELECT MANUALLY -
        </Typography>

        <FormControl component="fieldset" sx={{ width: '100%', textAlign: 'left', marginBottom: 3 }}>
          <FormLabel component="legend" sx={{ fontWeight: 'bold', marginBottom: 1 }}>Who won the toss?</FormLabel>
          <RadioGroup 
            name="toss-winner-group"
            value={tossWinner} 
            onChange={(e) => setTossWinner(e.target.value)}
          >
            <FormControlLabel value="teamA" control={<Radio />} label={teamA.name || 'Team A'} />
            <FormControlLabel value="teamB" control={<Radio />} label={teamB.name || 'Team B'} />
          </RadioGroup>
        </FormControl>

        {tossWinner && (
          <FormControl component="fieldset" sx={{ width: '100%', textAlign: 'left' }}>
            <FormLabel component="legend" sx={{ fontWeight: 'bold', marginBottom: 1 }}>What is their decision?</FormLabel>
            <RadioGroup 
              row 
              name="toss-decision-group"
              value={decision} 
              onChange={(e) => setDecision(e.target.value)}
            >
              <FormControlLabel value="bat" control={<Radio />} label="Bat First" />
              <FormControlLabel value="bowl" control={<Radio />} label="Bowl First" />
            </RadioGroup>
          </FormControl>
        )}
      </Paper>

      <Button variant="contained" color="success" size="large" fullWidth onClick={handleSaveToss}>
        Confirm Toss & Set Opening Lineup
      </Button>
    </Box>
  );
};

export default Toss;