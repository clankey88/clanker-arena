# Clanker Arena — Full Development Ticket List
## Categorized Tickets for Complete MVP + Foundation

**Project:** Clanker Arena  
**Stack:** Fresh (Deno) + Native WebSockets + Deno KV  
**Date:** June 26, 2026  
**Note:** This list covers the full development scope based on current vision. Tickets are grouped by category for easy import into Linear, GitHub Projects, or Jira.

---

## 1. Project Setup & Infrastructure

### T-001: Initialize Fresh Project with Deno KV and WebSocket Support
**Description:**  
Set up a new Fresh project with proper folder structure, Tailwind, Deno KV integration, and a working WebSocket example route.

**Acceptance Criteria:**
- Fresh project boots successfully
- Deno KV is accessible from routes and islands
- Example WebSocket route exists at `/ws/test`
- Basic layout with navigation is in place
- `.env` and deployment config ready for Deno Deploy

**Dependencies:** None  
**Tech Notes:** Use official Fresh template + add Deno KV and WebSocket handling.  
**Complexity:** Low  
**Category:** Setup

---

### T-002: Set Up Development, Staging, and Production Environments
**Description:**  
Configure Deno Deploy project, environment variables, and basic CI (GitHub Actions for lint + type check).

**Acceptance Criteria:**
- Project deploys to Deno Deploy
- Environment variables (KV access, secrets) work in all environments
- Basic CI pipeline runs on push

**Dependencies:** T-001  
**Complexity:** Low

---

### T-003: Create Shared Types and Constants Package
**Description:**  
Define all core TypeScript types (User, Bot, Match, Deck, Card, AI_Template, Stats, etc.) in a shared location.

**Acceptance Criteria:**
- Clean `types/` folder with well-documented interfaces
- Used across routes and islands without duplication

**Dependencies:** T-001  
**Complexity:** Low

---

## 2. Deno KV Data Layer

### T-004: Design and Implement Core KV Key Patterns + Helper Functions
**Description:**  
Create a clean, consistent key structure and helper functions for all main entities (users, bots, matches, decks, transactions).

**Acceptance Criteria:**
- Documented key patterns in `docs/kv-keys.md`
- Reusable helper functions for get/set/list/atomic operations
- No magic strings scattered in code

**Dependencies:** T-003  
**Complexity:** Medium

---

### T-005: Implement User Model and Authentication with Deno KV
**Description:**  
User registration, login, session management, and profile using Deno KV.

**Acceptance Criteria:**
- Users can register and log in
- JWT or secure session handling works
- Protected routes function correctly

**Dependencies:** T-004  
**Complexity:** Medium

---

### T-006: AI Template (Clanker Base) Model and Seeding
**Description:**  
Create AI_Template model with multi-dimensional base stats and seed initial templates.

**Acceptance Criteria:**
- At least 6–8 starter AI Templates exist with balanced stats
- Admin route or script to seed them

**Dependencies:** T-004  
**Complexity:** Low

---

### T-007: Bot Model, Upgrades, and Global Pool Logic
**Description:**  
Bot creation, applying upgrades, calculating effective stats, and managing the global pool.

**Acceptance Criteria:**
- Providers can create bots from templates + upgrades
- Effective stats are correctly calculated
- Bots can be loaned into / removed from the global pool

**Dependencies:** T-006, T-004  
**Complexity:** Medium-High

---

### T-008: Match Model and State Management in KV
**Description:**  
Store and manage match state, participants, and results in Deno KV.

**Acceptance Criteria:**
- Match creation and state updates work reliably
- Active matches can be queried efficiently

**Dependencies:** T-004  
**Complexity:** Medium

---

### T-009: Deck and Card Model + Player Decks
**Description:**  
Card definitions, player decks, and ownership.

**Acceptance Criteria:**
- Cards can be defined with effects
- Players have decks they can equip

**Dependencies:** T-004  
**Complexity:** Medium

---

## 3. Game Simulation Engine

### T-010: Build Authoritative Match Simulation Core Loop
**Description:**  
Create the main simulation engine that runs matches for all three modes.

**Acceptance Criteria:**
- Supports Fronts, King of the Hill, and Free-for-All (with storm)
- Runs at consistent tick rate server-side
- Produces deterministic results when given same inputs

**Dependencies:** T-008  
**Complexity:** High

---

### T-011: Implement Mode-Specific Logic (Fronts, King of the Hill, Free-for-All)
**Description:**  
Detailed logic for tile control, hill capture, battle royale storm, etc.

