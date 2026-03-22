import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { updateTeamA, updateTeamB } from '../features/matchSetup/matchSlice';
import { Box, Button, TextField, Typography, Paper, Grid, MenuItem, Alert, FormControlLabel, Switch } from '@mui/material';

const PlayerRegistration = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { matchDetails, teamA, teamB } = useSelector((state) => state.match);
  const { playersPerTeam, specialPlayersPerTeam } = matchDetails;

  const generateInitialRoster = () => {
    return Array.from({ length: playersPerTeam }, (_, index) => {
      const isSpecial = index < specialPlayersPerTeam; 
      return {
        id: uuidv4(),
        name: '',
        gender: isSpecial ? 'Female' : 'Male',
        isSpecial: isSpecial,
      };
    });
  };

  const [rosterA, setRosterA] = useState(generateInitialRoster());
  const [rosterB, setRosterB] = useState(generateInitialRoster());
  const [error, setError] = useState('');

  const handlePlayerChange = (team, index, field, value) => {
    if (team === 'A') {
      const newRoster = [...rosterA];
      newRoster[index][field] = value;
      setRosterA(newRoster);
    } else {
      const newRoster = [...rosterB];
      newRoster[index][field] = value;
      setRosterB(newRoster);
    }
  };

  const handleSaveRegistration = () => {
    const isRosterAValid = rosterA.every(p => p.name.trim() !== '');
    const isRosterBValid = rosterB.every(p => p.name.trim() !== '');

    if (!isRosterAValid || !isRosterBValid) {
      setError('Please fill out all player names for both teams.');
      return;
    }

    const specialCountA = rosterA.filter(p => p.isSpecial).length;
    const specialCountB = rosterB.filter(p => p.isSpecial).length;

    // THE FIX: Changed !== to < so it's a minimum requirement, not a hard limit!
    if (specialCountA < specialPlayersPerTeam || specialCountB < specialPlayersPerTeam) {
      setError(`Match rules require AT LEAST ${specialPlayersPerTeam} special player(s) per team. Team A has ${specialCountA}, Team B has ${specialCountB}.`);
      return;
    }

    dispatch(updateTeamA({ players: rosterA }));
    dispatch(updateTeamB({ players: rosterB }));

    navigate('/toss');
  };

  const renderTeamForm = (teamName, roster, teamKey) => (
    <Paper sx={{ padding: 3, marginBottom: 4 }}>
      <Typography variant="h6" gutterBottom color="primary">
        {teamName || `Team ${teamKey}`} Roster
      </Typography>
      
      {roster.map((player, index) => (
        <Grid container spacing={2} key={player.id} sx={{ marginBottom: 2, alignItems: 'center' }}>
          <Grid item xs={12} sm={5}>
            <TextField fullWidth label={`Player ${index + 1} Name`} value={player.name} onChange={(e) => handlePlayerChange(teamKey, index, 'name', e.target.value)} required />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField select fullWidth label="Gender" value={player.gender} onChange={(e) => handlePlayerChange(teamKey, index, 'gender', e.target.value)}>
              <MenuItem value="Female">Female</MenuItem>
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControlLabel
              control={<Switch checked={player.isSpecial} onChange={(e) => handlePlayerChange(teamKey, index, 'isSpecial', e.target.checked)} color="secondary" />}
              label="Special Player"
            />
          </Grid>
        </Grid>
      ))}
    </Paper>
  );

  return (
    <Box className="app-page">
      <Typography variant="h4" gutterBottom>Player Registration</Typography>
      {error && <Alert severity="error" sx={{ marginBottom: 3 }}>{error}</Alert>}
      {renderTeamForm(teamA.name, rosterA, 'A')}
      {renderTeamForm(teamB.name, rosterB, 'B')}
      <Button variant="contained" color="success" size="large" fullWidth onClick={handleSaveRegistration}>
        Lock In Teams & Proceed to Toss
      </Button>
    </Box>
  );
};

export default PlayerRegistration;