// ── ADMIN PAGE ───────────────────────────────────────────────
// Default password: geburi2026
// Change it by updating ADMIN_PASSWORD_HASH in Firebase:
//   /settings/adminPasswordHash
// To get a hash: open browser console and run:
//   crypto.subtle.digest('SHA-256', new TextEncoder().encode('yourpassword'))
//     .then(b => console.log([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')))

const DEFAULT_HASH = '4c38f0e61d81410da1e94c7c5e424e7cc625fdc217d6004caee92eb09757f870'; // sha256("geburi2026")

let adminAuthed = false;

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map(x => x.toString(16).padStart(2, '0')).join('');
}

async function initAdmin() {
  if (sessionStorage.getItem('isAdmin') === 'true') {
    showAdminPanel();
    return;
  }
  document.getElementById('login-section').style.display = 'block';
  document.getElementById('admin-panel').style.display = 'none';

  document.getElementById('login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const pw = document.getElementById('admin-pw').value;
    const hash = await sha256(pw);

    // Load expected hash from Firebase (falls back to DEFAULT_HASH)
    const snap = await db.ref('settings/adminPasswordHash').once('value');
    const expected = snap.val() || DEFAULT_HASH;

    if (hash === expected) {
      sessionStorage.setItem('isAdmin', 'true');
      adminAuthed = true;
      showAdminPanel();
    } else {
      document.getElementById('login-error').style.display = 'block';
    }
  });
}

function showAdminPanel() {
  adminAuthed = true;
  document.getElementById('login-section').style.display = 'none';
  document.getElementById('admin-panel').style.display = 'block';
  loadAdminGames();
}

function renderAdminGames(scores) {
  const container = document.getElementById('admin-games');
  container.innerHTML = '';
  GAMES.forEach(game => {
    const s = scores[game.id] || {};
    const row = document.createElement('div');
    row.className = 'admin-game-row';
    row.innerHTML = `
      <div class="admin-game-info">
        <div class="meta">${game.time} · ${fieldLabel(game.field)} · <span class="sport-badge ${game.sport}">${sportLabel(game.sport)}</span></div>
        <div><strong>${getTeamName(game.team1)}</strong> vs <strong>${getTeamName(game.team2)}</strong></div>
      </div>
      <div style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap">
        <div class="admin-score-inputs">
          <input type="number" min="0" max="99" value="${s.score1 ?? ''}" placeholder="–" id="s1-${game.id}">
          <span style="color:var(--text-muted);font-weight:700">:</span>
          <input type="number" min="0" max="99" value="${s.score2 ?? ''}" placeholder="–" id="s2-${game.id}">
        </div>
        <button class="btn btn-sm btn-primary" onclick="saveScore('${game.id}')">Speichern</button>
        <button class="btn btn-sm btn-ghost" onclick="clearScore('${game.id}')" title="Löschen">✕</button>
        <label style="display:flex;align-items:center;gap:.3rem;font-size:.8rem;cursor:pointer">
          <input type="checkbox" id="lock-${game.id}" ${s.locked ? 'checked' : ''} onchange="toggleLock('${game.id}', this.checked)">
          🔒
        </label>
      </div>
    `;
    container.appendChild(row);
  });
}

function loadAdminGames() {
  renderAdminGames({});
  try {
    db.ref('scores').on('value', snap => {
      renderAdminGames(snap.val() || {});
    });
  } catch(e) { console.warn('Firebase nicht verbunden:', e); }
}

async function saveScore(gameId) {
  if (!adminAuthed) return;
  const s1 = document.getElementById(`s1-${gameId}`).value;
  const s2 = document.getElementById(`s2-${gameId}`).value;
  const locked = document.getElementById(`lock-${gameId}`).checked;
  const snap = await db.ref(`scores/${gameId}`).once('value');
  const existing = snap.val() || {};
  await db.ref(`scores/${gameId}`).set({
    ...existing,
    score1: s1 !== '' ? parseInt(s1) : null,
    score2: s2 !== '' ? parseInt(s2) : null,
    locked,
    editedByAdmin: true,
    editedAt: Date.now()
  });
  showAdminToast('Gespeichert ✓');
}

async function clearScore(gameId) {
  if (!adminAuthed) return;
  if (!confirm('Ergebnis wirklich löschen?')) return;
  await db.ref(`scores/${gameId}`).remove();
  showAdminToast('Ergebnis gelöscht.');
}

async function resetAllTeamNames() {
  if (!adminAuthed) return;
  if (!confirm('Wirklich alle Team-Namen löschen?')) return;
  await db.ref('teamNames').remove();
  showAdminToast('Alle Team-Namen gelöscht ✓');
}

async function resetAllScores() {
  if (!adminAuthed) return;
  if (!confirm('Wirklich ALLE Scores löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) return;
  if (!confirm('Sicher? Alle 45 Spielresultate werden gelöscht.')) return;
  await db.ref('scores').remove();
  showAdminToast('Alle Scores gelöscht ✓');
}

async function toggleLock(gameId, locked) {
  if (!adminAuthed) return;
  await db.ref(`scores/${gameId}/locked`).set(locked);
}

async function setAdminPassword() {
  const pw = document.getElementById('new-pw').value;
  const pw2 = document.getElementById('new-pw2').value;
  if (!pw || pw !== pw2) {
    alert('Passwörter stimmen nicht überein.');
    return;
  }
  const hash = await sha256(pw);
  await db.ref('settings/adminPasswordHash').set(hash);
  showAdminToast('Passwort geändert ✓');
  document.getElementById('new-pw').value = '';
  document.getElementById('new-pw2').value = '';
}

function logout() {
  sessionStorage.removeItem('isAdmin');
  location.reload();
}

function showAdminToast(msg) {
  let toast = document.getElementById('admin-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'admin-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

document.addEventListener('DOMContentLoaded', initAdmin);