**Acceptance Criteria:**
- All three modes behave as described in game design
- Clear win conditions and scoring

**Dependencies:** T-010  
**Complexity:** High

---

### T-012: Bot AI Behavior System (Stat-Driven)
**Description:**  
Rule-based behavior for bots using their effective stats (Vision, Thinking, Combat, etc.).

**Acceptance Criteria:**
- Bots react differently based on their stat profiles
- Behavior feels distinct per Clanker archetype

**Dependencies:** T-010, T-007  
**Complexity:** High

---

## 4. Stat & Deck System

### T-013: Central Stat Calculation Engine
**Description:**  
System that calculates a bot’s effective stats by combining base stats + upgrades + active deck buffs.

**Acceptance Criteria:**
- Accurate real-time stat calculation
- Supports temporary and permanent modifiers

**Dependencies:** T-007, T-009  
**Complexity:** Medium-High

---

### T-014: Deck Effect Processor (Card Application During Match)
**Description:**  
Logic to apply card effects when a bettor plays a card during a live match.

**Acceptance Criteria:**
- Cards can be played at any time during a match (with cooldowns)
- Effects are correctly applied to the backed bot only
- Effects have proper duration and removal

**Dependencies:** T-013  
**Complexity:** High

---

### T-015: Card Definitions and Balance (Initial Set)
**Description:**  
Create 10–15 starter cards with varied effects across stat categories.

**Acceptance Criteria:**
- Cards feel strategic and balanced
- Clear documentation of each card’s effect

**Dependencies:** T-009  
**Complexity:** Medium

---

## 5. WebSocket Real-time Layer

### T-016: WebSocket Handler and Room Management in Fresh
**Description:**  
Create WebSocket route handler with match-based rooms.

**Acceptance Criteria:**
- Clients can connect to `/ws/match/[id]`
- Multiple clients in same match receive broadcasts
- Basic reconnection handling on client

**Dependencies:** T-001  
**Complexity:** Medium

---

### T-017: Live Match State Broadcasting
**Description:**  
Periodically broadcast match state and important events to all connected clients in a room.

**Acceptance Criteria:**
- Clients receive live updates without excessive bandwidth use
- Important events (kills, objectives, deck plays) are broadcast immediately

**Dependencies:** T-016, T-010  
**Complexity:** Medium-High

---

### T-018: Real-time Deck Play Input Handling
**Description:**  
Allow bettors to send card plays via WebSocket and have them processed immediately.

**Acceptance Criteria:**
- Card plays are validated and applied in real time
- Feedback is sent back to the player and broadcast to the room

**Dependencies:** T-014, T-016  
**Complexity:** High

---

## 6. Fresh Frontend & Islands

### T-019: Main Layout and Navigation (Fresh)
**Description:**  
Create the main app layout, navigation, and shared components.

**Acceptance Criteria:**
- Clean, responsive layout matching game style
- Navigation between home, arenas, profile, provider tools

**Dependencies:** T-001  
**Complexity:** Low-Medium

---

### T-020: Home / Arena Lobby Page
**Description:**  
Page showing available/upcoming matches and quick join options.

**Acceptance Criteria:**
- Users can browse and join matches
- Live status of matches is visible

**Dependencies:** T-019  
**Complexity:** Medium

---

### T-021: [UI TICKET] Recreate In-Game Pop-ups Design (Pixel-Perfect)
**Description:**  
Recreate the attached design as a pixel-perfect, production-ready web page/component set.

**Exact Requirement:**  
"Recreate the attached design as a pixel-perfect, production-ready web page. Match the layout, spacing, typography, colors, and imagery exactly, and implement it with clean, semantic markup and modern CSS. Make it fully responsive across mobile, tablet, and desktop, add tasteful hover states and scroll animations that fit the design's style, and where any detail is ambiguous, make polished, on-brand decisions that elevate the original."

**Acceptance Criteria:**
- All four pop-ups (Tiny Alley, Gift of Hades, Invite to the Gang, Resurrection) match the reference image extremely closely
- Fully responsive
- Hover states and subtle animations feel premium
- Usable as reusable Fresh components / islands
- Works in both light and dark game themes

**Dependencies:** T-019  
**Complexity:** Medium-High  
**Priority:** High (visual foundation)

---

### T-022: Live Match Viewer Island
**Description:**  
Interactive island that shows the live arena state, event log, and bot statuses.

**Acceptance Criteria:**
- Real-time updates via WebSocket
- Clear visualization of the current mode state
- Shows which bot the current user is backing

**Dependencies:** T-017, T-021  
**Complexity:** High

---

