// ── TEAMS ───────────────────────────────────────────────────
const TEAMS = [
  { id: 1,  player1: "Olivia",   player2: "Noah"     },
  { id: 2,  player1: "Calvin",   player2: "Féde"     },
  { id: 3,  player1: "Valentin", player2: "Nicolas"  },
  { id: 4,  player1: "Mischa",   player2: "Armin"    },
  { id: 5,  player1: "Maja",     player2: "Roland"   },
  { id: 6,  player1: "Annina",   player2: "Beda"     },
  { id: 7,  player1: "Elia",     player2: "Luis"     },
  { id: 8,  player1: "Alan",     player2: "Dino"     },
  { id: 9,  player1: "Silvan",   player2: "Lukas"    },
  { id: 10, player1: "Valentina",player2: "Filiz"    },
  { id: 11, player1: "Moritz",   player2: "Dave"     },
  { id: 12, player1: "Sophie",   player2: "Lucy"     },
  { id: 13, player1: "Roxane",   player2: "David S." },
  { id: 14, player1: "Eli",      player2: "Pascal"   },
  { id: 15, player1: "Lorenzo",  player2: "Bianca"   },
];

// ── TEAM NAMES (custom, loaded from Firebase) ────────────────
let teamNamesCache = {};

function getAutoName(team) {
  const p1 = (team.player1 || '').substring(0, 2);
  const p2 = (team.player2 || '').substring(0, 2);
  return p1 + p2;
}

function getTeamDisplayName(id) {
  const team = getTeam(id);
  if (!team) return `Team ${id}`;
  return teamNamesCache[id] || getAutoName(team);
}

// Returns "TeamName (Player1 & Player2)" with players in small tag
function getTeamFullDisplay(id) {
  const team = getTeam(id);
  if (!team) return `Team ${id}`;
  const name = getTeamDisplayName(id);
  return `${name} <small style="opacity:.6;font-weight:400">(${team.player1} &amp; ${team.player2})</small>`;
}

// ── SCHEDULE ────────────────────────────────────────────────
// 45 games, each team plays exactly 6 games.
// Fields: BV1 (Beach Volleyball, always), BV2 (Beach Volleyball, 50% / slots 1-7),
//         SPK1 & SPK2 (Spikeball, always).
// Time slots: 14:00–18:40 in 20-minute steps.
// Sport mix: ~22 volleyball, ~23 spikeball.

