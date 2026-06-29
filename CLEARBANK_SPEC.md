# Mission: Auth — ClearBank
## Claude Code Implementation Specification

---

## 1. Project Overview

**Mission: Auth** is a gamified, in-person Descope B2C training built around a fictional Philippine fintech called **ClearBank**. Attendees play the role of ClearBank's IT Operations team, responding to directives from their CISO (Sarah Chen) to bring the bank into AFASA compliance.

The app runs **locally on each attendee's laptop**. No cloud deployment. No code changes ever — attendees only edit `.env` files via the wizard UI.

- **Stack:** React + Vite (frontend), Node/Express (backend)
- **Attendees:** 10–15, non-technical in web dev
- **Duration:** 8 hours, in-person
- **Missions:** M0–M12 (13 total)
- **Descope SDK:** Pre-wired in starter code. Attendees configure via `.env` only.

---

## 2. Repository Structure

```
clearbank/
├── client/                         # React + Vite frontend
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx                 # Route definitions
│   │   ├── components/
│   │   │   ├── DescopeAuthWidget.jsx   # Renders <AuthWidget> using VITE_FLOW_ID
│   │   │   ├── StepUpWidget.jsx        # Renders step-up flow using VITE_STEPUP_FLOW_ID
│   │   │   ├── NotificationBell.jsx    # Polls /api/inbox/unread-count
│   │   │   └── TransferForm.jsx        # Triggers step-up above ₱50,000
│   │   ├── pages/
│   │   │   ├── Home.jsx            # ClearBank landing page
│   │   │   ├── Login.jsx           # Auth widget page
│   │   │   ├── Dashboard.jsx       # Logged-in user dashboard
│   │   │   ├── Transfer.jsx        # Transfer page (M10 step-up)
│   │   │   ├── AccountBalance.jsx  # Protected route (M9 session validation)
│   │   │   ├── AdminInbox.jsx      # Admin email inbox (admin login required)
│   │   │   └── Wizard.jsx          # Mission wizard (admin login required)
│   │   └── context/
│   │       └── AuthContext.jsx     # Descope session context
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/                         # Node + Express backend
│   ├── index.js                    # Entry point
│   ├── routes/
│   │   ├── auth.js                 # Session validation endpoints
│   │   ├── wizard.js               # Wizard state read/write
│   │   ├── inbox.js                # Inbox read/seed
│   │   ├── env.js                  # .env read/write endpoints
│   │   └── admin.js                # Admin PIN verification
│   ├── lib/
│   │   ├── descopeClient.js        # Descope Node SDK init
│   │   ├── envManager.js           # Read/write .env safely
│   │   ├── wizardState.js          # wizard.json read/write helpers
│   │   └── inboxSeeder.js          # Seeds CISO emails on mission complete
│   └── package.json
│
├── data/
│   ├── wizard.json                 # Step-level mission progress (auto-created)
│   └── inbox.json                  # All seeded CISO emails (auto-created)
│
├── .env                            # Single source of truth for all config
├── .env.example                    # Template committed to repo
├── .gitignore                      # .env in gitignore
└── README.md                       # Setup instructions
```

---

## 3. Environment Variables

`.env.example` committed to repo. Attendees copy to `.env` before M0.

```env
# Set by attendee at M0 boot camp
BASE_EMAIL=john@gmail.com

# Set via wizard at M3 — enables Descope auth (empty = local mock auth)
VITE_DESCOPE_PROJECT_ID=

# Set via wizard at M1 — Management API key (backend only, never exposed to frontend)
DESCOPE_MANAGEMENT_KEY=

# Set via wizard each mission M3–M9 (overwritten), then stays as M7 unified flow
VITE_FLOW_ID=

# Set via wizard at M10 — step-up flow (never overwritten after)
VITE_STEPUP_FLOW_ID=

# Admin PIN for wizard and inbox access (pre-set by trainer before session)
ADMIN_PIN=clearbank2024

# Internal — set automatically by backend, do not edit
TRANSFER_THRESHOLD=50000
```

