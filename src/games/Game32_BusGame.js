import { MiniGame } from './MiniGame.js';
import { GameState } from '../core/GameState.js';
import { UI } from '../core/UI.js';

export class Game32_BusGame extends MiniGame {
    init(difficulty) {
        UI.screens.container.className = 'relative w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-3xl sm:shadow-2xl overflow-hidden bg-sky-300';

        this.lives = 3;
        this.distToBus = 50; // starts at 50 meters
        this.difficulty = difficulty;
        this.scrollOffset = 0;
        this.busesCaught = 0; // 0 = first bus, 1 = second bus (harder)

        // Ground level configuration
        this.groundY = GameState.canvas ? GameState.canvas.height - 100 : 500;

        // Runner configuration
        this.player = {
            x: 120,
            y: this.groundY,
            vy: 0,
            width: 45,
            height: 60,
            originalHeight: 60,
            isJumping: false,
            isDucking: false,
            duckTimer: 0,
            sprite: '🍠'
        };

        // Scroll speed and spawn rate based on difficulty
        if (difficulty === 'easy') {
            this.scrollSpeed = 260;
            this.spawnRate = 2.2;
            this.distRate = 2.2; // meters closed per second
        } else if (difficulty === 'medium') {
            this.scrollSpeed = 380;
            this.spawnRate = 1.6;
            this.distRate = 2.8;
        } else {
            this.scrollSpeed = 500;
            this.spawnRate = 1.1;
            this.distRate = 3.5;
        }

        // Store base configurations for scaling the second stage
        this.baseScrollSpeed = this.scrollSpeed;
        this.baseSpawnRate = this.spawnRate;
        this.baseDistRate = this.distRate;

        this.obstacles = [];
        this.spawnTimer = 1.0; // spawn first obstacle after 1s
        this.gravity = 1800;
        this.jumpForce = -680;
        this.shakeTimer = 0;

        this.updateUI();
    }

    resize(w, h) {
        this.groundY = h - 100;
        if (!this.player.isJumping) {
            this.player.y = this.groundY;
        }
    }

    updateUI() {
        const distEl = document.getElementById('g32-dist');
        const livesEl = document.getElementById('g32-lives');
        
        let labelText = `${Math.max(0, Math.ceil(this.distToBus))}m`;
        if (this.busesCaught === 1) {
            labelText = `🔥 ${Math.max(0, Math.ceil(this.distToBus))}m`;
        }

        if (distEl) distEl.innerText = labelText;
        if (livesEl) livesEl.innerText = '❤️'.repeat(Math.max(0, this.lives));
    }

    jump() {
        if (!this.player.isJumping && !this.player.isDucking) {
            this.player.vy = this.jumpForce;
            this.player.isJumping = true;
        }
    }

    duck(state) {
        if (state) {
            if (!this.player.isJumping) {
                this.player.isDucking = true;
                this.player.height = this.player.originalHeight * 0.55;
            }
        } else {
            this.player.isDucking = false;
            this.player.height = this.player.originalHeight;
        }
    }

