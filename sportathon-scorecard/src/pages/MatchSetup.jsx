import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setMatchDetails, updateTeamA, updateTeamB, resetMatch } from '../features/matchSetup/matchSlice';
import { resetInnings } from '../features/liveScoring/inningsSlice';
import { resetEvents } from '../features/liveScoring/eventsSlice';
import { Box, Button, TextField, Typography, Paper, Grid } from '@mui/material';

const MatchSetup = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Wipe the old match data from the persistent cache on load
  useEffect(() => {
    dispatch(resetMatch());
    dispatch(resetInnings());
    dispatch(resetEvents());
  }, [dispatch]);

  const [matchName, setMatchName] = useState('Sportathon Final');
  const [overs, setOvers] = useState(10);
  const [playersPerTeam, setPlayersPerTeam] = useState(5);
  const [specialPlayers, setSpecialPlayers] = useState(1);
  const [teamAName, setTeamAName] = useState('');
  const [teamBName, setTeamBName] = useState('');

  const handleSaveSetup = () => {
    dispatch(setMatchDetails({ 
      matchName, 
      totalOvers: overs, 
      playersPerTeam, 
      specialPlayersPerTeam: specialPlayers,
      date: new Date().toISOString() 
    }));
    
    dispatch(updateTeamA({ name: teamAName }));
    dispatch(updateTeamB({ name: teamBName }));

    navigate('/registration'); 
  };

  return (
    <Box sx={{ padding: 4, maxWidth: 800, margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom>Match Setup</Typography>
      
      <Paper sx={{ padding: 3, marginBottom: 3 }}>
        <Typography variant="h6" gutterBottom>Game Rules</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Match Name" value={matchName} onChange={(e) => setMatchName(e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth type="number" label="Total Overs" value={overs} onChange={(e) => setOvers(Number(e.target.value))} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth type="number" label="Total Players per Team" value={playersPerTeam} onChange={(e) => setPlayersPerTeam(Number(e.target.value))} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth type="number" label="Special Players per Team" value={specialPlayers} onChange={(e) => setSpecialPlayers(Number(e.target.value))} />
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ padding: 3, marginBottom: 3 }}>
        <Typography variant="h6" gutterBottom>Teams</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Team A Name" value={teamAName} onChange={(e) => setTeamAName(e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Team B Name" value={teamBName} onChange={(e) => setTeamBName(e.target.value)} />
          </Grid>
        </Grid>
      </Paper>

      <Button variant="contained" color="primary" size="large" fullWidth onClick={handleSaveSetup}>
        Proceed to Player Registration
      </Button>
    </Box>
  );
};

export default MatchSetup;