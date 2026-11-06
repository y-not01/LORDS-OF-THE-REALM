# LORDS OF THE REALM - 3D Medieval Grand Strategy Sandbox

A playable 3D medieval grand strategy sandbox game built with React, Three.js, Tailwind CSS, and full-stack Express with Gemini API integration. The player leads a noble house upon a living medieval parchment map, managing resources, interacting with four simulated AI rival lords, commanding marching armies in real-time tactical clashes, and navigating branching narrative dilemmas.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following gameplay and visual directions were confirmed in Phase 1:
> - **Visual Style**: Medieval parchment atlas with 3D miniature terrain, parchment relief textures, illuminated gold kingdom borders, and warm atmospheric lighting.
> - **Player House**: Choice of 3 distinct noble starting houses (House Sterling of the Merchant Coast, House Valen of the Iron Crags, and House Morwen of the Riverlands) with specialized resource/military traits.
> - **Tactical Battles**: Real-time troop marching with battle theater tactics (Flank, Shield Wall, Charge, Archer Volley, Tactical Retreat) and terrain modifiers.

---

### 1. Overview & Core Concept

**Lords of the Realm** immerses the player into the feudal intrigue of 12th-century sovereign states. As a newly crowned lord, the player commands their home territory, balances a fragile feudal economy (Gold, Food, Population, Soldiers, Prestige), commands marching armies across 3D terrain, bargains and conspires with distinct AI-controlled lords, and makes life-or-death decisions in procedurally- and AI-driven narrative chronicles.

- **Target Audience**: Fans of *Crusader Kings III*, *Mount & Blade*, and classic grand strategy titles like *Total War* and *Knights of Honor*.
- **Key Value**: A seamless blend of interactive 3D tactical map exploration, character-driven feudal diplomacy, real-time army movements with active battle maneuvers, and dynamic storytelling events with tangible realm consequences.

---

### 2. User Experience & Visual Design

#### A. Key User Flows
1. **House Selection & Inauguration**: The player chooses between 3 noble houses:
   - *House Sterling*: Wealth & commerce (+25% Gold income, high merchant prestige).
   - *House Valen*: Iron discipline (+20% Soldier attack, veteran levies).
   - *House Morwen*: Agricultural heartland (+30% Granary yield, rapid population growth).
2. **3D Parchment World Navigation**: 
   - Smooth 3D camera controls: Pan (drag / WASD), Orbit / Tilt (right-click / Alt+drag), Zoom (wheel / touch pinch), and quick-focus presets.
   - Interactive territories with illuminated borders, miniature 3D castles with heraldic banners, mountain ranges, lush tree groves, and winding rivers.
   - Hover and click raycasting: Clicking any castle or province focuses the camera and displays a rich medieval dossier.
3. **Realm Management & Feudal Economy**:
   - Seasonal cycles (Spring, Summer, Autumn, Winter) impacting food production and military attrition.
   - Tax rates (Low, Moderate, Harsh) affecting Gold and Realm Stability.
   - Granary distribution rationing to stave off famine.
   - Castle upgrades: Stone Walls, Armory, Marketplace, Granaries, and Watchtowers.
4. **Feudal Diplomacy & AI Rival Lords**:
   - 4 Predefined rival lords with distinct personalities, goals, and voices:
     - **Lord Edmund (The Iron Boar)**: Ambitious militarist; respects strength, despises weakness.
     - **Lady Eleanor (The Golden Swan)**: Strategic diplomat; favors alliances and lucrative trade pacts.
     - **Lord Blackwood (The Shadow Raven)**: Cautious opportunist; exploits vulnerable borders and signs non-aggression treaties.
     - **King Aldric (The High Sovereign)**: Regal autocrat; demands regular tribute and fealty.
   - Actions: Propose Non-Aggression Pact, Sign Alliance, Open Trade Route, Demand Tribute, Send Diplomatic Gift, Threaten, or Declare War.
5. **Real-Time Troop Movement & Tactical Combat**:
   - Raise levies and recruit specialized units (Spearmen, Knights, Longbowmen).
   - Deploy armies on the 3D map; units march visibly along territory waypoints with heraldic banners.
   - Collision triggers a real-time Tactical Battle Theater overlay:
     - Dynamic troop clash simulation based on army composition, morale, terrain advantage (high ground, river crossing, fortifications).
     - Tactical commands in battle: *Frontal Charge*, *Shield Wall Defense*, *Cavalry Flank*, *Archer Volley*, and *Order Tactical Retreat*.
     - Victory grants territory annexation, plunder, and prestige; defeat forces retreat or capture.
