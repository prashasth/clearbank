# ClearBank — Mission: Auth

Gamified Descope B2C training app for AFASA compliance.

## Setup (do this before training day)

1. Clone the repo
2. `cd clearbank`
3. `cp .env.example .env`
4. Open `.env` and set `BASE_EMAIL=your-real-email@gmail.com`
5. `cd server && npm install`
6. `cd ../client && npm install`
7. `cd ../server && node index.js`   (terminal 1 — keep open)
8. `cd ../client && npm run dev`     (terminal 2 — keep open)
9. Open http://localhost:5173
10. Navigate to `/admin/wizard` to begin Mission 0

## Trainer setup (before attendees arrive)
- Set `ADMIN_PIN` in `.env` to your chosen PIN
- Verify Descope project is created and noted
- Pre-seed M0 completion so M1 trigger email appears in inbox

## Default admin PIN
`clearbank2024` (change this in `.env` before training)