### Email Addressing Convention

All actor emails derived from `BASE_EMAIL` using plus-addressing:

| Actor | Email |
|-------|-------|
| Joel | `{base}+joel@domain.com` |
| Alex | `{base}+alex@domain.com` |
| Vicky | `{base}+vicky@domain.com` |
| Jane | `{base}+jane@domain.com` |
| Bill | `{base}+bill@domain.com` |
| Beth | `{base}+beth@domain.com` |
| Admin | `{base}+admin@domain.com` |

Backend derives all emails at runtime: `const joelEmail = baseEmail.replace('@', '+joel@')`.

---

## 4. Persistence Design

### `data/wizard.json`
Auto-created on first run. Stores step-level granularity.

```json
{
  "missions": {
    "M0": { "status": "complete", "steps": {} },
    "M1": {
      "status": "active",
      "steps": {
        "step1": false,
        "step2": false,
        "step3": false,
        "step4": false,
        "step5": false
      }
    },
    "M2": { "status": "locked", "steps": {} }
  }
}
```

**Status values:** `complete` | `active` | `locked`

**On server restart:**
- Completed missions → all steps ticked, collapsed read-only
- Active mission → resumes at first `false` step
- In-progress unconfirmed steps → reset to `false` (idempotent backend ops handle re-runs safely)
- Locked missions → remain locked

### `data/inbox.json`
Auto-created on first run. Append-only array of email objects.

```json
[
  {
    "id": "m1-trigger",
    "missionId": "M1",
    "type": "trigger",
    "read": false,
    "timestamp": "2024-01-15T09:00:00Z",
    "from": "Sarah Chen <s.chen+admin@clearbank.ph>",
    "to": "IT Operations <{base}+admin@domain.com>",
    "subject": "Action Required: Legacy User Account Migration — AFASA Compliance Deadline",
    "body": "..."
  }
]
```

---

## 5. Backend API Endpoints

All endpoints return `{ success: boolean, error?: string, data?: any }`.

### ENV Management (`/api/env`)
```
GET  /api/env/read          Returns sanitized .env (no MANAGEMENT_KEY value)
POST /api/env/write         Body: { key, value } — writes single key to .env
POST /api/env/write-batch   Body: { updates: [{key, value}] } — atomic multi-write
```

### Admin (`/api/admin`)
```
POST /api/admin/verify-pin  Body: { pin } → { success, token }
GET  /api/admin/status      Returns { isConfigured: bool } (PIN set in .env)
```

### Wizard (`/api/wizard`)
```
GET  /api/wizard/state           Full wizard.json
POST /api/wizard/complete-step   Body: { missionId, stepId }
POST /api/wizard/complete-mission Body: { missionId } — marks complete, unlocks next, seeds inbox email
POST /api/wizard/reset           Body: { pin } — wipes data/, resets .env to BASE_EMAIL only (trainer use)
```

### Inbox (`/api/inbox`)
```
GET  /api/inbox/all              Full inbox array
GET  /api/inbox/unread-count     Returns { count: number }
POST /api/inbox/mark-read        Body: { id }
POST /api/inbox/mark-all-read    Marks all read
```

### Auth / Verification (`/api/verify`)
```
POST /api/verify/session         Body: { sessionToken } → decoded claims
POST /api/verify/session-email   Body: { sessionToken, expectedEmails: [] } → match check
POST /api/verify/amr             Body: { sessionToken, requiredAmr } → bool
POST /api/verify/user-exists     Body: { email } → { exists, status }
POST /api/verify/user-locked     Body: { email } → { locked: bool }
POST /api/verify/flow-exists     Body: { flowId } → { exists: bool }
POST /api/verify/password-policy → { success, missing: [] }
POST /api/verify/stepup-flow     Body: { flowId } → { exists: bool }
```

### Error Handling Contract
Every endpoint:
- Wraps handler in try/catch
- Returns `{ success: false, error: "human-readable message" }` on any failure
- Never returns 500 with stack traces to client
- Logs full error server-side
- Retryable operations include retry count in response: `{ success: false, error: "...", retryable: true }`

