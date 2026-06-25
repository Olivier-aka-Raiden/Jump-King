# Jump-King AI — Genetic Algorithm Trainer

A p5.js reimplementation of the Jump-King 2D platformer, with a built-in **Genetic Algorithm** training system to evolve an AI that learns to climb the tower.

Based on the original game by [Code Bullet](https://github.com/Code-Bullet/Jump-King), ported for AI training.

## Quick Start

Open `index.html` in a browser. No build step required.

| Mode | How to enable | What it does |
|------|--------------|--------------|
| **Human play** | `sketch.js` → `testingSinglePlayer = true` | Play with arrow keys + spacebar |
| **GA training** | `sketch.js` → `testingSinglePlayer = false` | AI population learns to climb via evolution |
| **Replay best** | Press `B` during training | Watch the best player from last generation |

## Game Mechanics

### Physics
- **Jump**: hold spacebar to charge (0→30 frames), release to jump (speed 5→22)
- **Gravity**: 0.6/frame, terminal velocity = 20
- **Horizontal**: jump speed = 8, run speed = 4
- **Ice levels**: sliding physics (friction = 0.2)
- **Blizzard levels**: wind force (max 0.3) pushes player mid-air

### Controls (Human Mode)

| Key | Action |
|-----|--------|
| ← → | Move left/right |
| Space (hold) | Charge jump |
| Space (release) | Jump |
| N | Skip to next level |
| S | Stop sounds |

## GA Training System

### Architecture

```
Population (300-600 players)
  └── Player × N
        ├── Physics state (pos, speed, onGround, ...)
        ├── Brain (sequence of AIAction instructions)
        │     └── AIAction × M
        │           ├── isJump: boolean
        │           ├── holdTime: float (0.1–1.0)
        │           └── xDirection: int (-1, 0, 1)
        └── Fitness score
```

### Key Parameters (in source)

| Variable | File | Default | Description |
|----------|------|---------|-------------|
| `testingSinglePlayer` | `sketch.js` | `true` | `true` = human, `false` = GA training |
| `population` size | `sketch.js` | `600` | Number of players per generation |
| `startingPlayerActions` | `sketch.js` | `5` | Initial instruction count per brain |
| `increaseActionsByAmount` | `sketch.js` | `5` | Instructions added every N generations |
| `increaseActionsEveryXGenerations` | `sketch.js` | `10` | Generations between action increases |
| `evolationSpeed` | `sketch.js` | `1` | Updates per frame (↑↓ to adjust) |
| `mutationRate` | `Brain.js` | `0.1` | Per-instruction mutation chance |
| `chanceOfNewInstruction` | `Brain.js` | `0.02` | Chance to replace with random action |
| `jumpChance` | `Brain.js` | `0.5` | Probability a random action is a jump |
| `chanceOfFullJump` | `Brain.js` | `0.2` | Chance a random jump is max strength |
| `maxJumpTimer` | `Player.js` | `30` | Frames to charge a full jump |
| `minJumpSpeed` | `Player.js` | `5` | Minimum jump speed |
| `maxJumpSpeed` | `Player.js` | `22` | Maximum jump speed |

### AI Action Lifecycle

1. **Player lands** → requests next action from Brain
2. **StartCurrentAction**: sets `jumpHeld`, `leftHeld`, `rightHeld` based on action
3. **Waits** `holdTime × 30` frames
4. **EndCurrentAction**: releases jump (triggers `Jump()`) and clears direction held
5. **Waits** for player to land again → repeat

### Natural Selection

Every generation (when all players finish their instructions):

1. **Calculate fitness**: `heightThisLevel² + 500,000 × coins`
2. **Elitism**: clone the best player directly to next generation
3. **Roulette selection**: weighted random parent selection by fitness
4. **Crossover**: clone parent (no crossover — mutation-only)
5. **Targeted mutation**: if parent `fellToPreviousLevel`, the exact falling action is mutated at 100% rate
6. **Standard mutation**: remaining actions have `mutationRate` (10%) chance to mutate
7. **Action increase**: every N generations, all brains get `increaseActionsByAmount` new random actions appended

### Checkpoint System

When a player reaches a new level for the first time, their full game state is saved (`playerStateAtStartOfBestLevel`). The player then starts from that checkpoint in the next generation. The `parentReachedBestLevelAtActionNo` field ensures mutations only affect actions *after* the checkpoint.

### Key Training Controls (in-session keys)

| Key | Action |
|-----|--------|
| ↑ | Increase evolution speed (+1) |
| ↓ | Decrease evolution speed (-1) |
| B | Replay best player from last generation |
| R | Reset all players to start |

## Project Structure

```
Jump-King/
├── index.html                      # Entry point (loads p5.js + all scripts)
├── sketch.js                       # Main game loop, controls, HUD
├── sketch-LAPTOP-4GTCNHGO.js       # Older version (smaller pop, no evo speed)
├── Player.js                       # Physics, AI action loop, collision, rendering
├── Brain.js                        # AI action sequences, mutation
├── Population.js                   # GA population management, natural selection
├── Level.js                        # Level class (image, lines, coins)
├── LevelSetupFunction.js           # 43 levels of collision lines (17K lines)
├── Line.js                         # Collision line (horizontal/vertical/diagonal)
├── Coin.js                         # Reward/progression coins
├── images/
│   ├── levelImages/                # 43 level background images (1.png - 43.png)
│   └── poses/                      # Player sprites (idle, jump, run*, fall, etc.)
├── sounds/                         # jump.mp3, fall.mp3, bump.mp3, land.mp3
└── libraries/                      # p5.js libraries
```

## Dashboard (Planned → Implemented)

A training control panel that overlays the right side of the game canvas.

### Current Features (Tab 1 — Controls)

| Feature | Description |
|---------|-------------|
| ▶️ Play / ⏸ Pause | Start/stop training (pauses all updates) |
| 🎚️ Speed slider | Evolution speed 1–200 (drag to adjust) |
| 🔄 Reset | Reset all players to start |
| ⏪ Replay | Replay the best player's run |
| 👤↔🤖 Mode toggle | Switch between Human play and AI training |
| Live stats | Generation, best level, height, actions, alive count, FPS, speed, best fitness |
| 📈 Fitness chart | Basic line chart over generations |

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `D` | Toggle dashboard visibility |
| ↑↓ | Adjust evolution speed (legacy) |
| B   | Replay best player (legacy) |
| R   | Reset all players (legacy) |

### Planned (Tab 2 — Params & Tab 3 — Charts)
- Mutation rate, jump chance, population size sliders
- Save/load brain JSON
- Better fitness/height charting

## License

Original game assets and concept belong to Jump King (Nexile / Ukuza).
Code by Code Bullet, modified for AI research.