### T-023: Deck Player Island (During Match)
**Description:**  
Interface for bettors to view their hand and play cards in real time during a match.

**Acceptance Criteria:**
- Cards can be played with one click
- Cooldowns and restrictions are respected
- Visual feedback when a card is played and its effect applied

**Dependencies:** T-018, T-022  
**Complexity:** High

---

## 7. Provider & Bot Management

### T-024: Provider Dashboard
**Description:**  
Main screen for Providers to see their bots, earnings, and create new ones.

**Acceptance Criteria:**
- Overview of owned bots and their performance
- Clear path to create new bots

**Dependencies:** T-007  
**Complexity:** Medium

---

### T-025: Bot Creation Flow (Fresh Island + Routes)
**Description:**  
Full flow for Providers to select AI template, apply upgrades, and loan the bot into the pool.

**Acceptance Criteria:**
- User can go through the entire creation process
- Upgrades are applied correctly and visible in preview

**Dependencies:** T-007, T-024  
**Complexity:** Medium-High

---

### T-026: Upgrade System (Per-Stat Cards + Craft Coins)
**Description:**  
Logic and UI for purchasing and applying separate upgrades for different stats.

**Acceptance Criteria:**
- Separate upgrade paths for Vision, Damage, Reload, etc.
- Craft coin economy integration

**Dependencies:** T-007  
**Complexity:** Medium-High

---

## 8. Betting, Backing & Match Experience

### T-027: Match Backing Flow (Choose Bot + Equip Deck)
**Description:**  
Allow users to back one bot per match and equip a deck before the match starts.

**Acceptance Criteria:**
- Only one backer per bot is enforced
- Deck selection is clear and intuitive

**Dependencies:** T-008, T-009  
**Complexity:** Medium

---

### T-028: Direct Pairing with Friends’ Bots (Non-Tournament)
**Description:**  
Feature to let users directly back a specific bot created by a friend (bypassing random pool).

**Acceptance Criteria:**
- Users can search/select friend’s bot
- Backing works the same as pool bots

**Dependencies:** T-027  
**Complexity:** Medium

---

### T-029: Post-Match Results and Payouts
**Description:**  
Show match results, individual performance, and automatic payouts to winners.

**Acceptance Criteria:**
- Clear results screen
- Balance is updated correctly after match

**Dependencies:** T-010, T-008  
**Complexity:** Medium

---

## 9. Economy, Progression & Tournaments

### T-030: Virtual Economy Core (Balance, Transactions, Sinks)
**Description:**  
Core economy system including daily rewards, credit sinks, and transaction history.

**Acceptance Criteria:**
- All currency movements are recorded
- Basic anti-inflation measures in place

**Dependencies:** T-005  
**Complexity:** Medium

---

### T-031: Tournament System Foundation (Weekend Events)
**Description:**  
Basic structure for weekend team tournaments (scheduling, bracket, entry).

**Acceptance Criteria:**
- Tournaments can be created and scheduled
- Team formation is possible

**Dependencies:** T-008  
**Complexity:** High  
**Note:** Real money payouts come in a later phase

---

### T-032: Real Money Tournament Payout Logic (Preparation)
**Description:**  
Prepare the system for real money payouts in tournaments (ledger, admin approval flow).

**Acceptance Criteria:**
- Clear separation between virtual and real money flows
- Admin can mark tournament payouts

**Dependencies:** T-031  
**Complexity:** Medium  
**Note:** Actual payment integration is out of MVP scope

---

## 10. Testing, Polish & Deployment

### T-033: End-to-End Core Loop Testing
**Description:**  
Test the full flow: Create bot → Back bot + equip deck → Play match → See deck influence → Receive payout.

**Acceptance Criteria:**
- Core loop works reliably from start to finish

**Dependencies:** Most previous tickets  
**Complexity:** High

---

### T-034: Performance & WebSocket Load Testing
**Description:**  
Basic load testing of WebSocket connections and simulation under concurrent users.

**Acceptance Criteria:**
- System remains stable with 50+ concurrent users in one match

**Dependencies:** T-016, T-017  
**Complexity:** Medium

---

### T-035: Final UI Polish and Responsiveness Pass
**Description:**  
Overall visual and UX polish across the application, including mobile experience.

**Acceptance Criteria:**
- App feels premium and consistent
- Fully responsive on mobile, tablet, and desktop

**Dependencies:** T-021, T-022, T-023  
**Complexity:** Medium

---

## Summary

This list contains **35 tickets** covering the full development of Clanker Arena MVP with the current stack and mechanics.