6. **Dynamic Chronicle & Event System**:
   - Contextual feudal events (Border Raids, Heretic Uprisings, Wandering Bards, Succession Feuds, Trade Delegations).
   - Server-side Gemini API generates adaptive narrative vignettes with multiple choice consequences; backed by an instant offline template system.
   - Historical Chronicle ledger recording every battle, treaty, and royal decree.

#### B. Visual Identity & Theme
- **Aesthetic Direction**: Medieval illuminated manuscript meets tactile miniature war table.
- **Color Palette**:
  - Dominant Canvas: Deep obsidian navy (`#090d16`, `#0e1626`) and aged vellum parchment (`#f4ecd8`, `#e8dcbe`).
  - Structural Accents: Antique leaf gold (`#d4af37`, `#c59b27`), royal heraldic crimson (`#991b1b`), deep forest emerald (`#14532d`), and regal cobalt (`#1e3a8a`).
  - Territory Inks: House Sterling (Gilded Amber), House Valen (Iron Crimson), House Morwen (Verdant Green), House Edmund (Boar Blood Red), House Eleanor (Swan Azure), House Blackwood (Raven Purple), King Aldric (Imperial Gold).
- **Typography & Hierarchy**:
  - Display / Headings: `Cinzel` / `Cinzel Decorative` (Google Fonts) with Roman small-caps.
  - Body & UI: `Plus Jakarta Sans` for crisp legibility and spatial clarity.
  - Metrics / Numbers: `font-mono tabular-nums` for gold, soldier counts, and dates.
- **Component Styling & Layout**:
  - Unobstructed center 3D viewport with collapsible glass-vellum bottom dock for realm modes (`Realm`, `Economy`, `Military`, `Diplomacy`, `Chronicle`).
  - Top bar featuring current resources, year/season, speed toggles (Pause, 1x, 2x, 3x), and House crest.
  - Slide-out parchment drawers for detailed Province Inspection and Diplomatic Envoy dialogs.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Direct Three.js with Custom Shaders vs. React Three Fiber**
  - *Chosen Approach*: Clean, idiomatic Three.js with dedicated modular managers (`TerrainManager`, `BuildingManager`, `ArmyManager`, `CameraRig`) mounted inside a React container.
  - *Why*: Provides zero-overhead rendering, full control over software WebGL guards (`isSoftwareGl`), custom procedural parchment water/border shaders, and precise raycasting performance without fiber reconciliation stalls.
  - *Alternatives Considered*: Pure 2D canvas was rejected to meet the prompt's explicit requirement for an immersive 3D world map.

- **Decision 2: Procedural 3D Assets vs. External GLB Models**
  - *Chosen Approach*: Procedural multi-part `THREE.Group` models (towers, keeps, battlements, wall sections, spruce trees, jagged mountain peaks, banners, unit pawns) built with code and canvas-drawn textures.
  - *Why*: Guarantees zero 404s, instant loading without external network latency, and permits dynamic faction-color tinting directly on banner materials.

- **Decision 3: Dual-Engine Narrative System (Gemini API + Offline Fallback)**
  - *Chosen Approach*: Server-side `/api/chronicle/event` endpoint powered by `@google/genai` (`gemini-3.8-flash`) with structured JSON outputs, accompanied by a comprehensive offline procedural dilemma catalog.
  - *Why*: Delivers limitless personalized narrative flavor when online, while guaranteeing instant zero-lag gameplay if offline or while keys are being configured.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        LORDS OF THE REALM                              │
