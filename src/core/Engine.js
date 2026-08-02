import { GameState } from './GameState.js';
import { UI } from './UI.js';
import { Input } from './Input.js';
import { GameRegistry } from '../games/GameRegistry.js';
import { SoundService } from '../services/SoundService.js';

export const Engine = {
    init() {
        // Setup canvas reference
        GameState.canvas = document.getElementById('gameCanvas');
        GameState.ctx = GameState.canvas.getContext('2d');

        // Bind Engine to window so UI and mini-games can easily interact with it
        window.Engine = this;
        window.shakeCamera = (duration, intensity) => this.shakeCamera(duration, intensity);

        // Initialize particles list
        GameState.particles = [];
        GameState.cameraShake = null;

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

    shakeCamera(duration = 200, intensity = 6) {
        GameState.cameraShake = {
            endTime: performance.now() + duration,
            intensity: intensity
        };
    },

    spawnParticles(x, y, color = '#f59e0b', count = 15, speed = 100) {
        if (!GameState.particles) {
            GameState.particles = [];
        }
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * speed + 30;
            GameState.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                r: Math.random() * 3.5 + 1.5,
                color: color,
                life: Math.random() * 0.6 + 0.4 // duration in seconds
            });
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

        // Start game BGM and stop lobby BGM
        SoundService.stopBgm();
        SoundService.startGameBgm();

        // Reset visual effects and switch state
        GameState.visualEffects = [];
        GameState.particles = [];
        GameState.cameraShake = null;
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

        // Update and draw active game under the camera-shake scope
        ctx.save();
        
        // Apply camera-shake if active
        if (GameState.cameraShake && timestamp < GameState.cameraShake.endTime) {
            const dx = (Math.random() - 0.5) * GameState.cameraShake.intensity;
            const dy = (Math.random() - 0.5) * GameState.cameraShake.intensity;
            ctx.translate(dx, dy);
        }

        if (GameState.currentGameInstance) {
            GameState.currentGameInstance.update(dt);
            GameState.currentGameInstance.draw(ctx);
        }
        
        ctx.restore();

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

        // Update and render particles
        if (GameState.particles) {
            for (let i = GameState.particles.length - 1; i >= 0; i--) {
                const p = GameState.particles[i];
                p.x += p.vx * (dt / 1000);
                p.y += p.vy * (dt / 1000);
                p.life -= dt / 1000;
                
                ctx.save();
                ctx.globalAlpha = Math.max(0, p.life * 1.5);
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                
                if (p.life <= 0) {
                    GameState.particles.splice(i, 1);
                }
            }
        }

        // Request next frame
        GameState.animationId = requestAnimationFrame((ts) => this.gameLoop(ts));
    }
};
