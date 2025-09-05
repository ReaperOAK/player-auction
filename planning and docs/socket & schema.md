Alright, let’s go **full dev mode**.
I’ll give you two things:

1. **Exact Supabase SQL schema** → so you can paste and create tables instantly.
2. **Socket.IO event design** → backend + frontend event contracts, so your team knows how clients and server talk.

---

# 🗄️ Supabase Schema (SQL)

Run these queries inside Supabase SQL Editor:

```sql
-- Teams table
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    budget INT NOT NULL,
    slots_left INT NOT NULL
);

-- Players table
CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    year INT NOT NULL,
    position TEXT CHECK (position IN ('GK', 'Defender', 'Midfield', 'Striker', 'Girls')),
    base_price INT NOT NULL,
    played_last_year BOOLEAN DEFAULT FALSE,
    sold_price INT DEFAULT NULL,
    sold_to INT REFERENCES teams(id) ON DELETE SET NULL
);

-- Auction State (single row to track status)
CREATE TABLE auction_state (
    id SERIAL PRIMARY KEY,
    current_player_id INT REFERENCES players(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('not_started', 'in_progress', 'paused', 'completed')) DEFAULT 'not_started',
    time_left INT DEFAULT 0
);

-- Indexes for fast lookups
CREATE INDEX idx_players_position ON players(position);
CREATE INDEX idx_players_sold_to ON players(sold_to);
```

---

# ⚡ Socket.IO Event Design

## Server → Client Events

| Event             | Data                           | Who Receives                | Purpose                                           |
| ----------------- | ------------------------------ | --------------------------- | ------------------------------------------------- |
| `auction_started` | `{ player: {...}, time_left }` | All (admin, teams, viewers) | Notify everyone that auction for a player started |
| `new_highest_bid` | `{ playerId, teamId, amount }` | All                         | Update highest bid in real time                   |
| `timer_tick`      | `{ time_left }`                | All                         | Update countdown clock                            |
| `player_sold`     | `{ playerId, teamId, amount }` | All                         | Show sold animation + DB update                   |
| `auction_paused`  | `{}`                           | All                         | Notify pause                                      |
| `auction_resumed` | `{ time_left }`                | All                         | Resume auction                                    |

---

## Client → Server Events

| Event            | Data                           | Who Sends | Purpose                                      |
| ---------------- | ------------------------------ | --------- | -------------------------------------------- |
| `start_auction`  | `{ playerId, time }`           | Admin     | Start auction for a player                   |
| `pause_auction`  | `{}`                           | Admin     | Pause auction                                |
| `resume_auction` | `{}`                           | Admin     | Resume auction                               |
| `place_bid`      | `{ playerId, teamId, amount }` | Teams     | Place a bid                                  |
| `end_auction`    | `{}`                           | Admin     | Force-end auction and sell to highest bidder |

---

# 🖥️ Backend Flow (Express + Socket.IO)

```js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { Pool } from "pg";  // Supabase = Postgres

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const db = new Pool({
  connectionString: process.env.SUPABASE_URL,
  ssl: { rejectUnauthorized: false }
});

let currentBid = null;
let timer = null;

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Admin starts auction
  socket.on("start_auction", async ({ playerId, time }) => {
    const player = (await db.query("SELECT * FROM players WHERE id=$1", [playerId])).rows[0];
    currentBid = { playerId, amount: player.base_price, teamId: null };

    io.emit("auction_started", { player, time_left: time });

    timer = setInterval(() => {
      time--;
      if (time <= 0) {
        clearInterval(timer);
        io.emit("player_sold", currentBid);
        db.query("UPDATE players SET sold_price=$1, sold_to=$2 WHERE id=$3", 
          [currentBid.amount, currentBid.teamId, currentBid.playerId]);
      } else {
        io.emit("timer_tick", { time_left: time });
      }
    }, 1000);
  });

  // Team places bid
  socket.on("place_bid", async ({ playerId, teamId, amount }) => {
    if (amount > currentBid.amount) {
      currentBid = { playerId, teamId, amount };
      io.emit("new_highest_bid", currentBid);
    }
  });
});

server.listen(5000, () => console.log("Auction server running..."));
```

---

# 🎨 Frontend React Components

* **AdminPanel.jsx**

  * List players (filter by GK/DF/MF/ST/Girls).
  * Start/pause/resume auction buttons.
* **TeamDashboard.jsx**

  * Current player card.
  * Bid button (disabled if insufficient budget).
  * Budget + slots tracker.
* **ViewerDashboard.jsx**

  * Current player card + animations.
  * Live bid ticker (which team last bid).
  * Team budgets sidebar.
  * Confetti animation when player sold.

---

# 🚀 Free Deployment Workflow

1. **Database** → Supabase (create project, run schema SQL).
2. **Backend** → Render free tier (deploy Node.js + Socket.IO server).
3. **Frontend** → Vercel (deploy React app, connect to backend WebSocket URL).

---

✅ With this setup, you have:

* Supabase → DB (players, teams, state).
* Node.js backend → Socket.IO real-time bidding + validation.
* React frontend → Interactive dashboards.
* Hosting = 100% free.

---

Do you want me to also **map out the React component tree & data flow** (so you know exactly which props/state go where), or is this enough detail for you to start building?