├────────────────────────────────────────────────────────────────────────┤
│                           Top HUD Bar                                  │
│  [House Crest] [Gold] [Food] [Poles] [Soldiers] [Prestige] [Date/Spd]  │
├────────────────────────────────────────┬───────────────────────────────┤
│                                        │                               │
│         Interactive 3D Viewport        │     Province / Diplomatic     │
│   - Procedural Parchment Terrain       │         Sliding Dossier       │
│   - Mountain Ranges, Rivers, Forests   │  - Lord Portrait & Persona    │
│   - 3D Castles with Faction Banners    │  - Garrison & Upgrades        │
│   - Marching Armies & Battle Markers   │  - Treaties & Actions         │
│   - Camera Orbit / Pan / Tilt Controls │  - War Declaration            │
│                                        │                               │
├────────────────────────────────────────┴───────────────────────────────┤
│             Collapsible Bottom Dock (Zero Center Viewport Occlusion)   │
│  [Realm Overview] [Buildings] [Recruit Armies] [Diplomacy] [Chronicle] │
└────────────────────────────────────────────────────────────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
       Client Game Engine              Server-Side API (Express)
  - Seasonal Tick & Resource Math     - POST /api/chronicle/event (Gemini)
  - AI Lord Behavior State Machine    - User-Agent: 'aistudio-build'
  - Real-Time Battle Simulator        - Structured JSON Output Schema
```

#### Core Data Entities:
1. **Territory**:
   - `id`, `name`, `ownerId` (Lord ID), `position` `[x, z]`, `type` (`plains`, `mountains`, `riverland`, `coast`).
   - `population`, `taxRate`, `goldYield`, `foodYield`, `defenseRating`.
   - `buildings`: Array of active structures (`castleKeep`, `marketSquare`, `barracks`, `stoneWalls`, `granary`).
   - `garrison`: Soldier count and fortification bonus.
2. **Lord / Noble House**:
   - `id`, `name`, `title`, `houseName`, `sigilColor`, `portraitIcon`.
   - `personality`: `aggressive`, `diplomatic`, `opportunistic`, `imperial`.
   - `militaryStrength`, `prestige`, `gold`, `territories`: String array.
   - `diplomaticStatus`: Map of other lords (`allied`, `peace`, `truce`, `war`, `vassal`).
   - `opinion`: Numeric value (-100 to +100).
3. **Army Unit**:
   - `id`, `ownerId`, `name`, `size`, `morale`, `currentPosition` `[x, z]`, `targetTerritoryId`, `isMarching`, `state` (`idle`, `marching`, `battling`).
4. **Battle Encounter**:
   - `attackerId`, `defenderId`, `territoryId`, `attackerTroops`, `defenderTroops`, `phase`, `tacticalAdvantage`.

---

### 5. Implementation Phases & Deliverables

1. **Dependencies & Project Configuration**:
   - Install `three` and `@types/three`.
   - Configure Tailwind v4 `@custom-variant dark` and custom medieval color tokens.
   - Set up Express backend server for Gemini narrative chronicle generation (`server.ts`).
2. **Three.js 3D World Map Engine**:
   - Procedural parchment relief terrain mesh with ocean depth shading and compass rose.
   - 3–12 part procedural medieval castles (conical towers, crenelated walls, heraldic banners).
   - Mountain meshes with snow caps, procedural instanced pine forests, and winding blue rivers.
   - Animated marching armies represented by knight banners and unit figurines.
   - Smooth mouse/touch camera controls (damping, collision bounds, territory click raycasting).
3. **Feudal Economy & Realm Management**:
   - Real-time game clock (seasons, days, pause, 1x/2x/3x speed).
   - Resource updates: Gold taxes, Food harvests/consumption, population growth, troop upkeep.
   - Building construction and upgrades with visible visual enhancements on the 3D map.
4. **AI Lords & Diplomatic Simulation**:
   - Autonomous AI routines: Rival lords recruit troops, expand territories, form pacts, and initiate wars.
   - Comprehensive diplomatic interface with response calculations based on lord personality and relative military power.
5. **Real-Time Tactical Military & Battle Theater**:
   - Waypoint marching for armies across territory borders.
   - Interactive Battle Theater modal when hostile armies clash: real-time combat maneuvers, morale meters, casualty updates, and siege outcomes.
6. **Chronicle & Gemini Narrative Event System**:
   - Server-side Gemini API route for dynamic medieval dilemmas.
   - Narrative choice modal with immediate gameplay impacts (Gold, Stability, Troops, Treaties).
   - Chronicle log tracking the history of the realm.
7. **Verification & Polish**:
   - TypeScript linting and build validation.
   - Performance tuning for software WebGL and high-DPI screens.
