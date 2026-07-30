# Rules and Context for Potato Arcade (ארקייד הבטטה) 🍠

This project is a modular arcade platform consisting of 30 canvas-based mini-games.

## Project Technologies
- **Core**: HTML5, native ES Modules (ESM), Canvas API
- **Styling**: Tailwind CSS loaded via CDN (`index.html`) + Custom CSS (`src/styles/style.css`)
- **Server**: Portable PowerShell server script `start_game_server.ps1` hosting the workspace at `http://localhost:8000`

---

## Directory Layout
- `index.html` - Contains DOM overlays (HUDs), start screen, and game overlays.
- `src/main.js` - Application entry point.
- `src/styles/style.css` - Custom styles (shaking, button animations).
- `src/core/` - Core engine services:
  - `GameState.js` - Global state (scores, lives, state flags).
  - `Engine.js` - Main Game Loop, resize events, active game instantiation.
  - `UI.js` - UI screens, showing/hiding HUDs, visual popups.
  - `Input.js` - Keyboard and pointer (mouse/touch) event routing.
- `src/games/` - Mini-game modules:
  - `MiniGame.js` - Base class with lifecycles: `init()`, `update()`, `draw()`, `handleInput()`, `destroy()`.
  - `GameRegistry.js` - Maps game numbers (1-30) to their respective classes.
  - `Game1_Repair.js` to `Game30_PhoneGame.js` - Independent game classes.
- `src/services/` - Future services:
  - `Auth.js` - Stub for database login/signup.
  - `Leaderboard.js` - Stub saving high scores to LocalStorage.

---

## Instructions for Agents
1. **Maintain Architecture**: When creating, editing, or refactoring games, do NOT write monolithic functions. Keep logic strictly modularized inside classes extending `MiniGame.js`.
2. **Global Integration**: Do not add inline event listeners dynamically if they can be handled via `Input.js` or UI bindings.
3. **HTML HUDs**: The HTML overlays for all HUDs are declared in `index.html`. Modify `index.html` only when altering HUD layout, and use `UI.js` to show/hide them.
4. **Heebo Font & RTL Support**: The interface is right-to-left (RTL) and uses the 'Heebo' font. Ensure Hebrew strings are formatted correctly and UI elements do not break.
5. **No Bundlers**: This project does not use Node.js or npm packages. Use native ES Modules only (`import`/`export` with `.js` extensions).

---

## Git Version Control Instructions for Agents
- **Git Path**: Git is installed at the user-scoped path:
  `C:\Users\noamn\AppData\Local\Programs\Git\cmd\git.exe`
- **Command Invocation**: When executing Git commands in PowerShell, always invoke it using its absolute path. For example:
  `& "C:\Users\noamn\AppData\Local\Programs\Git\cmd\git.exe" status`
  `& "C:\Users\noamn\AppData\Local\Programs\Git\cmd\git.exe" commit -am "My message"`
- **Avoid Plain Commands**: Do not invoke plain `git` commands, as the environment variable PATH might not be reloaded in new agent shell sessions.

