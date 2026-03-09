import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { updateTeamA, updateTeamB } from '../features/matchSetup/matchSlice';
import { Box, Button, TextField, Typography, Paper, Grid, MenuItem, Alert } from '@mui/material';

function PlayerRegistration() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    //pull the team data from store
    const {matchDetails, teamA, teamB} = useSelector((state)=> state.match);
    const {playersPerTeam, specialPlayersPerTeam} = matchDetails;

    //dynamically generate roaster based on store
    const generateInitialRoster = () => {
        return Array.from({length : playersPerTeam}, (_, index) => {
            const isSpecial = index < specialPlayersPerTeam;

            return {
                id : uuidv4(),
                name : '',
                gender : isSpecial ? 'Female' : 'Male',
                isSpecial : isSpecial
            }
        })
    }

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
    // Basic validation to ensure all names are filled out
    const isRosterAValid = rosterA.every(p => p.name.trim() !== '');
    const isRosterBValid = rosterB.every(p => p.name.trim() !== '');

    if (!isRosterAValid || !isRosterBValid) {
      setError('Please fill out all player names for both teams.');
      return;
    }

    // Dispatch the full rosters to Redux
    dispatch(updateTeamA({ players: rosterA }));
    dispatch(updateTeamB({ players: rosterB }));

    // Proceed to the Toss
    navigate('/toss');
  }

  const renderTeamForm = (teamName, roster, teamKey) => (
    <Paper sx={{ padding: 3, marginBottom: 4 }}>
      <Typography variant="h6" gutterBottom color="primary">
        {teamName || `Team ${teamKey}`} Roster
      </Typography>
      <Typography variant="body2" sx={{ marginBottom: 2, color: 'text.secondary' }}>
        * Player 1 is the designated Special Player (Female) who will bat and bowl the first over.
      </Typography>
      
      {roster.map((player, index) => (
        <Grid container spacing={2} key={player.id} sx={{ marginBottom: 2 }}>
          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              label={`Player ${index + 1} Name`}
              value={player.name}
              onChange={(e) => handlePlayerChange(teamKey, index, 'name', e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              label="Gender"
              value={player.gender}
              disabled // Locked to enforce your corporate rules
            >
              <MenuItem value="Female">Female (Special)</MenuItem>
              <MenuItem value="Male">Male</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      ))}
    </Paper>
  );

  return (
    <Box sx={{ padding: 4, maxWidth: 900, margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom>Player Registration</Typography>
      
      {error && <Alert severity="error" sx={{ marginBottom: 3 }}>{error}</Alert>}

      {renderTeamForm(teamA.name, rosterA, 'A')}
      {renderTeamForm(teamB.name, rosterB, 'B')}

      <Button variant="contained" color="success" size="large" fullWidth onClick={handleSaveRegistration}>
        Lock In Teams & Proceed to Toss
      </Button>
    </Box>
  )
}

export default PlayerRegistration