---

## 6. Frontend Architecture

### Routing (`App.jsx`)
```
/                   → Home (ClearBank landing page)
/login              → Login page (Descope auth widget)
/dashboard          → Dashboard (protected, requires session)
/transfer           → Transfer page (protected, M10 step-up)
/balance            → Account balance (protected, M9 session validation)
/admin/inbox        → Admin inbox (requires admin PIN)
/admin/wizard       → Mission wizard (requires admin PIN)
```

### Auth Context (`AuthContext.jsx`)
- Wraps `@descope/react-sdk` `AuthProvider`
- Exposes: `{ user, sessionToken, isAuthenticated, logout }`
- When `VITE_DESCOPE_PROJECT_ID` is empty → mock auth mode (local only, no Descope calls)
- Session token silently passed with all protected API calls via `Authorization: Bearer` header

### Descope Auth Widget (`DescopeAuthWidget.jsx`)
```jsx
// Renders the Descope flow widget
// flowId comes from import.meta.env.VITE_FLOW_ID
// On success: fires onSuccess(sessionToken, user)
// On error: fires onError(err) — shows retry UI, never silent fail
```

### Step-Up Widget (`StepUpWidget.jsx`)
```jsx
// Renders VITE_STEPUP_FLOW_ID flow
// Triggered when transfer amount > TRANSFER_THRESHOLD (₱50,000)
// Shows as modal overlay on Transfer page
// On success: proceeds with transfer
// On cancel/error: blocks transfer, shows error state with retry
```

### Notification Bell (`NotificationBell.jsx`)
```jsx
// Polls GET /api/inbox/unread-count every 10 seconds
// Shows red badge with count when > 0
// Click → navigates to /admin/inbox (prompts PIN if not authenticated)
// Visible on all pages when admin is logged in
```

### Transfer Form (`TransferForm.jsx`)
```jsx
// Amount input + recipient
// On submit:
//   if amount > 50000 → trigger step-up flow (StepUpWidget)
//   if amount <= 50000 → proceed directly
// Shows transfer result (success/blocked)
// Threshold hardcoded: import.meta.env.VITE_TRANSFER_THRESHOLD || 50000
```

---

## 7. Wizard UI Specification

### Layout
Single page `/admin/wizard`. Full-height sidebar on left (mission list), main panel on right (active mission steps).

### Mission List (Sidebar)
```
✅ M0  Boot camp          [complete — greyed, expandable]
✅ M1  First contact      [complete — greyed, expandable]
🔵 M2  New customers      [ACTIVE — highlighted]
🔒 M3  The password       [locked]
🔒 M4  Go passwordless    [locked]
...
```

### Active Mission Panel
- Mission title + AFASA article reference
- Narrative context (1–2 sentences, formal tone)
- Steps listed sequentially, each unlocking after previous completes
- Each step has:
  - Step description (what to do)
  - Action area (input field / button / verified badge)
  - Status icon: ⏳ pending / ✅ complete / ❌ error
  - Retry button always visible on error state
  - "Proceed Anyway" fallback on verification steps (with warning banner)

### Step Types

**Trust-based step** — attendee clicks "Done" / "Confirmed" / "I've restarted"
```
[ ✅ Done ] button → marks step complete → unlocks next step
```

**Input step** — attendee pastes a value (Flow ID, Management Key)
```
[ text input ] [ Save & Continue ] → backend writes to .env → marks step complete
```

**Automated gate** — backend verifies silently
```
Verifying... → ✅ Verified / ❌ Failed [Retry]
Auto-retries 3x before surfacing error to attendee
```

**Restart step** — after .env write, attendee restarts dev server
```
[ I've restarted ] → marks step complete
Note: Backend cannot verify restart — trust-based
```

### Completed Missions
Collapsed to single row with ✅ icon. Expandable to read-only step summary. Never editable.

### Error Handling in Wizard
- Every automated gate: Retry button always visible
- Retry button fires same verification call
- After 3 manual retries: show "Proceed Anyway" with yellow warning banner
  - Warning: "Skipping verification. This step may need to be revisited."
  - Marks step complete with ⚠️ warning icon instead of ✅
