# Clanker Arena — 3D Game Visualization Tickets Only
## Three.js Arena Visualization (No Assets)

**Project:** Clanker Arena  
**Stack:** Fresh (Deno) + Three.js + WebSockets + Deno KV  
**Focus:** Only tickets related to building the 3D visual layer of matches  
**Note:** No custom 3D assets/models. Use primitives, basic geometries, and simple materials for now.

---

## 3D Game Tickets

### TG-001: Add Three.js to Fresh Project + Basic Setup
**Description:**  
Install and configure Three.js inside the Fresh project. Create a basic reusable 3D canvas component.

**Acceptance Criteria:**
- Three.js is installed and working in Fresh
- Basic `<canvas>` with a Three.js scene can be rendered inside an Island
- Scene, camera, and renderer are properly initialized and cleaned up
- Works in both development and production build

**Dependencies:** None  
**Complexity:** Low  
**Notes:** Use `@types/three` and proper cleanup to avoid memory leaks in SPA-like behavior.

---

### TG-002: Create Basic 3D Arena Scene (Top-Down Style)
**Description:**  
Build a simple top-down 3D arena scene using basic geometries (planes, boxes, cylinders) since no assets are available yet.

**Acceptance Criteria:**
- Simple arena floor with boundaries
- Basic static elements (walls, central hill for King of the Hill mode, capture points)
- Top-down or slightly angled camera view
- Scene looks clean and readable

**Dependencies:** TG-001  
**Complexity:** Low-Medium

---

### TG-003: WebSocket Integration with 3D Scene
**Description:**  
Connect the 3D scene to live match data coming from WebSockets.

**Acceptance Criteria:**
- 3D scene can subscribe to match state updates via existing WebSocket connection
- Scene reacts when new match data arrives (without full page reload)
- Basic error handling and reconnection support

**Dependencies:** TG-001, Existing WebSocket layer (T-016)  
**Complexity:** Medium

---

### TG-004: Represent Bots in 3D Scene (Using Primitives)
**Description:**  
Display bots as simple 3D objects (colored cylinders, capsules, or boxes) with labels showing their name and basic status.

**Acceptance Criteria:**
- Each participating bot appears in the 3D scene
- Bots have distinct colors or simple visual differentiation
- Basic labels (bot name + current health/status) are visible
- Bots update position when simulation sends new data

**Dependencies:** TG-003  
**Complexity:** Medium

---

### TG-005: Basic Bot Movement Visualization
**Description:**  
Make bots visually move across the arena based on simulation data.

**Acceptance Criteria:**
- Bots smoothly interpolate between positions received from the server
- Movement feels responsive but not jittery
- No major visual artifacts during position updates

**Dependencies:** TG-004  
**Complexity:** Medium

---

### TG-006: Visualize Basic Actions (Attack, Capture, etc.)
**Description:**  
Add simple visual effects when bots perform actions (attack, capture objective, take damage).

**Acceptance Criteria:**
- Simple attack indicators (projectiles or hit effects using basic particles/lines)
- Capture point progress visualization
- Damage feedback (color flash, health bar above bot)
- Effects are lightweight and performant

**Dependencies:** TG-005  
**Complexity:** Medium-High

---

### TG-007: Mode-Specific Visual Elements
**Description:**  
Add visual elements that change depending on the current match mode (Fronts, King of the Hill, Free-for-All with storm).

**Acceptance Criteria:**
- Different arena layouts or markers per mode
- Visual representation of storm / zone shrinking in Free-for-All
- Clear visual feedback for objectives (hill, capture points, etc.)

**Dependencies:** TG-002, TG-006  
**Complexity:** Medium-High

---

### TG-008: Deck Effect Visualization in 3D
**Description:**  
When a bettor plays a card, show clear visual feedback on the affected bot in the 3D scene.

**Acceptance Criteria:**
- Visual indicators appear when deck effects are applied (buff glows, particle effects, stat change popups)
- Effects are tied to the specific bot the current user is backing
- Effects are not too heavy on performance

**Dependencies:** TG-006, Deck system (T-014)  
**Complexity:** High

---

### TG-009: Camera Controls (Top-Down + Optional Free Look)
**Description:**  
Implement camera controls suitable for watching a top-down arena match.

**Acceptance Criteria:**
- Good default top-down camera
- Optional mouse/keyboard controls to pan and zoom
- Camera resets properly when switching matches or on reconnect

**Dependencies:** TG-002  
**Complexity:** Low-Medium

---

### TG-010: Performance Optimization for 3D Scene
**Description:**  
Optimize the 3D scene to run smoothly even with multiple bots and effects.

**Acceptance Criteria:**
- Scene maintains good frame rate (minimum 30-45 FPS) with 8–10 bots
- Proper use of instancing, frustum culling, and minimal draw calls where possible
- No major memory leaks after multiple matches

**Dependencies:** TG-004 to TG-008  
**Complexity:** Medium-High

---

### TG-011: Responsive 3D Canvas + UI Integration
**Description:**  
Make the 3D canvas work well alongside other UI elements (stats panel, deck interface, event log) on different screen sizes.

**Acceptance Criteria:**
- 3D scene resizes correctly on window resize and different devices
- UI panels can be shown/hidden without breaking the 3D view
- Good balance between 3D viewport and information panels

**Dependencies:** TG-001, UI layout work  
**Complexity:** Medium

---

### TG-012: Basic Match Replay / Timeline (Optional Enhancement)
**Description:**  
Allow basic replay of recent match events inside the 3D scene (using recorded events).

**Acceptance Criteria:**
- User can scrub through recent match events
- Bots move and animate according to historical data
- Useful for reviewing how deck plays affected the match

**Dependencies:** TG-005, TG-008  
**Complexity:** High  
**Priority:** Low (can be done later)

---

## Summary

These **12 tickets** focus **only** on building the 3D visual layer using Three.js.

**Important Notes:**
- No custom 3D assets/models are required (using primitives only for now).
- These tickets assume the core simulation and WebSocket systems already exist.
- The 3D visualization is meant to **enhance** the match experience, not replace the stats + event log UI.
- Start with TG-001 → TG-005 for a minimal viable 3D view.

---