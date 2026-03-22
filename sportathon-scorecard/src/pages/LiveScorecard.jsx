import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import {
  Box,
  Button,
  Typography,
  Paper,
  Grid,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { recordDelivery, undoLastDelivery } from "../features/liveScoring/eventsSlice";
import {
  changeStrike,
  changeBatter,
  startNextOver,
  startNextInnings,
  changeCurrentBowler,
  setActivePlayers
} from "../features/liveScoring/inningsSlice";
import "./LiveScorecard.css";

const LiveScorecard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { matchDetails, specialRules, teamA, teamB } = useSelector(
    (state) => state.match,
  );
  const {
    battingTeamId,
    bowlingTeamId,
    strikerId,
    nonStrikerId,
    bowlerId,
    currentOver,
    currentInnings,
  } = useSelector((state) => state.innings);
  const { ballByBallHistory } = useSelector((state) => state.events);

  const battingTeam = teamA.id === battingTeamId ? teamA : teamB;
  const bowlingTeam = teamA.id === bowlingTeamId ? teamA : teamB;

  const striker = battingTeam?.players?.find((p) => p.id === strikerId);
  const nonStriker = battingTeam?.players?.find((p) => p.id === nonStrikerId);
  const bowler = bowlingTeam?.players?.find((p) => p.id === bowlerId);

  // Modals State
  const [wicketModalOpen, setWicketModalOpen] = useState(false);
  const [wicketType, setWicketType] = useState("bowled");
  const [playerOutId, setPlayerOutId] = useState("");
  const [nextBatterId, setNextBatterId] = useState("");
  const [runOutRuns, setRunOutRuns] = useState(0);

  const [endOfOverModalOpen, setEndOfOverModalOpen] = useState(false);
  const [nextBowlerId, setNextBowlerId] = useState("");

  const [extrasModalOpen, setExtrasModalOpen] = useState(false);
  const [extraType, setExtraType] = useState("wide");
  const [extraRuns, setExtraRuns] = useState(0);

  const [endOfInningsModalOpen, setEndOfInningsModalOpen] = useState(false);
  const [reviewingStats, setReviewingStats] = useState(false); // NEW: Hide dialog to review stats
  const [changeBowlerModalOpen, setChangeBowlerModalOpen] = useState(false); // NEW: Mid-over bowler change
  const [midOverBowlerId, setMidOverBowlerId] = useState("");

  const currentInningsEvents = ballByBallHistory.filter(
    (ball) => ball.innings === currentInnings,
  );

  const outPlayers = currentInningsEvents
    .filter(
      (ball) => ball.isWicket && ball.wicketDetails.type !== "retiredNotOut",
    )
    .map((ball) => ball.wicketDetails.playerOutId);

  const availableBatters =
    battingTeam?.players?.filter(
      (p) =>
        p.id !== strikerId &&
        p.id !== nonStrikerId &&
        !outPlayers.includes(p.id),
    ) || [];

  const getBowlerOvers = (id) => {
    const balls = currentInningsEvents.filter(
      (b) =>
        b.bowlerId === id &&
        b.isDelivery !== false &&
        (!b.extras.type ||
          b.extras.type === "bye" ||
          b.extras.type === "legBye"),
    ).length;
    return Math.floor(balls / (matchDetails.ballsPerOver || 6));
  };
  const availableBowlers =
    bowlingTeam?.players?.filter(
      (p) =>
        p.id !== bowlerId &&
        getBowlerOvers(p.id) < (matchDetails.bowlerOverLimit || 99),
    ) || [];

  const totalRuns = currentInningsEvents.reduce(
    (sum, ball) => sum + ball.totalRuns,
    0,
  );
  const totalWickets = currentInningsEvents.filter(
    (ball) => ball.isWicket && ball.wicketDetails.type !== "retiredNotOut",
  ).length;

  const actualDeliveries = currentInningsEvents.filter(
    (ball) => ball.isDelivery !== false,
  );
  const legalDeliveries = actualDeliveries.filter(
    (ball) =>
      !ball.extras.type ||
      ball.extras.type === "bye" ||
      ball.extras.type === "legBye",
  ).length;
  const displayOvers = `${Math.floor(legalDeliveries / (matchDetails.ballsPerOver || 6))}.${legalDeliveries % (matchDetails.ballsPerOver || 6)}`;

  const ballsPerOver = matchDetails?.ballsPerOver || 6;
  const completedOvers = Math.floor(legalDeliveries / ballsPerOver);
  const safeCurrentOver = currentOver || 0;
  const totalTargetOvers = matchDetails?.totalOvers || 10;

  // NEW: Full Over Timeline Extraction (Array of Arrays)
  const getAllOversTimeline = () => {
    const oversArray = [];
    let currentArray = [];
    let legals = 0;
    currentInningsEvents.forEach((ball) => {
      currentArray.push(ball);
      if (ball.isDelivery !== false) {
        if (
          !ball.extras.type ||
          ball.extras.type === "bye" ||
          ball.extras.type === "legBye"
        )
          legals++;
      }
      if (legals === ballsPerOver) {
        oversArray.push(currentArray);
        currentArray = [];
        legals = 0;
      }
    });
    if (currentArray.length > 0) oversArray.push(currentArray);
    return oversArray;
  };
  const allOversTimeline = getAllOversTimeline();

  let targetScore = null;
  let runsNeeded = null;
  let ballsRemaining = null;
  if (currentInnings === 2) {
    const firstInningsEvents = ballByBallHistory.filter(
      (ball) => ball.innings === 1,
    );
    targetScore =
      firstInningsEvents.reduce((sum, ball) => sum + ball.totalRuns, 0) + 1;
    runsNeeded = targetScore - totalRuns;
    ballsRemaining = totalTargetOvers * ballsPerOver - legalDeliveries;
  }

  const isAllOut = totalWickets >= (matchDetails?.playersPerTeam || 11) - 1;
  const isOversDone = completedOvers >= totalTargetOvers;
  const isTargetReached =
    currentInnings === 2 && targetScore !== null && totalRuns >= targetScore;
  const isInningsOver =
    isAllOut || (isOversDone && completedOvers > 0) || isTargetReached;

  useEffect(() => {
    if (reviewingStats) return; // Pause auto-popups if user is reviewing stats
    if (isAllOut || (isOversDone && completedOvers > 0) || isTargetReached) {
      setEndOfInningsModalOpen(true);
      setEndOfOverModalOpen(false);
    } else if (
      completedOvers > safeCurrentOver &&
      completedOvers < totalTargetOvers
    ) {
      setEndOfOverModalOpen(true);
    }
  }, [
    completedOvers,
    safeCurrentOver,
    totalTargetOvers,
    isAllOut,
    isOversDone,
    isTargetReached,
    reviewingStats,
  ]);

  const generateLiveStats = (eventsArray = currentInningsEvents) => {
    const batting = {};
    const bowling = {};
    eventsArray.forEach((ball) => {
      if (!batting[ball.strikerId])
        batting[ball.strikerId] = { runs: 0, balls: 0, fours: 0, sixes: 0 };
      if (!bowling[ball.bowlerId])
        bowling[ball.bowlerId] = { balls: 0, runsConceded: 0, wickets: 0 };

      if (ball.isDelivery !== false) {
        if (ball.extras.type !== "wide") batting[ball.strikerId].balls += 1;
        if (!ball.extras.type) {
          batting[ball.strikerId].runs += ball.totalRuns;
          if (ball.runsBat === 4) batting[ball.strikerId].fours += 1;
          if (ball.runsBat === 6) batting[ball.strikerId].sixes += 1;
        }
        if (ball.extras.type !== "wide" && ball.extras.type !== "noBall")
          bowling[ball.bowlerId].balls += 1;
        if (ball.extras.type !== "bye" && ball.extras.type !== "legBye")
          bowling[ball.bowlerId].runsConceded += ball.totalRuns;
      }
      if (
        ball.isWicket &&
        ball.wicketDetails.type !== "runOut" &&
        ball.wicketDetails.type !== "retiredNotOut"
      )
        bowling[ball.bowlerId].wickets += 1;
    });
    return { batting, bowling };
  };
  const liveStats = generateLiveStats();

  // NEW: Innings 1 Stats logic for rendering at the bottom
  const getInnings1Stats = () => {
    if (currentInnings !== 2) return null;
    const events1 = ballByBallHistory.filter((ball) => ball.innings === 1);
    if (events1.length === 0) return null;
    const t1Id = events1[0].strikerId;
    const batTeam1 = teamA.players.some((p) => p.id === t1Id) ? teamA : teamB;
    const bowlTeam1 = batTeam1.id === teamA.id ? teamB : teamA;
    const stats1 = generateLiveStats(events1);
    const runs1 = events1.reduce((sum, ball) => sum + ball.totalRuns, 0);
    const wkts1 = events1.filter(
      (ball) => ball.isWicket && ball.wicketDetails.type !== "retiredNotOut",
    ).length;
    return { batTeam1, bowlTeam1, stats1, runs1, wkts1 };
  };
  const innings1Data = getInnings1Stats();

  const handleScoreRuns = (runsBat) => {
    const multiplier = striker.isSpecial
      ? specialRules?.specialPlayerMultiplier || 2
      : 1;
    const finalRuns = runsBat * multiplier;
    dispatch(
      recordDelivery({
        id: uuidv4(),
        innings: currentInnings,
        overNumber: displayOvers,
        strikerId: striker.id,
        nonStrikerId: nonStriker.id,
        bowlerId: bowler.id,
        runsBat,
        multiplierApplied: multiplier,
        totalRuns: finalRuns,
        extras: { type: null, runs: 0 },
        isWicket: false,
        wicketDetails: null,
        isDelivery: true,
      }),
    );
    if (runsBat % 2 !== 0) dispatch(changeStrike());
  };

  const handleExtrasSubmit = () => {
    let totalPenalty = Number(extraRuns);
    if (extraType === "wide" || extraType === "noBall") totalPenalty += 1;
    dispatch(
      recordDelivery({
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
        isDelivery: true,
      }),
    );
    setExtrasModalOpen(false);
    setExtraRuns(0);
    if (Number(extraRuns) % 2 !== 0) dispatch(changeStrike());
  };

  const handleWicketSubmit = () => {
    const isLastWicket = availableBatters.length === 0;
    if (
      !playerOutId ||
      (!nextBatterId && !isLastWicket && wicketType !== "retiredNotOut")
    )
      return;

    const isRetirement = wicketType === "retiredNotOut";
    const addedRuns = wicketType === "runOut" ? Number(runOutRuns) : 0;
    const multiplier =
      striker.isSpecial && !isRetirement
        ? specialRules?.specialPlayerMultiplier || 2
        : 1;
    const finalRuns = addedRuns * multiplier;

    dispatch(
      recordDelivery({
        id: uuidv4(),
        innings: currentInnings,
        overNumber: displayOvers,
        strikerId: striker.id,
        nonStrikerId: nonStriker.id,
        bowlerId: bowler.id,
        runsBat: addedRuns,
        multiplierApplied: multiplier,
        totalRuns: finalRuns,
        extras: { type: null, runs: 0 },
        isWicket: true,
        wicketDetails: { type: wicketType, playerOutId: playerOutId },
        isDelivery: !isRetirement,
      }),
    );

    if (addedRuns > 0 && addedRuns % 2 !== 0) dispatch(changeStrike());

    if (!isLastWicket || isRetirement) {
      dispatch(
        changeBatter({ outBatterId: playerOutId, inBatterId: nextBatterId }),
      );
    }

    setWicketModalOpen(false);
    setPlayerOutId("");
    setNextBatterId("");
    setRunOutRuns(0);
    setWicketType("bowled");
  };

  const handleNextOverSubmit = () => {
    if (!nextBowlerId) return;
    dispatch(startNextOver({ nextBowlerId }));
    setEndOfOverModalOpen(false);
    setNextBowlerId("");
  };

  const handleMidOverBowlerChange = () => {
    if (!midOverBowlerId) return;
    dispatch(changeCurrentBowler({ newBowlerId: midOverBowlerId }));
    setChangeBowlerModalOpen(false);
    setMidOverBowlerId("");
  };

  const handleInningsComplete = () => {
    setEndOfInningsModalOpen(false);
    if (currentInnings === 1) {
      dispatch(startNextInnings());
      navigate("/opening-lineup");
    } else {
      navigate("/match-summary");
    }
  };

  // Helper for rendering ball avatars
  const renderBallAvatar = (ball, idx) => {
    let label = ball.totalRuns;
    let color = "#e0e0e0";
    let txt = "#000";
    if (
      ball.isDelivery === false &&
      ball.wicketDetails?.type === "retiredNotOut"
    ) {
      label = "RTD";
      color = "#757575";
      txt = "#fff";
    } else if (ball.isWicket) {
      if (ball.wicketDetails?.type === "runOut" && ball.runsBat > 0) {
        label = `${ball.runsBat}+W`;
        color = "#d32f2f";
        txt = "#fff";
      } else {
        label = "W";
        color = "#d32f2f";
        txt = "#fff";
      }
    } else if (ball.extras.type) {
      label = `${ball.totalRuns}${ball.extras.type[0].toUpperCase()}`;
      color = "#ed6c02";
      txt = "#fff";
    } else if (ball.runsBat === 4) {
      label = "4";
      color = "#0288d1";
      txt = "#fff";
    } else if (ball.runsBat === 6) {
      label = "6";
      color = "#9c27b0";
      txt = "#fff";
    } else if (ball.totalRuns === 0) {
      label = "0";
      color = "#9e9e9e";
      txt = "#fff";
    }
    return (
      <Avatar
        key={idx}
        className="lsc-ball-chip"
        sx={{ bgcolor: color, color: txt }}
      >
        {label}
      </Avatar>
    );
  };

  if (!striker || !bowler) {
    return (
      <Box component="main" className="live-scorecard">
        <div className="lsc-loading">
          <Typography>Loading Match Data...</Typography>
        </div>
      </Box>
    );
  }

  const handleUndoLastDelivery = () => {
    if (currentInningsEvents.length === 0) return; // Prevent undoing if no balls have been bowled

    // Grab the exact delivery we are about to erase
    const lastEvent = currentInningsEvents[currentInningsEvents.length - 1];

    // Remove it from the Redux ledger
    dispatch(undoLastDelivery());

    // Restore the exact striker, non-striker, and bowler from before that ball was bowled
    dispatch(setActivePlayers({
      strikerId: lastEvent.strikerId,
      nonStrikerId: lastEvent.nonStrikerId,
      bowlerId: lastEvent.bowlerId
    }));
  };

  return (
    <Box component="main" className="live-scorecard">
      {/* Floating Review Resume Button */}
      {reviewingStats && (
        <Box sx={{ position: "fixed", bottom: 20, right: 20, zIndex: 9999 }}>
          <Button
            variant="contained"
            color="secondary"
            size="large"
            onClick={() => {
              setReviewingStats(false);
              setEndOfInningsModalOpen(true);
            }}
            sx={{
              boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
              borderRadius: "30px",
              px: 4,
            }}
          >
            Resume{" "}
            {currentInnings === 1 ? "Innings Transition" : "Match Completion"}
          </Button>
        </Box>
      )}

      <div className="lsc-inner">
        <Paper className="lsc-hero" elevation={0}>
          <div className="lsc-hero-layout">
            <div className="lsc-hero-main">
              <div className="lsc-hero-top">
                <span className="lsc-live-pill" aria-live="polite">
                  Live
                </span>
                {matchDetails?.date && (
                  <span className="lsc-match-meta">
                    {new Date(matchDetails.date).toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                )}
              </div>
              {matchDetails?.matchName && (
                <Typography variant="h5" component="h1" className="lsc-hero-title">
                  {matchDetails.matchName}
                </Typography>
              )}
              <Typography variant="subtitle1" className="lsc-hero-sub">
                {battingTeam.name} · Innings {currentInnings}
              </Typography>
              <div className="lsc-score-row">
                <Typography
                  component="span"
                  variant="h2"
                  className="lsc-score-main"
                >
                  {totalRuns}
                </Typography>
                <Typography component="span" variant="h2" className="lsc-score-sep">
                  —
                </Typography>
                <Typography
                  component="span"
                  variant="h2"
                  className="lsc-score-main"
                >
                  {totalWickets}
                </Typography>
              </div>
              <Typography variant="h6" className="lsc-overs-line">
                Overs {displayOvers} / {totalTargetOvers}
              </Typography>
              {currentInnings === 2 && targetScore && (
                <Typography
                  variant="h6"
                  component="div"
                  className="lsc-target-banner"
                >
                  Target {targetScore} · Need {Math.max(0, runsNeeded)} from{" "}
                  {ballsRemaining} balls
                </Typography>
              )}
            </div>

            <div className="lsc-players-row">
              <Paper className="lsc-player-card" elevation={0}>
                <Typography
                  variant="h6"
                  className="lsc-card-head lsc-card-head--bat"
                >
                  Batters
                </Typography>
                <Divider sx={{ my: 1, borderColor: "rgba(255,255,255,0.08)" }} />
                <Box className="lsc-stat-line lsc-stat-line--striker">
                  <Typography variant="body1" className="lsc-name">
                    <span className="lsc-strike" aria-hidden>
                      ▶
                    </span>
                    {striker.name} {striker.isSpecial ? "(S)" : ""}
                  </Typography>
                  <Typography variant="body1" className="lsc-fig">
                    {liveStats.batting[striker.id]?.runs || 0} (
                    {liveStats.batting[striker.id]?.balls || 0})
                  </Typography>
                </Box>
                <Box className="lsc-stat-line">
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    className="lsc-name"
                  >
                    &nbsp;&nbsp;&nbsp;{nonStriker.name}{" "}
                    {nonStriker.isSpecial ? "(S)" : ""}
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    className="lsc-fig"
                  >
                    {liveStats.batting[nonStriker.id]?.runs || 0} (
                    {liveStats.batting[nonStriker.id]?.balls || 0})
                  </Typography>
                </Box>
              </Paper>
              <Paper
                className="lsc-player-card lsc-player-card--bowler"
                elevation={0}
                sx={{ position: "relative" }}
              >
                <Typography
                  variant="h6"
                  className="lsc-card-head lsc-card-head--bowl"
                >
                  Bowler
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    color: "#ccc",
                    borderColor: "#555",
                  }}
                  onClick={() => setChangeBowlerModalOpen(true)}
                >
                  Change
                </Button>
                <Divider
                  sx={{ my: 0.5, borderColor: "rgba(255,255,255,0.08)" }}
                />
                <Box className="lsc-stat-line">
                  <Typography
                    variant="body1"
                    fontWeight="bold"
                    className="lsc-name"
                  >
                    {bowler.name} {bowler.isSpecial ? "(S)" : ""}
                  </Typography>
                  <Typography variant="body1" className="lsc-fig">
                    {liveStats.bowling[bowler.id]?.wickets || 0} —{" "}
                    {liveStats.bowling[bowler.id]?.runsConceded || 0}
                  </Typography>
                </Box>
              </Paper>
            </div>
          </div>
        </Paper>

        <div className="lsc-controls-over-row">
        <Paper className="lsc-controls" elevation={0}>
          <Typography variant="h6" gutterBottom className="lsc-controls-title">
            Score runs
          </Typography>
          <Grid container spacing={1} className="lsc-run-grid">
            {[0, 1, 2, 3, 4, 6].map((run) => (
              <Grid item xs={4} sm={2} key={run}>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={() => handleScoreRuns(run)}
                  className={`lsc-run-btn${run === 4 ? " lsc-run-btn--four" : ""}${run === 6 ? " lsc-run-btn--six" : ""}`}
                  disabled={isInningsOver}
                >
                  {run}
                </Button>
              </Grid>
            ))}
          </Grid>
          <Divider className="lsc-divider-gold" />
          <Grid container spacing={2} className="lsc-actions-grid">
            <Grid item xs={6} sm={3}>
              <Button
                variant="outlined"
                color="warning"
                fullWidth
                className="lsc-action-btn"
                onClick={() => dispatch(changeStrike())}
                disabled={isInningsOver}
              >
                Swap
              </Button>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Button
                variant="outlined"
                color="info"
                fullWidth
                className="lsc-action-btn"
                onClick={() => setExtrasModalOpen(true)}
                disabled={isInningsOver}
              >
                Extra
              </Button>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Button
                variant="outlined"
                color="success"
                fullWidth
                className="lsc-action-btn"
                onClick={() => {
                  setWicketType("retiredNotOut");
                  setPlayerOutId(striker.id);
                  setWicketModalOpen(true);
                }}
                disabled={isInningsOver}
              >
                Retire
              </Button>
            </Grid>
            <Grid item xs={6} sm={3}>
            <Button 
              variant="outlined" 
              color="inherit" 
              fullWidth 
              className="lsc-action-btn"
              onClick={handleUndoLastDelivery}
              disabled={isInningsOver || currentInningsEvents.length === 0}
              sx={{ borderColor: 'rgba(255,255,255,0.3)', color: '#aaa' }}
            >
              ⎌ Undo Last Delivery
            </Button>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Button
                variant="contained"
                color="error"
                fullWidth
                className="lsc-action-btn"
                onClick={() => {
                  setWicketType("bowled");
                  setRunOutRuns(0);
                  setPlayerOutId(striker.id);
                  setWicketModalOpen(true);
                }}
                disabled={isInningsOver}
              >
                Wicket
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* OVER HISTORY TIMELINE — right column on laptop */}
        <Paper
          className="lsc-over-panel"
          elevation={0}
          sx={{ maxHeight: { xs: "220px", md: "min(360px, 55vh)" }, overflowY: "auto" }}
        >
          <Typography
            variant="subtitle2"
            className="lsc-over-label"
            sx={{ mb: 1 }}
          >
            Full Over History
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {allOversTimeline.map((overArray, overIdx) => (
              <Box
                key={overIdx}
                sx={{ display: "flex", alignItems: "center", gap: 2 }}
              >
                <Typography
                  variant="body2"
                  sx={{ fontWeight: "bold", minWidth: "40px", color: "#888" }}
                >
                  Ov {overIdx + 1}
                </Typography>
                <Box
                  className="lsc-ball-strip"
                  sx={{ flexGrow: 1, minHeight: "unset", pb: 1 }}
                >
                  {overArray.map((ball, idx) => renderBallAvatar(ball, idx))}
                </Box>
              </Box>
            ))}
            {allOversTimeline.length === 0 && (
              <Typography variant="body2" className="lsc-waiting">
                Waiting for first delivery…
              </Typography>
            )}
          </Box>
        </Paper>
        </div>

        <Typography variant="h6" className="lsc-table-section-title">
          Innings {currentInnings} Batting
        </Typography>
        <TableContainer
          component={Paper}
          className="lsc-table-wrap"
          elevation={0}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Batter</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>R</TableCell>
                <TableCell>B</TableCell>
                <TableCell>4s</TableCell>
                <TableCell>6s</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {battingTeam.players.map((p) => {
                const s = liveStats.batting[p.id];
                // Only show if they batted OR are currently on pitch
                if (!s && p.id !== strikerId && p.id !== nonStrikerId)
                  return null;

                const isActive = p.id === strikerId || p.id === nonStrikerId;
                const nameStr = `${p.name} ${p.isSpecial ? "(S)" : ""}${isActive ? " *" : ""}`;

                let status = 'not out';
                const playerWicketEvents = currentInningsEvents.filter(ball => ball.isWicket && ball.wicketDetails?.playerOutId === p.id);
                
                if (playerWicketEvents.length > 0) {
                  const latestOutEvent = playerWicketEvents[playerWicketEvents.length - 1];
                  status = latestOutEvent.wicketDetails.type === 'retiredNotOut' ? 'rtd' : 'out';
                }

                return (
                  <TableRow key={p.id}>
                    <TableCell
                      sx={{
                        fontWeight: isActive ? "bold" : "normal",
                        color: isActive ? "#fff" : "inherit",
                      }}
                    >
                      {nameStr}
                    </TableCell>
                    <TableCell
                      sx={{
                        color:
                          status === "out"
                            ? "#ff5252"
                            : status === "rtd"
                              ? "#aaa"
                              : "#4caf50",
                      }}
                    >
                      {status}
                    </TableCell>
                    <TableCell>{s?.runs || 0}</TableCell>
                    <TableCell>{s?.balls || 0}</TableCell>
                    <TableCell>{s?.fours || 0}</TableCell>
                    <TableCell>{s?.sixes || 0}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <Typography variant="h6" className="lsc-table-section-title">
          Innings {currentInnings} Bowling
        </Typography>
        <TableContainer
          component={Paper}
          className="lsc-table-wrap"
          elevation={0}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Bowler</TableCell>
                <TableCell>O</TableCell>
                <TableCell>R</TableCell>
                <TableCell>W</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(liveStats.bowling).map(([id, s]) => {
                const p = bowlingTeam.players.find((pl) => pl.id === id);
                return p ? (
                  <TableRow key={id}>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>
                      {Math.floor(s.balls / ballsPerOver)}.
                      {s.balls % ballsPerOver}
                    </TableCell>
                    <TableCell>{s.runsConceded}</TableCell>
                    <TableCell>{s.wickets}</TableCell>
                  </TableRow>
                ) : null;
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* NEW: Innings 1 Summary Rendered in 2nd Innings */}
        {innings1Data && (
          <>
            <Typography
              variant="h5"
              sx={{ mt: 5, mb: 1, color: "#aaa", textAlign: "center" }}
            >
              --- 1st Innings Summary ({innings1Data.runs1}/{innings1Data.wkts1}
              ) ---
            </Typography>
            <TableContainer
              component={Paper}
              className="lsc-table-wrap"
              elevation={0}
              sx={{ opacity: 0.8 }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Batter</TableCell>
                    <TableCell>R</TableCell>
                    <TableCell>B</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(innings1Data.stats1.batting).map(
                    ([id, s]) => {
                      const p = innings1Data.batTeam1.players.find(
                        (pl) => pl.id === id,
                      );
                      return p ? (
                        <TableRow key={id}>
                          <TableCell>{p.name}</TableCell>
                          <TableCell>{s.runs}</TableCell>
                          <TableCell>{s.balls}</TableCell>
                        </TableRow>
                      ) : null;
                    },
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TableContainer
              component={Paper}
              className="lsc-table-wrap"
              elevation={0}
              sx={{ opacity: 0.8 }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Bowler</TableCell>
                    <TableCell>O</TableCell>
                    <TableCell>R</TableCell>
                    <TableCell>W</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(innings1Data.stats1.bowling).map(
                    ([id, s]) => {
                      const p = innings1Data.bowlTeam1.players.find(
                        (pl) => pl.id === id,
                      );
                      return p ? (
                        <TableRow key={id}>
                          <TableCell>{p.name}</TableCell>
                          <TableCell>
                            {Math.floor(s.balls / ballsPerOver)}.
                            {s.balls % ballsPerOver}
                          </TableCell>
                          <TableCell>{s.runsConceded}</TableCell>
                          <TableCell>{s.wickets}</TableCell>
                        </TableRow>
                      ) : null;
                    },
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </div>

      {/* MODALS */}
      <Dialog
        open={wicketModalOpen}
        onClose={() => setWicketModalOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ className: "lsc-dialog-paper" }}
      >
        <DialogTitle>
          {wicketType === "retiredNotOut" ? "Retire Batsman" : "Record Wicket"}
        </DialogTitle>
        <DialogContent>
          {wicketType !== "retiredNotOut" && (
            <TextField
              select
              fullWidth
              label="Wicket Type"
              value={wicketType}
              onChange={(e) => setWicketType(e.target.value)}
              sx={{ mt: 2, mb: 2 }}
            >
              <MenuItem value="bowled">Bowled</MenuItem>
              <MenuItem value="caught">Caught</MenuItem>
              <MenuItem value="runOut">Run Out (Run + Wicket)</MenuItem>
              <MenuItem value="stumped">Stumped</MenuItem>
            </TextField>
          )}

          {wicketType === "runOut" && (
            <TextField
              fullWidth
              type="number"
              label="Runs Completed Before Wicket"
              value={runOutRuns}
              onChange={(e) => setRunOutRuns(e.target.value)}
              sx={{ mb: 2 }}
              helperText="If they ran 1 and got out on the 2nd, enter 1."
            />
          )}

          <TextField
            select
            fullWidth
            label={
              wicketType === "retiredNotOut"
                ? "Who is Retiring?"
                : "Who is Out?"
            }
            value={playerOutId}
            onChange={(e) => setPlayerOutId(e.target.value)}
            sx={{ mb: 2, mt: wicketType === "retiredNotOut" ? 2 : 0 }}
          >
            <MenuItem value={striker.id}>{striker.name} (Striker)</MenuItem>
            <MenuItem value={nonStriker.id}>
              {nonStriker.name} (Non-Striker)
            </MenuItem>
          </TextField>

          {availableBatters.length > 0 ? (
            <TextField
              select
              fullWidth
              label="Next Batter"
              value={nextBatterId}
              onChange={(e) => setNextBatterId(e.target.value)}
            >
              {availableBatters.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name} {p.isSpecial ? "(Special)" : ""}
                </MenuItem>
              ))}
            </TextField>
          ) : (
            <Typography color="error" sx={{ mt: 2, fontWeight: "bold" }}>
              Final wicket! Team will be all out.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWicketModalOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleWicketSubmit}
            disabled={
              !playerOutId || (!nextBatterId && availableBatters.length > 0)
            }
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={extrasModalOpen}
        onClose={() => setExtrasModalOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ className: "lsc-dialog-paper" }}
      >
        <DialogTitle>Record Extras</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="Extra Type"
            value={extraType}
            onChange={(e) => setExtraType(e.target.value)}
            sx={{ mt: 2, mb: 2 }}
          >
            <MenuItem value="wide">Wide</MenuItem>
            <MenuItem value="noBall">No Ball</MenuItem>
            <MenuItem value="bye">Bye</MenuItem>
            <MenuItem value="legBye">Leg Bye</MenuItem>
          </TextField>
          <TextField
            fullWidth
            type="number"
            label="Additional Runs Run"
            value={extraRuns}
            onChange={(e) => setExtraRuns(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExtrasModalOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleExtrasSubmit}
          >
            Confirm Extra
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={endOfOverModalOpen && !endOfInningsModalOpen && !reviewingStats}
        disableEscapeKeyDown
        fullWidth
        maxWidth="sm"
        PaperProps={{ className: "lsc-dialog-paper" }}
      >
        <DialogTitle>Over Complete</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mt: 1, mb: 3 }}>
            Select the next bowler.
          </Typography>
          {availableBowlers.length > 0 ? (
            <TextField
              select
              fullWidth
              label="Next Bowler"
              value={nextBowlerId}
              onChange={(e) => setNextBowlerId(e.target.value)}
            >
              {availableBowlers.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name} {p.isSpecial ? "(Special)" : ""}
                </MenuItem>
              ))}
            </TextField>
          ) : (
            <Typography color="error" fontWeight="bold">
              Error: All available bowlers have reached their max limit!
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            color="primary"
            onClick={handleNextOverSubmit}
            disabled={!nextBowlerId}
          >
            Start Next Over
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={changeBowlerModalOpen}
        onClose={() => setChangeBowlerModalOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ className: "lsc-dialog-paper" }}
      >
        <DialogTitle>Change Bowler Mid-Over</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, mt: 1 }}>
            Select a new bowler to finish the current over.
          </Typography>
          <TextField
            select
            fullWidth
            label="New Bowler"
            value={midOverBowlerId}
            onChange={(e) => setMidOverBowlerId(e.target.value)}
          >
            {availableBowlers.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name} {p.isSpecial ? "(Special)" : ""}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangeBowlerModalOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleMidOverBowlerChange}
            disabled={!midOverBowlerId}
          >
            Change Bowler
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={endOfInningsModalOpen}
        disableEscapeKeyDown
        fullWidth
        maxWidth="sm"
        PaperProps={{ className: "lsc-dialog-paper" }}
      >
        <DialogTitle>
          {currentInnings === 1 ? "Innings Complete!" : "Match Complete!"}
        </DialogTitle>
        <DialogContent>
          <Typography variant="h5" align="center" sx={{ mt: 2, mb: 2 }}>
            Final Score: {totalRuns} - {totalWickets}
          </Typography>
          <Typography variant="body1" align="center" color="text.secondary">
            {currentInnings === 1
              ? isAllOut
                ? "The team has been bowled out."
                : "All assigned overs have been bowled."
              : isTargetReached
                ? `${battingTeam.name} wins the match!`
                : totalRuns === targetScore - 1
                  ? "Match Tied!"
                  : `${bowlingTeam.name} wins the match!`}
          </Typography>
        </DialogContent>
        <DialogActions
          sx={{ justifyContent: "center", pb: 3, flexWrap: "wrap", gap: 1 }}
        >
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => {
              setEndOfInningsModalOpen(false);
              setReviewingStats(true);
            }}
          >
            Review Stats
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleInningsComplete}
          >
            {currentInnings === 1 ? "Start 2nd Innings" : "View Match Summary"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LiveScorecard;