- "Proceed Anyway" never available on destructive ops (PIN reset)
- Network errors: "Check your connection and retry"
- Descope API errors: show error code + human message from Descope

---

## 8. Admin Inbox UI Specification

### Layout
Email client aesthetic. List on left, detail on right (or full-width on mobile).

### Email List
- Unread: bold subject, blue left border
- Read: normal weight, no border
- Sorted: newest first
- Each row: From, Subject, timestamp

### Email Detail
- From / To / Subject / Date header
- Full body (formal regulatory tone, HTML-rendered)
- "Go to Wizard" link — always dynamic: `${window.location.origin}/admin/wizard`
- Mark as read automatically on open

### Email Seeding
Backend seeds inbox email when `POST /api/wizard/complete-mission` is called.
Each mission has a trigger email (seeded when mission unlocks) and a completion email (seeded when mission completes).

---

## 9. ClearBank App UI Specification

### Design Language
- Clean fintech aesthetic — navy/white/teal palette
- Professional but approachable
- Mobile-responsive
- No complex animations — training context needs clarity over flair

### Pages

**Home (`/`)**
- ClearBank logo + tagline: "Clear. Secure. Yours."
- Hero section with Philippine peso styling
- CTA: "Sign In" → `/login`
- When `VITE_DESCOPE_PROJECT_ID` is empty: shows "Local Mode" banner

**Login (`/login`)**
- ClearBank branded header
- Descope `<AuthWidget>` centered
- Flow rendered: `VITE_FLOW_ID`
- When `VITE_FLOW_ID` empty: shows placeholder "No flow configured yet — complete Mission 3 to activate"
- Error state: shows error + "Try Again" button
- Success: redirects to `/dashboard`

**Dashboard (`/dashboard`)**
- Welcome: "Good morning, [name]"
- Account summary cards (mock data: checking, savings)
- Quick actions: Transfer, View Balance, Transaction History (mock)
- Logout button

**Account Balance (`/balance`)**
- Protected route — validates session token against backend on every load
- Shows balance only after successful validation
- If session invalid: redirects to `/login` immediately
- This is the page Joel clicks in M9 to trigger session validation

**Transfer (`/transfer`)**
- Amount input + recipient selector (mock recipients: Alex, Vicky, Jane)
- Below ₱50,000: transfers immediately with success toast
- Above ₱50,000: triggers `StepUpWidget` modal
  - Step-up success → transfer proceeds → success toast
  - Step-up failure → transfer blocked → error state
- Transfer history panel (mock, session-only)

**Admin Inbox (`/admin/inbox`)**
- PIN gate: modal prompts for `ADMIN_PIN` on first visit
- PIN stored in sessionStorage (cleared on tab close)
- On success: renders inbox UI
- Notification bell in nav links here

**Wizard (`/admin/wizard`)**
- Same PIN gate as inbox
- Full wizard UI per Section 7

---

## 10. Mission-by-Mission Backend Verification Logic

### M0 — Boot Camp (trainer-led)
No backend verification. Wizard auto-advances after trust-based steps.
Steps: BASE_EMAIL set → Descope account created → project noted → done.

### M1 — First Contact
**Step 4 (automated gate):** Verify Joel, Alex, Vicky imported
```js
// Backend calls Descope Management API
GET /v1/mgmt/user?loginId={joelEmail}
GET /v1/mgmt/user?loginId={alexEmail}
GET /v1/mgmt/user?loginId={vickyEmail}
// All three must return 200 with status: invited or enabled
// Returns: { success: true } or { success: false, missing: [emails] }
```

### M2 — New Customers
**Step 4 (automated gate):** Verify Jane, Bill, Beth imported with invited status
```js
GET /v1/mgmt/user?loginId={janeEmail}
// status must be "invited"
// Same for Bill, Beth
```

