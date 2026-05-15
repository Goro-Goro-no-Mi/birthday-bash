// ── SCORES PAGE ─────────────────────────────────────────────

let selectedTeamId = null;
let allScores = {};

function initScores() {
  const teamSelect = document.getElementById('team-select');
  const gamesContainer = document.getElementById('games-container');

  // Populate team dropdown with auto-names + player names
  TEAMS.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.id;
    opt.textContent = `${getAutoName(t)} (${t.player1} & ${t.player2})`;
    teamSelect.appendChild(opt);
  });

  // Load team names from Firebase
  db.ref('teamNames').on('value', snap => {
    teamNamesCache = snap.val() || {};
    // Update dropdown labels
    teamSelect.querySelectorAll('option[value]').forEach(opt => {
      const id = parseInt(opt.value);
      if (!id) return;
      const t = getTeam(id);
      if (!t) return;
      const name = teamNamesCache[id] || getAutoName(t);
      opt.textContent = `${name} (${t.player1} & ${t.player2})`;
    });
    if (selectedTeamId) renderNameSection(selectedTeamId);
  });

  teamSelect.addEventListener('change', () => {
    selectedTeamId = parseInt(teamSelect.value);
    renderNameSection(selectedTeamId);
    renderTeamGames(selectedTeamId, gamesContainer);
  });

  // Listen to all scores in Firebase
  db.ref('scores').on('value', snap => {
    allScores = snap.val() || {};
    if (selectedTeamId) renderTeamGames(selectedTeamId, gamesContainer);
  });
}

function renderNameSection(teamId) {
  const section = document.getElementById('name-section');
  const team = getTeam(teamId);
  if (!team || !section) return;

  const existing = teamNamesCache[teamId];
  const autoName = getAutoName(team);

  if (existing) {
    section.innerHTML = `
      <div class="alert alert-success" style="display:flex;align-items:center;justify-content:space-between;gap:.5rem">
        <span>Teamname: <strong>${existing}</strong> <small style="opacity:.6">(${team.player1} & ${team.player2})</small></span>
        <button class="btn btn-ghost btn-sm" onclick="resetTeamName(${teamId})">Ändern</button>
      </div>`;
  } else {
    section.innerHTML = `
      <div class="card" style="margin-bottom:1.5rem">
        <p style="margin-bottom:.75rem;font-size:.9rem;color:var(--text-muted)">
          Möchtet ihr eurem Team einen Namen geben?<br>
          <small>Ohne Eingabe lautet euer Name automatisch <strong>${autoName}</strong> (${team.player1} & ${team.player2})</small>
        </p>
        <div style="display:flex;gap:.5rem">
          <input type="text" id="team-name-input" placeholder="${autoName}" maxlength="20" style="flex:1">
          <button class="btn btn-primary" onclick="saveTeamName(${teamId})">Speichern</button>
        </div>
      </div>`;
  }
}

async function saveTeamName(teamId) {
  const input = document.getElementById('team-name-input');
  const name = (input ? input.value.trim() : '') || getAutoName(getTeam(teamId));
  await db.ref(`teamNames/${teamId}`).set(name);
  showToast(`Teamname "${name}" gespeichert ✓`);
}

async function resetTeamName(teamId) {
  await db.ref(`teamNames/${teamId}`).remove();
}

function renderTeamGames(teamId, container) {
  const games = getGamesByTeam(teamId);
  container.innerHTML = '';

  if (games.length === 0) {
    container.innerHTML = '<div class="empty-state"><span class="icon">🏐</span><p>Keine Spiele gefunden.</p></div>';
    return;
  }

  games.forEach(game => {
    const score = allScores[game.id] || null;
    const isDone = score && score.score1 !== null && score.score2 !== null;
    const opponentId = getOpponent(game, teamId);
    const isTeam1 = game.team1 === teamId;

    const card = document.createElement('div');
    card.className = `score-card ${isDone ? 'done' : 'upcoming'}`;

    const myScore = isDone ? (isTeam1 ? score.score1 : score.score2) : null;
    const theirScore = isDone ? (isTeam1 ? score.score2 : score.score1) : null;
    const isLocked = score && score.locked;

    card.innerHTML = `
      <div class="score-card-header">
        <span class="sport-dot ${game.sport}"></span>
        <span class="sport-badge ${game.sport}">${sportLabel(game.sport)}</span>
        <span class="score-card-meta">${game.time} · ${fieldLabel(game.field)}</span>
      </div>
      <div class="score-card-teams">
        <span>${getTeamName(teamId)}</span>
        <span class="game-vs">vs</span>
        <span>${getTeamName(opponentId)}</span>
      </div>
      ${isDone ? renderDoneState(myScore, theirScore, isLocked) : renderEntryForm(game, teamId, isTeam1, isLocked)}
    `;

    if (!isDone && !isLocked) {
      const form = card.querySelector('.entry-form');
      if (form) {
        form.addEventListener('submit', e => handleSubmit(e, game, teamId, isTeam1));
      }
    }

    container.appendChild(card);
  });
}

function renderDoneState(myScore, theirScore, locked) {
  const won = myScore > theirScore;
  return `
    <div class="alert alert-success">
      Ergebnis: <strong>${myScore} : ${theirScore}</strong>
      ${won ? ' 🏆 Gewonnen!' : ' — Verloren'}
      ${locked ? '<span style="margin-left:.5rem;opacity:.6">🔒 Gesperrt</span>' : ''}
    </div>
  `;
}

function renderEntryForm(game, teamId, isTeam1, locked) {
  if (locked) {
    return '<div class="alert alert-info">🔒 Vom Admin gesperrt.</div>';
  }
  return `
    <form class="entry-form">
      <div class="score-entry">
        <div class="score-input-wrap">
          <div class="team-label">${getTeamName(teamId)}</div>
          <input type="number" min="0" max="99" name="myScore" placeholder="–" required>
        </div>
        <div class="vs-separator">:</div>
        <div class="score-input-wrap">
          <div class="team-label">${getTeamName(getOpponent(game, teamId))}</div>
          <input type="number" min="0" max="99" name="theirScore" placeholder="–" required>
        </div>
      </div>
      <button type="submit" class="btn btn-accent btn-full">Ergebnis speichern ✓</button>
    </form>
  `;
}

async function handleSubmit(e, game, teamId, isTeam1) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button');
  const myScore = parseInt(form.myScore.value);
  const theirScore = parseInt(form.theirScore.value);

  if (isNaN(myScore) || isNaN(theirScore)) return;

  btn.disabled = true;
  btn.textContent = 'Speichern…';

  const score1 = isTeam1 ? myScore : theirScore;
  const score2 = isTeam1 ? theirScore : myScore;

  try {
    await db.ref(`scores/${game.id}`).set({
      score1,
      score2,
      submittedBy: teamId,
      submittedAt: Date.now(),
      locked: false
    });
    showToast('Ergebnis gespeichert ✓');
  } catch (err) {
    console.error(err);
    btn.disabled = false;
    btn.textContent = 'Ergebnis speichern ✓';
    showToast('Fehler beim Speichern!');
  }
}

function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

document.addEventListener('DOMContentLoaded', initScores);
