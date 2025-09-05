# ⚽ Player Auction System – Detailed Project Document

---

## 1. Implementation Analysis

**Objective:**
Develop a **web-based real-time player auction platform** for a single football tournament with \~12 teams (10 boys, 2 girls). The platform should allow:

* **Admin (Auctioneer):** Control the auction process (start/pause/stop, filter by categories, move to next player).
* **Teams:** Participate in live bidding, manage budgets, form squads.
* **Viewers:** Watch the auction live in an interactive dashboard.

**Constraints:**

* Free-to-use hosting & database.
* Single-use, tournament-specific.
* Minimal auth (hardcoded).
* Real-time updates mandatory.

**Key Challenges:**

* **Synchronization** → ensuring all viewers/teams see the same bid instantly.
* **Fair Bidding** → budget/squad validation at backend.
* **Engagement** → interactive UI for viewers (animations, leaderboards).

---

## 2. Software Requirements Specification (SRS)

### 2.1 Functional Requirements

**Admin**

* Login with hardcoded credentials.
* Upload/manage player list (CSV upload).
* Filter players by category (GK, Defender, Midfield, Striker, Girls).
* Start/pause/resume auction for a selected player.
* Set bid increments, timers.
* Finalize player when timer ends.

**Team Manager**

* Login with team credentials.
* See current player on auction (name, year, position, previous participation).
* Place bids if budget allows.
* Track remaining budget & squad composition.

**Viewer (Public)**

* No login.
* See current player on auction.
* Watch live bidding.
* View sold players, team budgets, leaderboards.

---

### 2.2 Non-Functional Requirements

* **Scalability:** Handle \~200 concurrent viewers + 12 teams.
* **Performance:** Bid updates in < 1 sec.
* **Reliability:** No double allocation of players.
* **Usability:** Responsive UI for mobile & desktop.
* **Security:** Only authenticated teams/admin can place bids.

---

## 3. Product Requirements Document (PRD)

**Product Vision:**
A lightweight, free, real-time football auction system with IPL-style excitement, but optimized for small tournaments.

**Core Features:**

1. Team registration (hardcoded login).
2. Player pool with categories & details.
3. Real-time live bidding.
4. Budget/squad enforcement.
5. Auctioneer admin controls.
6. Viewer dashboard with interactivity.

**Future Nice-to-Haves:**

* Live commentary/chat.
* Player stats analytics.
* AI recommendations (optional).

---

## 4. Epics & User Stories

### Epic 1: Auction Management

* As an **admin**, I want to upload players with categories so I can filter them.
* As an **admin**, I want to control which player is auctioned so the flow is smooth.
* As an **admin**, I want to finalize sales automatically on timer expiry.

### Epic 2: Team Participation

* As a **team manager**, I want to log in so only my team can bid.
* As a **team manager**, I want to place bids in real time.
* As a **team manager**, I want to see my budget & squad so I can plan.

### Epic 3: Viewer Experience

* As a **viewer**, I want to watch bidding live with animations.
* As a **viewer**, I want to see team stats & leaderboards.

### Epic 4: Real-Time System

* As a **system**, I must synchronize all events across admin, teams, and viewers instantly.

---

## 5. Tech Stack

**Frontend:**

* React + Tailwind (UI).
* Framer Motion (animations).
* Socket.IO client (real-time).

**Backend:**

* Node.js (Express).
* Socket.IO server (real-time events).

**Database:**

* Supabase (Postgres free tier).

**Auth:**

* Hardcoded JSON credentials for teams/admin.

**Hosting:**

* Vercel → frontend.
* Render/Railway → backend.
* Supabase → DB.

---

## 6. Free Service Roadmap (MVP Hosting)

* **Frontend** → Vercel free tier (unlimited builds, custom domain).
* **Backend** → Render free tier (750 hours/month, good for event).
* **Database** → Supabase (500 MB storage free).
* **Realtime** → Socket.IO hosted on backend.

👉 Total cost = ₹0

---

## 7. Data Model (DB Schema)

**Teams**

* id (int, PK)
* name (text)
* budget (int)
* slots\_left (int)

**Players**

* id (int, PK)
* name (text)
* year (int)
* position (enum: GK, Defender, Midfield, Striker, Girls)
* base\_price (int)
* played\_last\_year (boolean)
* sold\_price (int, nullable)
* sold\_to (int, FK → Teams.id, nullable)

**AuctionState**

* id (int, PK)
* current\_player\_id (int, FK → Players.id)
* status (text: not\_started, in\_progress, paused, completed)
* time\_left (int)

---

## 8. System Flow

1. Admin uploads players → DB populated.
2. Admin selects a player (can filter by category).
3. Auction starts → broadcast via Socket.IO.
4. Teams bid → backend validates budget, increments → broadcast highest bid.
5. Timer runs → resets on new bid.
6. On timeout → assign player to team → update DB.
7. Viewers see updates in real time.

---

## 9. Build Plan (Step-by-Step)

**Phase 1 – Core Backend (2 days)**

* Setup Supabase schema.
* Express backend with Socket.IO.
* Routes: `startAuction`, `placeBid`, `getTeams`, `getPlayers`.

**Phase 2 – Admin Panel (2 days)**

* Player filter (GK/MF/DF/ST).
* Start/pause/resume auction controls.

**Phase 3 – Team Dashboard (3 days)**

* Hardcoded login.
* Show current player + bid button.
* Budget/squad tracker.

**Phase 4 – Viewer Dashboard (3 days)**

* Real-time player card.
* Animated bids + leaderboards.
* Confetti on “sold”.

**Phase 5 – Testing & Deployment (2 days)**

* Dry runs with fake bids.
* Deploy on Vercel + Render.

👉 Total: \~12 days for solid MVP.

---

## 10. Risk Analysis

* **Backend free tier timeout** → mitigate by testing event duration.
* **Socket.IO scale** → should handle a few hundred users fine.
* **Single point of failure** → only 1 backend, but okay for single-use.

---

## 11. Success Criteria

* All teams successfully bid without lag.
* Viewer dashboard keeps audience engaged.
* No duplicate allocations or budget violations.
* Smooth admin control of auction flow.