### M3 — The Password
**Step 2 (input):** Flow ID written to VITE_FLOW_ID in .env
**Step 4 (automated gate):** Verify flow exists in project
```js
// Calls Descope Management API: GET /v1/mgmt/flow/{flowId}
// Returns 200 = exists
```

### M4 — Go Passwordless
**Step 2 (input):** New Flow ID written to VITE_FLOW_ID
**Step 4 (automated gate):** Verify Joel has passkey enrolled
```js
GET /v1/mgmt/user?loginId={joelEmail}
// Check user.webAuthn exists and has at least one credential
```

### M5 — New Arrivals
**Step 2 (input):** Flow ID written to VITE_FLOW_ID
**Step 4 (automated gate):** Verify session token email matches Jane/Bill/Beth
```js
POST /v1/auth/validate
// Decodes JWT, checks sub email is one of Jane/Bill/Beth
```
**Step 5 (automated gate):** Verify passkey enrolled for Jane
```js
GET /v1/mgmt/user?loginId={janeEmail}
// Check webAuthn credentials present
```

### M6 — Breach Check
**Step 1 (automated gate):** Verify password policy settings
```js
GET /v1/mgmt/password/settings
// Checks: minLength >= 10, uppercase: true, number: true, specialCharacter: true
// Returns: { success: true } or { success: false, missing: ["minLength", "uppercase"] }
```
**Step 5 (automated gate):** Verify Chris does NOT exist
```js
GET /v1/mgmt/user?loginId={chrisEmail}
// Must return 404 or user not found
```
**Step 6 (automated gate):** Verify Mike EXISTS with active/enabled status
```js
GET /v1/mgmt/user?loginId={mikeEmail}
// Must return 200 with status: enabled
```

### M7 — The Final Flow
**Step 2 (input):** Flow ID written to VITE_FLOW_ID
**Step 4 (automated gate):** Verify flow exists
```js
GET /v1/mgmt/flow/{flowId}
```
Steps 5–8: Trust-based smoke tests

### M8 — Geo Block
**Step 2 (input):** Flow ID written to VITE_FLOW_ID
**Step 4 (automated gate):** Verify flow exists
```js
GET /v1/mgmt/flow/{flowId}
```
Steps 5–8: Trust-based

### M9 — Guard the Gate
**Step 0 (input):** Restore M7 Flow ID → written to VITE_FLOW_ID
**Step 5 (automated gate):** Backend validates session token
```js
// Attendee pastes DST token into wizard input
// Backend calls: POST /v1/auth/validate (Bearer {token})
// Returns decoded claims panel in wizard UI
// Shows: sub, email, amr[], exp, iat
```
**Step 7 (automated gate):** After Joel's session revoked, verify 401
```js
// Re-validates same token
// Must return 401 or invalid session error
// Gate passes when token is rejected
```

### M10 — High Stakes
**Step 3 (input):** Flow ID written to VITE_STEPUP_FLOW_ID (NEW env var — never overwrites VITE_FLOW_ID)
**Step 5 (automated gate):** Verify step-up flow exists
```js
GET /v1/mgmt/flow/{stepUpFlowId}
```
Steps 6–9: Trust-based

### M11 — Paper Trail
No .env changes. No automated gates. All trust-based.
Step 5 callout: "Cloud-to-cloud. Descope → Honeycomb over OTLP gRPC. Your laptop is not in the path."

### M12 — Red Alert
**Step 3 (automated gate):** Verify Mike is locked
```js
GET /v1/mgmt/user?loginId={mikeEmail}
// Check status === "locked" or lockedExpiry is set
// Returns: { locked: true }
```
Steps 5: Trust-based (Honeycomb investigation)
Step 6: Trust-based (unlock Mike, click "Incident closed")

---

## 11. CISO Email Canon

All emails: formal regulatory tone. Sender always "Sarah Chen, Chief Information Security Officer". Recipient always "IT Operations". Dynamic wizard link always: `${req.headers.origin}/wizard`.

