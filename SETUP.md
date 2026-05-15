# Setup-Anleitung: Firebase & Website

## 1. Firebase Projekt erstellen

1. Gehe zu [console.firebase.google.com](https://console.firebase.google.com)
2. Klicke **"Projekt hinzufügen"** → Namen eingeben (z.B. `geburi-bash-2026`)
3. Google Analytics kann deaktiviert werden
4. Klicke **"Weiter"** bis das Projekt erstellt ist

## 2. Realtime Database aktivieren

1. Im linken Menü: **Build → Realtime Database**
2. **"Datenbank erstellen"** klicken
3. Standort wählen: **Europe (belgium)** empfohlen
4. Sicherheitsregeln: **"Im Testmodus starten"** (wir passen das gleich an)

## 3. Datenbank-Regeln setzen

Im Tab **"Regeln"** folgendes einfügen:

```json
{
  "rules": {
    "scores": {
      "$gameId": {
        ".read": true,
        ".write": true
      }
    },
    "settings": {
      "adminPasswordHash": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

Klicke **"Veröffentlichen"**.

## 4. App registrieren & Config kopieren

1. Im Firebase-Projekt: Klicke auf das **Web-Symbol (</>)**
2. App-Namen eingeben (z.B. `geburi-bash-web`)
3. **Firebase Hosting** nicht aktivieren nötig (optional)
4. Du erhältst einen `firebaseConfig`-Block wie:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "geburi-bash-2026.firebaseapp.com",
  databaseURL: "https://geburi-bash-2026-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "geburi-bash-2026",
  storageBucket: "geburi-bash-2026.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

5. Öffne die Datei **`js/firebase-config.js`** und ersetze `YOUR_API_KEY` etc. mit deinen echten Werten.

## 5. Admin-Passwort setzen

Beim ersten Öffnen von `admin.html`:
1. Anmeldung mit Standard-Passwort: **`geburi2026`**
2. Scrolle nach unten zu "Passwort ändern"
3. Neues Passwort vergeben und speichern

Das Passwort wird als SHA-256-Hash in Firebase gespeichert.

## 6. Website öffnen

### Option A: Direkt im Browser (lokal)
- Öffne `index.html` direkt im Browser (Doppelklick)
- Alle Seiten funktionieren lokal, da Firebase über CDN geladen wird

### Option B: Live-Server (VS Code)
- Install Extension: **Live Server**
- Rechtsklick auf `index.html` → "Open with Live Server"

### Option C: Firebase Hosting (online, kostenlos)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## 7. Teamnamen & Spieler anpassen

Öffne `js/data.js` und ersetze die Platzhalter:

```javascript
const TEAMS = [
  { id: 1, name: "Team Flamingo", player1: "Anna", player2: "Beda" },
  { id: 2, name: "Team Shark",    player1: "Chris", player2: "Dana" },
  // ...
];
```

## Dateistruktur

```
Geburi_Bash/
├── index.html          ← Startseite mit Countdown
├── teams.html          ← Teamübersicht
├── schedule.html       ← Spielplan
├── scores.html         ← Score-Eingabe (für Teams)
├── leaderboard.html    ← Live-Rangliste
├── admin.html          ← Admin-Panel (nur für dich)
├── css/
│   └── style.css
├── js/
│   ├── firebase-config.js   ← HIER deine Firebase-Config eintragen!
│   ├── data.js              ← Teams & Spielplan
│   ├── nav.js
│   ├── scores.js
│   ├── leaderboard.js
│   └── admin.js
└── SETUP.md
```
