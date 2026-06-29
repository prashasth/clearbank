# ClearBank — Mission: Auth

Gamified Descope B2C training app for AFASA compliance.

## Prerequisites

Make sure you have these before the workshop:

| Tool | Why | Check |
|------|-----|-------|
| [Node.js 18+](https://nodejs.org/) | Runs the backend server | `node -v` |
| npm | Installs all dependencies (comes with Node) | `npm -v` |
| [Git](https://git-scm.com/downloads) | To clone the repo | `git --version` |
| A Gmail address | Used for mission trigger emails | — |

> Vite, React, and all other packages are installed automatically via `npm install` — no manual installs needed.

## Attendee setup

```bash
# 1. Clone the repo
git clone https://github.com/prashasth/clearbank.git
cd clearbank

# 2. Copy the environment template
cp .env.example .env

# 3. Open .env and set your email
#    Change: BASE_EMAIL=your-real-email@gmail.com

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

## Default admin PIN

`clearbank2024` — change this in `.env` before training day