| Mission | Trigger Subject | Completion Subject |
|---------|----------------|-------------------|
| M1 | Action Required: Legacy User Account Migration — AFASA Compliance Deadline | — |
| M2 | Action Required: Onboarding of Invited Customer Accounts — Pending Activation | — |
| M3 | Notice: Legacy Authentication Flow Required — Interim Measure Only | — |
| M4 | Directive: Passkey Enrollment for Legacy Accounts — AFASA Phase 1 Migration | — |
| M5 | Directive: Passwordless Onboarding Flow — New Customer Accounts | — |
| M6 | Directive: Password Policy Enforcement and Breach Credential Detection | — |
| M7 | Directive: Unified Authentication Flow — All Customer Segments | — |
| M8 | Directive: Geographic Access Restrictions — AFASA Threat Intelligence Update | Confirmed: Geographic Access Controls Verified — AFASA Article 9 Closed |
| M9 | Directive: Session Validation & Management Controls — AFASA Phase 3 | Confirmed: Session Validation & Revocation Verified — AFASA Article 7 Closed |
| M10 | Directive: Step-Up Authentication for High-Value Transactions — AFASA Article 8 | Confirmed: Step-Up Authentication Verified — AFASA Article 8 Closed |
| M11 | Directive: Audit Logging and Compliance Reporting — AFASA Articles 6, 10 and 11 | Confirmed: Audit Logging Verified — AFASA Articles 6, 10 and 11 Closed |
| M12 | Alert: Suspected Credential Stuffing Attack — Customer Account Compromised | Confirmed: Credential Stuffing Incident Resolved. ClearBank AFASA Compliance Certified. |

---

## 12. Global Error Handling Rules

These rules apply everywhere in the codebase without exception:

1. **No silent failures.** Every error surfaces to the attendee with a human-readable message.
2. **Every automated gate has a Retry button.** Always visible on failure. Never hidden.
3. **Silent backend ops auto-retry 3x** before surfacing error to attendee.
4. **Only happy path auto-advances.** Error states always wait for user action.
5. **"Proceed Anyway" fallback** on verification steps after 3 manual retries. Shows yellow warning banner. Marks step with ⚠️.
6. **"Proceed Anyway" is NOT available on:** PIN entry, .env writes, data reset.
7. **Network errors:** "Connection error — check your terminal is still running and retry."
8. **Descope API errors:** Show Descope error code + translated human message.
9. **Port is never hardcoded.** All internal links use `window.location.origin` (client) or `req.headers.origin` (server).
10. **Wizard state survives restart.** On server restart, full fidelity restore from `data/wizard.json`.
11. **Trainer reset:** PIN-protected "Reset Training" button in wizard footer. Wipes `data/wizard.json`, `data/inbox.json`, resets `.env` to `BASE_EMAIL` only.

---

## 13. Security Constraints

- `DESCOPE_MANAGEMENT_KEY` — backend only. Never sent to frontend. Never in Vite env (no `VITE_` prefix).
- `ADMIN_PIN` — backend only. Never in frontend bundle.
- Session tokens — passed as `Authorization: Bearer` header, never in URL params or localStorage keys exposed to wizard.
- `.env` — in `.gitignore`. Never committed.
- All Management API calls — server-side only via `server/lib/descopeClient.js`.
- Frontend Descope SDK — uses `VITE_DESCOPE_PROJECT_ID` only (public, safe).

---

## 14. Startup & README

### `README.md` must include:

```markdown
## Setup (do this before training day)

1. Clone the repo
2. cd clearbank
3. cp .env.example .env
4. Open .env and set BASE_EMAIL=your-real-email@gmail.com
5. cd server && npm install
6. cd ../client && npm install
7. cd ../server && node index.js   (terminal 1 — keep open)
8. cd ../client && npm run dev     (terminal 2 — keep open)
9. Open http://localhost:5173
10. Navigate to /admin/wizard to begin Mission 0

## Trainer setup (before attendees arrive)
- Set ADMIN_PIN in .env to your chosen PIN
- Verify Descope project is created and noted
- Pre-seed M0 completion so M1 trigger email appears in inbox
```