    update(dt) {
        // Decrease distance to bus if runner is active
        this.distToBus -= this.distRate * (dt / 1000);
        this.updateUI();

        if (this.shakeTimer > 0) {
            this.shakeTimer -= dt / 1000;
        }

        // Catching conditions
        if (this.distToBus <= 0) {
            if (this.busesCaught === 0) {
                // First bus caught! Move to the second harder bus
                this.busesCaught = 1;
                this.distToBus = 65; // next bus starts further back

                // Scale up difficulty!
                this.scrollSpeed = this.baseScrollSpeed * 1.35; // 35% faster scroll
                this.spawnRate = this.baseSpawnRate * 0.65; // obstacles spawn 35% faster
                this.distRate = this.baseDistRate * 1.15; // close speed slightly faster

                // Clear current obstacles to avoid immediate collisions on transition
                this.obstacles = [];
                this.spawnTimer = 1.2;

                // Visual effects
                UI.createPopEffect(this.player.x, this.player.y - 45, 'עלית! אוטובוס מהיר הבא... 🚌💨', '#22c55e');
                UI.screens.container.classList.add('bg-green-100');
                setTimeout(() => UI.screens.container.classList.remove('bg-green-100'), 150);

                this.updateUI();
            } else {
                // Second bus caught! Win
                this.distToBus = 0;
                this.updateUI();
                UI.endGame("ניצחון כפול! 🚌🚌", "תפסת את שני האוטובוסים בזה אחר זה! מגיע לך רב-קו זהב.");
                return;
            }
        }

        // Lose condition 1: Bus got too far
        if (this.distToBus >= 100) {
            UI.endGame("האוטובוס ברח!", this.busesCaught === 1 ? "האוטובוס השני והמהיר ברח לך!" : "האוטובוס התרחק יותר מדי ונעלם באופק...");
            return;
        }

        // Apply gravity & physics to player
        if (this.player.isJumping) {
            this.player.vy += this.gravity * (dt / 1000);
            this.player.y += this.player.vy * (dt / 1000);

            // Land on ground
            if (this.player.y >= this.groundY) {
                this.player.y = this.groundY;
                this.player.vy = 0;
                this.player.isJumping = false;
            }
        }

        // Update background scrolling
        this.scrollOffset = (this.scrollOffset + this.scrollSpeed * (dt / 1000)) % 100;

        // Spawn obstacles
        this.spawnTimer -= dt / 1000;
        if (this.spawnTimer <= 0) {
            const types = [
                { emoji: '🛴', type: 'low', height: 35, width: 35 },
                { emoji: '💧', type: 'low', height: 15, width: 45 },
                { emoji: '🗑️', type: 'low', height: 45, width: 35 },
                { emoji: '🐦', type: 'high', height: 30, width: 35 } // requires ducking
            ];

            let chosen = types[Math.floor(Math.random() * types.length)];
            const canvasW = GameState.canvas ? GameState.canvas.width : 800;

            this.obstacles.push({
                x: canvasW + 50,
                y: chosen.type === 'high' ? this.groundY - 60 : this.groundY - chosen.height / 2,
                emoji: chosen.emoji,
                width: chosen.width,
                height: chosen.height,
                type: chosen.type
            });

            this.spawnTimer = this.spawnRate + Math.random() * 0.7;
        }

        // Update obstacles & check collision
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            let obs = this.obstacles[i];
            obs.x -= this.scrollSpeed * (dt / 1000);

            // Bounding box collision check
            let playerLeft = this.player.x - this.player.width / 2;
            let playerRight = this.player.x + this.player.width / 2;
            let playerTop = this.player.y - this.player.height;
            let playerBottom = this.player.y;

            let obsLeft = obs.x - obs.width / 2;
            let obsRight = obs.x + obs.width / 2;
            let obsTop = obs.y - obs.height / 2;
            let obsBottom = obs.y + obs.height / 2;

            if (playerRight > obsLeft && playerLeft < obsRight && playerBottom > obsTop && playerTop < obsBottom) {
                // Collision!
                this.lives--;
                this.distToBus = Math.min(99, this.distToBus + 15); // knock back
                this.updateUI();

                this.shakeTimer = 0.2;
                UI.screens.container.classList.add('shake');
                setTimeout(() => UI.screens.container.classList.remove('shake'), 200);

                UI.createPopEffect(this.player.x, this.player.y - 40, '💥');

                if (this.lives <= 0) {
                    UI.endGame("תאונת דרכים!", `נפגעת יותר מדי פעמים ולא הגעת לאוטובוס.`);
                    return;
                }

                // Remove obstacle on hit so it doesn't collide repeatedly
                this.obstacles.splice(i, 1);
                continue;
            }

            // Remove if offscreen
            if (obs.x < -100) {
                this.obstacles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        const canvasW = GameState.canvas.width;
        const canvasH = GameState.canvas.height;

        ctx.save();

        // 1. Draw Sky Gradient (Color shifts to sunset/orange on stage 2)
        let skyGrad = ctx.createLinearGradient(0, 0, 0, this.groundY);
        if (this.busesCaught === 1) {
            skyGrad.addColorStop(0, '#f97316'); // Orange sky-500
            skyGrad.addColorStop(1, '#ffedd5'); // Orange sky-100
        } else {
            skyGrad.addColorStop(0, '#7dd3fc'); // Sky-300
            skyGrad.addColorStop(1, '#bae6fd'); // Sky-200
        }
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, canvasW, canvasH);

        // 2. Draw moving city outline in background
        ctx.fillStyle = this.busesCaught === 1 ? '#ea580c' : '#94a3b8'; // darker building shadow on sunset
        let bgOffset = (this.scrollOffset * 0.2) % 100;
        for (let i = -100; i < canvasW + 200; i += 150) {
            let x = i - bgOffset;
            ctx.fillRect(x, this.groundY - 140, 90, 140);
            ctx.fillRect(x + 50, this.groundY - 180, 70, 180);
        }

        // 3. Draw pavement sidewalk / road
        ctx.fillStyle = '#64748b'; // Road
        ctx.fillRect(0, this.groundY, canvasW, canvasH - this.groundY);

        ctx.fillStyle = '#475569'; // Curb
        ctx.fillRect(0, this.groundY, canvasW, 8);

        // Draw dotted white lines on road
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.setLineDash([20, 20]);
        ctx.beginPath();
        ctx.moveTo(-this.scrollOffset * 3, this.groundY + 45);
        ctx.lineTo(canvasW + 100, this.groundY + 45);
        ctx.stroke();
        ctx.setLineDash([]); // reset

        // 4. Draw Obstacles
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        this.obstacles.forEach(obs => {
            ctx.font = `${Math.max(obs.width, obs.height) + 10}px Arial`;
            ctx.fillText(obs.emoji, obs.x, obs.y);
        });

        // 5. Draw Egged Bus 🚌 or fast coach 🚍 ahead
        let busRatio = this.distToBus / 50;
        let minBusX = this.player.x + 80;
        let maxBusX = canvasW - 120;
        let busX = minBusX + (maxBusX - minBusX) * Math.min(1.0, busRatio);

        let busShake = Math.sin(performance.now() / 40) * 2;
        
        ctx.font = '100px Arial';
        // Stage 2 is double decker bus
        let busEmoji = this.busesCaught === 1 ? '🚍' : '🚌';
        ctx.fillText(busEmoji, busX, this.groundY - 45 + busShake);

        // Draw distance banner above the bus
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.roundRect(busX - 50, this.groundY - 125, 100, 24, 6);
        ctx.fill();

        ctx.fillStyle = this.busesCaught === 1 ? '#f97316' : '#4ade80';
        ctx.font = 'bold 12px Arial';
        ctx.fillText(`${Math.max(0, Math.ceil(this.distToBus))}m`, busX, this.groundY - 113);

        // 6. Draw Player (Potato runner)
        let px = this.player.x;
        let py = this.player.y;

        if (this.shakeTimer > 0) {
            px += Math.random() * 6 - 3;
            py += Math.random() * 4 - 2;
        }

        ctx.save();
        ctx.translate(px, py);
        
        // Draw jump rotation or duck scale
        if (this.player.isDucking) {
            ctx.scale(1.3, 0.55); // Squash flat
            ctx.font = '70px Arial';
            ctx.fillText(this.player.sprite, 0, -18);
        } else if (this.player.isJumping) {
            let rotation = (performance.now() / 150) % (Math.PI * 2);
            ctx.rotate(rotation);
            ctx.font = '55px Arial';
            ctx.fillText(this.player.sprite, 0, 0);
        } else {
            let bob = Math.sin(performance.now() / 60) * 3;
            ctx.font = '55px Arial';
            ctx.fillText(this.player.sprite, 0, -25 + bob);
        }
        ctx.restore();

        ctx.restore();
    }

    handleInput(type, details) {
        if (type === 'keydown') {
            if (details.key === 'ArrowUp' || details.key === ' ' || details.key === 'w' || details.key === 'W') {
                this.jump();
            }
            if (details.key === 'ArrowDown' || details.key === 's' || details.key === 'S') {
                this.duck(true);
            }
        }
        if (type === 'keyup') {
            if (details.key === 'ArrowDown' || details.key === 's' || details.key === 'S') {
                this.duck(false);
            }
        }
        if (type === 'mousedown') {
            const canvasH = GameState.canvas ? GameState.canvas.height : 600;
            if (details.y < canvasH / 2) {
                this.jump();
            } else {
                this.duck(true);
            }
        }
        if (type === 'mouseup') {
            this.duck(false);
        }
    }

    destroy() {
        this.obstacles = [];
    }
}
