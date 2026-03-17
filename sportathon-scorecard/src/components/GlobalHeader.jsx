import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { resetMatch } from '../features/matchSetup/matchSlice';
import { resetInnings } from '../features/liveScoring/inningsSlice';
import { resetEvents } from '../features/liveScoring/eventsSlice';

const GlobalHeader = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleConfirmReset = () => {
    dispatch(resetMatch());
    dispatch(resetInnings());
    dispatch(resetEvents());
    setOpenDialog(false);
    navigate('/');
  };

  return (
    <>
      <AppBar position="static" sx={{ backgroundColor: '#160cc9', mb: 3 }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight="bold" sx={{ color: '#fff' }}>
            🏆 Sportathon Scorer
          </Typography>
          <Button variant="outlined" color="white" onClick={() => setOpenDialog(true)}>
            Start New Match
          </Button>
        </Toolbar>
      </AppBar>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>⚠️ Warning: Reset Match?</DialogTitle>
        <DialogContent>
          Are you sure you want to exit and start a new match? This will result in the permanent loss of ALL data for the current match.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleConfirmReset}>
            Yes, Delete & Restart
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default GlobalHeader;