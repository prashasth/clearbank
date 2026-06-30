# ClearBank — Mission: Auth

Gamified Descope B2C training app for AFASA compliance.

## Prerequisites

Make sure you have these before the workshop:

| Tool | Why | Check |
|------|-----|-------|
| [Node.js 18+](https://nodejs.org/) | Runs the backend server | `node -v` |
| npm | Installs all dependencies (comes with Node) | `npm -v` |
| [Git](https://git-scm.com/downloads) | To clone the repo | `git --version` |
| A Gmail, Outlook, or Fastmail address | Missions use `+` subaddressing (e.g. `you+joel@gmail.com`) — must be a provider that supports it | — |

> Vite, React, and all other packages are installed automatically via `npm install` — no manual installs needed.

### Install Node.js & Git via command line

**macOS** (using [Homebrew](https://brew.sh)):
```bash
# Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js and Git
brew install node git
```

**Windows** (using [winget](https://learn.microsoft.com/en-us/windows/package-manager/winget/)):
```powershell
winget install OpenJS.NodeJS
winget install Git.Git
```

**Ubuntu / Debian Linux**:
```bash
sudo apt update
sudo apt install -y git
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

Verify everything is ready:
```bash
node -v   # should print v18 or higher
npm -v
git --version
```

## Attendee setup

```bash
# 1. Clone the repo
git clone https://github.com/prashasth/clearbank.git
cd clearbank

# 2. Copy the environment template
cp .env.example .env

# 3. Open .env and set your email
#    Change: BASE_EMAIL=your-email@example.com

# 4. Install dependencies
cd server && npm install
cd ../client && npm install

# 5. Start the backend (Terminal 1 — keep open)
cd ../server && node index.js

# 6. Start the frontend (Terminal 2 — keep open)
cd ../client && npm run dev
```

7. Open **http://localhost:5173**
8. Go to `/admin/wizard` to begin **Mission 0**

---

## Trainer setup (before attendees arrive)

- Set `ADMIN_PIN` in `.env` to your chosen PIN
- Verify your Descope project is created and noted
- Pre-seed M0 completion so the M1 trigger email appears in inbox
- Distribute `legacy-users.sample.csv` to attendees — they'll upload it during Mission 1
- Point attendees to `sign-up-or-in-bank.json` for Mission 7 — they import this flow into Descope via **Flows → Import**

## Legacy users CSV (Mission 1)

Mission 1 asks attendees to upload a CSV of legacy bank accounts. A sample file is included in the repo at [`legacy-users.sample.csv`](legacy-users.sample.csv):

```
actor,displayName,password
joel,Joel,ClearBank@2024
alex,Alex,ClearBank@2024
vicky,Vicky,ClearBank@2024
```

The trainer can customise passwords before the session. Attendees upload this file via the wizard — the server hashes the passwords and imports the accounts into Descope.

## Default admin PIN

`clearbank2024` — change this in `.env` before training day
