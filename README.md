# Clanker Arena

3D multiplayer arena game built on **Fresh (Deno)** + **Three.js** + **WebSockets** + **Deno KV**.

Providers create bots by purchasing AI licenses and equipping weapon cards. Backers bet on bots during live arena matches, playing support cards in real time. Features a virtual economy, weekend tournaments, and 3D arena visualization.

## Stack

- **Framework:** Fresh 1.7 (Deno)
- **UI:** Preact + Tailwind CSS
- **3D:** Three.js via npm
- **Realtime:** Native WebSockets
- **Storage:** Deno KV
- **Auth:** GitHub OAuth (via GitHub CLI)

## Quick Start

```bash
deno task start
```

Open `http://localhost:8000`.

## Project Structure

```
routes/          — Fresh pages & API endpoints
islands/         — Interactive Preact components
lib/             — Backend libraries (economy, tournament, engine, stats, ws, arena)
types/           — Shared TypeScript interfaces
utils/           — KV helpers and connection
engine/          — Game simulation (core, modes, AI)
data/            — Card definitions
docs/            — KV key documentation
```

## Features

- **3D Arena** — Three.js visualization with bots, projectiles, particles, camera controls
- **Game Engine** — Deterministic simulation with Fronts, KotH, and FFA modes
- **WebSocket Layer** — Real-time room management, state broadcasting, card play
- **Economy** — Balance, daily rewards, transaction history, credit sinks
- **Tournaments** — Scheduling, bracket generation, team registration, prize pools
- **Real-Money Ledger** — Separate ledger with admin approval flow
- **Deck System** — 14 starter cards with cooldowns, buffs, shields, heals
