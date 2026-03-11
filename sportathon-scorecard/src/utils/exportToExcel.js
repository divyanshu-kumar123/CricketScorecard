import ExcelJS from 'exceljs';

export const generateExcelScorecard = async (matchDetails, ballByBallHistory, teamA, teamB) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sportathon Scorecard App';
  workbook.created = new Date();

  const getPlayerName = (id) => {
    const playerA = teamA.players.find(p => p.id === id);
    if (playerA) return playerA.name;
    const playerB = teamB.players.find(p => p.id === id);
    return playerB ? playerB.name : 'Unknown';
  };

  // --- Quick Math for Summary ---
  const getInningsTotal = (inningsNumber) => {
    const events = ballByBallHistory.filter(ball => ball.innings === inningsNumber);
    const runs = events.reduce((sum, ball) => sum + ball.totalRuns, 0);
    const wickets = events.filter(ball => ball.isWicket).length;
    const balls = events.filter(ball => !ball.extras.type || ball.extras.type === 'bye' || ball.extras.type === 'legBye').length;
    const overs = `${Math.floor(balls / (matchDetails.ballsPerOver || 6))}.${balls % (matchDetails.ballsPerOver || 6)}`;
    return { runs, wickets, overs };
  };

  const in1 = getInningsTotal(1);
  const in2 = getInningsTotal(2);

  // --- SHEET 1: MATCH OVERVIEW ---
  const overviewSheet = workbook.addWorksheet('Match Overview');
  overviewSheet.columns = [
    { header: 'Match Detail', key: 'detail', width: 25 },
    { header: 'Data', key: 'data', width: 40 },
  ];
  
  // Add Match Details
  overviewSheet.addRow({ detail: 'Match Name', data: matchDetails.matchName });
  overviewSheet.addRow({ detail: 'Date', data: new Date(matchDetails.date).toLocaleDateString() });
  overviewSheet.addRow({ detail: 'Total Overs', data: matchDetails.totalOvers });
  overviewSheet.addRow({ detail: 'Team A', data: teamA.name });
  overviewSheet.addRow({ detail: 'Team B', data: teamB.name });
  overviewSheet.addRow({}); // Blank row for spacing
  
  // Add Final Score Summary directly to the first page!
  overviewSheet.addRow({ detail: '--- FINAL SCORES ---', data: '' });
  overviewSheet.addRow({ detail: 'Innings 1', data: `${in1.runs} / ${in1.wickets} (in ${in1.overs} overs)` });
  overviewSheet.addRow({ detail: 'Innings 2', data: `${in2.runs} / ${in2.wickets} (in ${in2.overs} overs)` });
  
  // Style the first column to be bold
  overviewSheet.getColumn(1).font = { bold: true };
  overviewSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

  // --- SHEETS 2 & 3: BALL-BY-BALL LEDGERS ---
  const createInningsSheet = (inningsNumber, sheetName) => {
    const sheet = workbook.addWorksheet(sheetName);
    
    sheet.columns = [
      { header: 'Over', key: 'overNumber', width: 10 },
      { header: 'Striker', key: 'striker', width: 20 },
      { header: 'Bowler', key: 'bowler', width: 20 },
      { header: 'Runs (Bat)', key: 'runsBat', width: 15 },
      { header: 'Multiplier', key: 'multiplier', width: 12 },
      { header: 'Extras', key: 'extras', width: 15 },
      { header: 'Total Runs', key: 'totalRuns', width: 15 },
      { header: 'Wicket?', key: 'isWicket', width: 12 },
      { header: 'Wicket Details', key: 'wicketDetails', width: 30 },
    ];

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

    const inningsEvents = ballByBallHistory.filter(ball => ball.innings === inningsNumber);

    inningsEvents.forEach(ball => {
      let extrasText = 'None';
      if (ball.extras.type) extrasText = `${ball.extras.type} (${ball.extras.runs})`;

      let wicketText = 'N/A';
      if (ball.isWicket && ball.wicketDetails) {
        wicketText = `${ball.wicketDetails.type} (${getPlayerName(ball.wicketDetails.playerOutId)})`;
      }

      sheet.addRow({
        overNumber: ball.overNumber,
        striker: getPlayerName(ball.strikerId),
        bowler: getPlayerName(ball.bowlerId),
        runsBat: ball.runsBat,
        multiplier: `${ball.multiplierApplied}x`,
        extras: extrasText,
        totalRuns: ball.totalRuns,
        isWicket: ball.isWicket ? 'Yes' : 'No',
        wicketDetails: wicketText
      });
    });
  };

  const hasInnings1 = ballByBallHistory.some(b => b.innings === 1);
  const hasInnings2 = ballByBallHistory.some(b => b.innings === 2);

  if (hasInnings1) createInningsSheet(1, 'Innings 1 Ledger');
  if (hasInnings2) createInningsSheet(2, 'Innings 2 Ledger');

  // --- EXPORT TO BROWSER ---
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${matchDetails.matchName.replace(/\s+/g, '_')}_Official_Scorecard.xlsx`;
  document.body.appendChild(a);
  a.click();
  
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};