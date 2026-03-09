import React, {useState} from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom';
import { setMatchDetails, updateTeamA, updateTeamB } from '../features/matchSetup/matchSlice';
import { Box, Button, TextField, Typography, Paper, Grid } from '@mui/material';

function MatchSetup() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    //local state for forms
    const [matchName, setMatchName] = useState('Match');
    const [overs, setOvers] = useState(4);
    const [teamAName, setTeamAName] = useState('');
    const [teamBName, setTeamBName] = useState('');

    const handleSaveSetup = () => {
        //dispatch the core match details
        dispatch(setMatchDetails({matchName, totalOver : overs, date : new Date().toISOString() }))
        //dispatch only team name now. we will dispatch player details later
        dispatch(updateTeamA({name : teamAName}));
        dispatch(updateTeamB({name : teamBName}));
        navigate('/toss');
    }
 
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
  )
}

export default MatchSetup