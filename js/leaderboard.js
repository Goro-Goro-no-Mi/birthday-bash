// ── LEADERBOARD PAGE ─────────────────────────────────────────

function initLeaderboard() {
  const tbody = document.getElementById('lb-body');
  const lastUpdated = document.getElementById('last-updated');

  renderLeaderboard(computeStandings({}), tbody);

  try {
    db.ref('teamNames').on('value', snap => {
      teamNamesCache = snap.val() || {};
    });
    db.ref('scores').on('value', snap => {
      const scores = snap.val() || {};
      const standings = computeStandings(scores);
      renderLeaderboard(standings, tbody);
      if (lastUpdated) lastUpdated.textContent = new Date().toLocaleTimeString('de-CH');
    });
  } catch(e) { console.warn('Firebase nicht verbunden:', e); }
}

function computeStandings(scores) {
  const stats = {};
  TEAMS.forEach(t => {
    stats[t.id] = { id: t.id, name: t.name, w: 0, d: 0, l: 0, pts: 0, pf: 0, pa: 0 };
  });

  GAMES.forEach(game => {
    const s = scores[game.id];
    if (!s || s.score1 === null || s.score2 === null) return;

    const s1 = Number(s.score1);
    const s2 = Number(s.score2);
    stats[game.team1].pf += s1;
    stats[game.team1].pa += s2;
    stats[game.team2].pf += s2;
    stats[game.team2].pa += s1;

    if (s1 > s2) {
      stats[game.team1].w++;  stats[game.team1].pts += 3;
      stats[game.team2].l++;
    } else if (s2 > s1) {
      stats[game.team2].w++;  stats[game.team2].pts += 3;
      stats[game.team1].l++;
    } else {
      stats[game.team1].d++;  stats[game.team1].pts += 1;
      stats[game.team2].d++;  stats[game.team2].pts += 1;
    }
  });

  return Object.values(stats).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;        // meiste Punkte
    const diffA = a.pf - a.pa;
    const diffB = b.pf - b.pa;
    if (diffB !== diffA) return diffB - diffA;        // beste Punktedifferenz
    return b.pf - a.pf;                               // meiste erzielte Punkte
  });
}

function renderLeaderboard(standings, tbody) {
  tbody.innerHTML = '';
  standings.forEach((team, idx) => {
    const rank = idx + 1;
    const rankClass = rank <= 3 ? `rank-${rank}` : '';
    const diff = team.pf - team.pa;
    const diffStr = diff > 0 ? `+${diff}` : `${diff}`;
    const gamesPlayed = team.w + team.l;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="rank ${rankClass}">${rank <= 3 ? ['🥇','🥈','🥉'][rank-1] : rank}</td>
      <td class="lb-team">${getTeamFullDisplay(team.id)}</td>
      <td class="lb-pts">${team.pts}</td>
      <td class="lb-w">${team.w}</td>
      <td style="color:#aaa">${team.d}</td>
      <td class="lb-l">${team.l}</td>
      <td>${diffStr}</td>
    `;
    tbody.appendChild(tr);
  });
}

document.addEventListener('DOMContentLoaded', initLeaderboard);
