import { GameState } from './GameState.js';
import { UI } from './UI.js';
import { Input } from './Input.js';
import { GameRegistry } from '../games/GameRegistry.js';

export const Engine = {
    init() {
        // Setup canvas reference
        GameState.canvas = document.getElementById('gameCanvas');
        GameState.ctx = GameState.canvas.getContext('2d');

        // Initialize UI and Input
        UI.init();
        Input.init(GameState.canvas);

        // Bind start game handler in UI
        UI.onStartGameWithDiff = (diff) => this.startGameWithDiff(diff);

        // Canvas resize handling
        window.addEventListener('resize', () => this.resize());
        this.resize();
    },

    resize() {
        if (!GameState.canvas) return;
        
        GameState.canvas.width = UI.screens.container.clientWidth;
        GameState.canvas.height = UI.screens.container.clientHeight;
        
        // Notify the current game if it has a resize method
        if (GameState.currentGameInstance && typeof GameState.currentGameInstance.resize === 'function') {
            GameState.currentGameInstance.resize(GameState.canvas.width, GameState.canvas.height);
        }
    },

    startGameWithDiff(diff) {
        GameState.currentDifficulty = diff;
        UI.screens.difficulty.classList.add('hidden');
        UI.screens.globalExitBtn.classList.remove('hidden');

        const gameNum = GameState.pendingGame;
        const GameClass = GameRegistry[gameNum];

        if (!GameClass) {
            console.error(`Game number ${gameNum} not found in GameRegistry.`);
            return;
        }

        // Clean up previous game if any
        if (GameState.currentGameInstance) {
            GameState.currentGameInstance.destroy();
        }

        // Initialize new game instance
        GameState.currentGameInstance = new GameClass();
        GameState.currentGameInstance.init(diff);

        // Setup restart handler
        GameState.restartCurrentGame = () => this.startGameWithDiff(diff);
        
        // Show correct HUD overlay
        UI.showHUD(gameNum);

        // Reset visual effects and switch state
        GameState.visualEffects = [];
        GameState.state = `GAME${gameNum}`;
        GameState.lastTime = performance.now();

        // Start game loop if not already running
        if (!GameState.animationId) {
            GameState.animationId = requestAnimationFrame((ts) => this.gameLoop(ts));
        }
    },

    gameLoop(timestamp) {
        // Stop looping if the game state is no longer active
        if (GameState.state === 'START' || GameState.state === 'GAMEOVER' || GameState.state === 'DIFFICULTY') {
            GameState.animationId = null;
            return;
        }

        let dt = timestamp - GameState.lastTime;
        if (dt > 100) dt = 16; // Prevent massive frame jumps if tab is backgrounded
        GameState.lastTime = timestamp;

        const ctx = GameState.ctx;
        const canvas = GameState.canvas;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Update and draw active game
        if (GameState.currentGameInstance) {
            GameState.currentGameInstance.update(dt);
            GameState.currentGameInstance.draw(ctx);
        }

        // Render global floating visual effects (emojis)
        for (let i = GameState.visualEffects.length - 1; i >= 0; i--) {
            let v = GameState.visualEffects[i];
            v.y += v.vy * (dt / 1000);
            v.life -= dt / 1000;
            ctx.save();
            ctx.globalAlpha = Math.max(0, v.life);
            ctx.font = '30px Arial';
            ctx.fillStyle = v.color || 'white';
            ctx.textAlign = 'center';
            ctx.fillText(v.emoji, v.x, v.y);
            ctx.restore();
            if (v.life <= 0) {
                GameState.visualEffects.splice(i, 1);
            }
        }

        // Request next frame
        GameState.animationId = requestAnimationFrame((ts) => this.gameLoop(ts));
    }
};