### Port Handling
- Vite default: 5173. If taken, Vite auto-increments (5174, 5175...)
- All links derived from `window.location.origin` — port auto-correct
- Backend default: 3001. Configurable via `PORT` env var.
- Vite proxy: `{ '/api': 'http://localhost:3001' }` in `vite.config.js`

---

## 15. Build Order for Claude Code

Recommended implementation sequence:

```
Phase 1 — Foundation
  1. Project scaffold (Vite + Express, folder structure)
  2. .env system (envManager.js — read/write/batch)
  3. Data layer (wizard.json + inbox.json read/write helpers)
  4. Admin PIN system (verify endpoint + frontend PIN gate)

Phase 2 — ClearBank App
  5. ClearBank UI pages (Home, Login, Dashboard, Balance, Transfer)
  6. Descope SDK integration (AuthContext, AuthWidget, StepUpWidget)
  7. NotificationBell component
  8. Protected routes + session validation

Phase 3 — Wizard
  9. Wizard state API (read, complete-step, complete-mission, reset)
  10. Wizard UI layout (sidebar mission list + main step panel)
  11. Step types (trust, input, automated gate, restart)
  12. Error handling + Retry + Proceed Anyway

Phase 4 — Inbox
  13. Inbox API (all, unread-count, mark-read)
  14. Inbox seeder (all 20 email bodies written)
  15. Inbox UI (list + detail)

Phase 5 — Mission Verification Logic
  16. All /api/verify/* endpoints (M1–M12 gates)
  17. Wire gates into wizard steps
  18. Descope Management API client

Phase 6 — Polish
  19. Full persistence/restart restore testing
  20. Trainer reset flow
  21. README + .env.example
```

---

## 16. Package Dependencies

### Client (`client/package.json`)
```json
{
  "dependencies": {
    "@descope/react-sdk": "latest",
    "react": "^18",
    "react-dom": "^18",
    "react-router-dom": "^6",
    "axios": "^1"
  },
  "devDependencies": {
    "vite": "^5",
    "@vitejs/plugin-react": "^4"
  }
}
```

### Server (`server/package.json`)
```json
{
  "dependencies": {
    "@descope/node-sdk": "latest",
    "express": "^4",
    "dotenv": "^16",
    "cors": "^2",
    "fs-extra": "^11"
  }
}
```

---

## 17. Key Implementation Notes for Claude Code

1. **`envManager.js`** must parse and write `.env` without corrupting other keys. Use line-by-line parse, not `dotenv` rewrite (which drops comments).

2. **`descopeClient.js`** must lazy-init — Management Key may not be set at startup. Re-init when key is written via wizard.

3. **Vite proxy** (`/api → localhost:3001`) means all frontend API calls use relative paths (`/api/wizard/state`) — no hardcoded ports.

4. **Wizard step unlock logic:** A step becomes interactive only when all previous steps have `true` in `wizard.json`. Backend enforces this — completing step N out of order returns `{ success: false, error: "Previous step not complete" }`.

5. **Mission unlock logic:** When `complete-mission` is called for M(n), backend sets M(n+1) status to `active` and seeds M(n+1) trigger email. M11 and M12 unlock together after M10.

6. **Mock auth mode:** When `VITE_DESCOPE_PROJECT_ID` is empty, `AuthContext` returns a mock user. Wizard gates that check session tokens skip validation and show a "Project ID not set — complete Mission 3 first" message.

7. **`StepUpWidget`** only mounts when `VITE_STEPUP_FLOW_ID` is non-empty. When empty, transfers above threshold show "Step-up not configured — complete Mission 10 first".

8. **All CISO email bodies** must be pre-written as template strings in `inboxSeeder.js`. The wizard link is injected at seed time from `process.env` or a passed-in base URL.

9. **Trainer Reset** wipes only `data/wizard.json` and `data/inbox.json`. It does NOT wipe `.env` (base email and Descope project ID are preserved — re-running the training doesn't require re-setup).

10. **`data/` directory** auto-created by server on first start if not present. Default `wizard.json` initializes M0 as `active`, all others `locked`.
```