const GAMES = [
  // ── Slot 1 · 14:00 ──────────────────────────────────────
  { id: "g01", time: "14:00", field: "BV1",  sport: "volleyball", team1: 2,  team2: 15 },
  { id: "g02", time: "14:00", field: "BV2",  sport: "volleyball", team1: 4,  team2: 13 },
  { id: "g03", time: "14:00", field: "SPK1", sport: "spikeball",  team1: 3,  team2: 14 },

  // ── Slot 2 · 14:20 ──────────────────────────────────────
  { id: "g04", time: "14:20", field: "BV1",  sport: "volleyball", team1: 5,  team2: 12 },
  { id: "g05", time: "14:20", field: "BV2",  sport: "volleyball", team1: 7,  team2: 10 },
  { id: "g06", time: "14:20", field: "SPK1", sport: "spikeball",  team1: 6,  team2: 11 },

  // ── Slot 3 · 14:40 ──────────────────────────────────────
  { id: "g07", time: "14:40", field: "BV1",  sport: "volleyball", team1: 8,  team2: 9  },
  { id: "g08", time: "14:40", field: "BV2",  sport: "volleyball", team1: 2,  team2: 13 },
  { id: "g09", time: "14:40", field: "SPK1", sport: "spikeball",  team1: 1,  team2: 14 },

  // ── Slot 4 · 15:00 ──────────────────────────────────────
  { id: "g10", time: "15:00", field: "BV1",  sport: "volleyball", team1: 3,  team2: 12 },
  { id: "g11", time: "15:00", field: "BV2",  sport: "volleyball", team1: 5,  team2: 10 },
  { id: "g12", time: "15:00", field: "SPK1", sport: "spikeball",  team1: 4,  team2: 11 },

  // ── Slot 5 · 15:20 ──────────────────────────────────────
  { id: "g13", time: "15:20", field: "BV1",  sport: "volleyball", team1: 6,  team2: 9  },
  { id: "g14", time: "15:20", field: "BV2",  sport: "volleyball", team1: 15, team2: 13 },
  { id: "g15", time: "15:20", field: "SPK1", sport: "spikeball",  team1: 7,  team2: 8  },

  // ── Slot 6 · 15:40 ──────────────────────────────────────
  { id: "g16", time: "15:40", field: "BV1",  sport: "volleyball", team1: 1,  team2: 12 },
  { id: "g17", time: "15:40", field: "BV2",  sport: "volleyball", team1: 3,  team2: 10 },
  { id: "g18", time: "15:40", field: "SPK1", sport: "spikeball",  team1: 2,  team2: 11 },

  // ── Slot 7 · 16:00 ──────────────────────────────────────
  { id: "g19", time: "16:00", field: "BV1",  sport: "volleyball", team1: 4,  team2: 9  },
  { id: "g20", time: "16:00", field: "BV2",  sport: "volleyball", team1: 6,  team2: 7  },
  { id: "g21", time: "16:00", field: "SPK1", sport: "spikeball",  team1: 5,  team2: 8  },

  // ── Slot 8 · 16:20 (BV2 no longer available) ────────────
  { id: "g22", time: "16:20", field: "BV1",  sport: "volleyball", team1: 14, team2: 12 },
  { id: "g23", time: "16:20", field: "SPK1", sport: "spikeball",  team1: 15, team2: 11 },
  { id: "g24", time: "16:20", field: "SPK2", sport: "spikeball",  team1: 1,  team2: 10 },

  // ── Slot 9 · 16:40 ──────────────────────────────────────
  { id: "g25", time: "16:40", field: "BV1",  sport: "volleyball", team1: 2,  team2: 9  },
  { id: "g26", time: "16:40", field: "SPK1", sport: "spikeball",  team1: 3,  team2: 8  },
  { id: "g27", time: "16:40", field: "SPK2", sport: "spikeball",  team1: 4,  team2: 7  },

  // ── Slot 10 · 17:00 ─────────────────────────────────────
  { id: "g28", time: "17:00", field: "BV1",  sport: "volleyball", team1: 5,  team2: 6  },
  { id: "g29", time: "17:00", field: "SPK1", sport: "spikeball",  team1: 13, team2: 11 },
  { id: "g30", time: "17:00", field: "SPK2", sport: "spikeball",  team1: 14, team2: 10 },

  // ── Slot 11 · 17:20 ─────────────────────────────────────
  { id: "g31", time: "17:20", field: "BV1",  sport: "volleyball", team1: 15, team2: 9  },
  { id: "g32", time: "17:20", field: "SPK1", sport: "spikeball",  team1: 1,  team2: 8  },
  { id: "g33", time: "17:20", field: "SPK2", sport: "spikeball",  team1: 2,  team2: 7  },

  // ── Slot 12 · 17:40 ─────────────────────────────────────
  { id: "g34", time: "17:40", field: "BV1",  sport: "volleyball", team1: 3,  team2: 6  },
  { id: "g35", time: "17:40", field: "SPK1", sport: "spikeball",  team1: 4,  team2: 5  },
  { id: "g36", time: "17:40", field: "SPK2", sport: "spikeball",  team1: 12, team2: 10 },

  // ── Slot 13 · 18:00 ─────────────────────────────────────
  { id: "g37", time: "18:00", field: "BV1",  sport: "volleyball", team1: 13, team2: 9  },
  { id: "g38", time: "18:00", field: "SPK1", sport: "spikeball",  team1: 14, team2: 8  },
  { id: "g39", time: "18:00", field: "SPK2", sport: "spikeball",  team1: 15, team2: 7  },

  // ── Slot 14 · 18:20 ─────────────────────────────────────
  { id: "g40", time: "18:20", field: "BV1",  sport: "volleyball", team1: 1,  team2: 6  },
  { id: "g41", time: "18:20", field: "SPK1", sport: "spikeball",  team1: 2,  team2: 5  },
  { id: "g42", time: "18:20", field: "SPK2", sport: "spikeball",  team1: 3,  team2: 4  },

  // ── Slot 15 · 18:40 ─────────────────────────────────────
  { id: "g43", time: "18:40", field: "BV1",  sport: "volleyball", team1: 1,  team2: 11 },
  { id: "g44", time: "18:40", field: "SPK1", sport: "spikeball",  team1: 12, team2: 13 },
  { id: "g45", time: "18:40", field: "SPK2", sport: "spikeball",  team1: 14, team2: 15 },
];

// ── HELPERS ─────────────────────────────────────────────────

function getTeam(id) {
  return TEAMS.find(t => t.id === id);
}

function getTeamName(id) {
  return getTeamDisplayName(id);
}

function getGamesByTeam(teamId) {
  return GAMES.filter(g => g.team1 === teamId || g.team2 === teamId);
}

function getOpponent(game, teamId) {
  return game.team1 === teamId ? game.team2 : game.team1;
}

function sportLabel(sport) {
  return sport === 'volleyball' ? 'Beach Volleyball' : 'Spikeball';
}

function fieldLabel(field) {
  const labels = { BV1: 'Feld BV1', BV2: 'Feld BV2', SPK1: 'Feld SPK1', SPK2: 'Feld SPK2' };
  return labels[field] || field;
}
