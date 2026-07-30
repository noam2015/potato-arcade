import { MiniGame } from './MiniGame.js';
import { GameState } from '../core/GameState.js';
import { UI } from '../core/UI.js';

const G31_GOOD_TYPES = [
    { e: '🍠', s: 10 }, 
    { e: '👑', s: 30 }, 
    { e: '💰', s: 20 }
];

const G31_BAD_TYPES = [
    { e: '🥾', s: -10 }, 
    { e: '🗑️', s: -5 }, 
    { e: '🐟', s: -15 }
];

export class Game31_SkyCatchGame extends MiniGame {
    init(difficulty) {
        UI.screens.container.className = 'relative w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-3xl sm:shadow-2xl overflow-hidden bg-sky-600';

        this.score = 0;
        this.time = 60;
        this.difficulty = difficulty;

        // Player configuration
        this.player = {
            x: GameState.canvas ? GameState.canvas.width / 2 : 400,
            y: GameState.canvas ? GameState.canvas.height - 90 : 500,
            size: 60,
            targetX: GameState.canvas ? GameState.canvas.width / 2 : 400,
            netWidth: 70,
            netHeight: 40
        };

        this.items = [];
        this.clouds = [];
        this.isDragging = false;
        this.shakeTimer = 0;

        // Keyboard movement state
        this.keyMoveLeft = false;
        this.keyMoveRight = false;
        this.keyboardSpeed = 500; // Pixels per second

        // Spawn rates and fall speeds based on difficulty
        if (difficulty === 'easy') {
            this.spawnInterval = 1.0;
            this.speedRange = { min: 120, max: 200 };
            this.badChance = 0.3; // 30% chance for bad items
        } else if (difficulty === 'medium') {
            this.spawnInterval = 0.6;
            this.speedRange = { min: 180, max: 320 };
            this.badChance = 0.55; // 55% chance for bad items
        } else {
            this.spawnInterval = 0.35;
            this.speedRange = { min: 250, max: 450 };
            this.badChance = 0.7; // 70% chance for bad items
        }

        this.spawnTimer = 0;

        // Create initial clouds
        const canvasW = GameState.canvas ? GameState.canvas.width : 800;
        for (let i = 0; i < 4; i++) {
            this.clouds.push({
                x: Math.random() * canvasW,
                y: Math.random() * 150 + 20,
                speed: Math.random() * 15 + 10,
                size: Math.random() * 30 + 40
            });
        }

        this.updateUI();
    }

    resize(w, h) {
        this.player.y = h - 90;
        // Keep player in bounds after resize
        this.player.x = Math.max(40, Math.min(w - 40, this.player.x));
        this.player.targetX = this.player.x;
    }

    updateUI() {
        const scoreEl = document.getElementById('g31-score');
        const timeEl = document.getElementById('g31-time');
        if (scoreEl) scoreEl.innerText = this.score;
        if (timeEl) timeEl.innerText = Math.max(0, Math.ceil(this.time));
    }

    update(dt) {
        this.time -= dt / 1000;
        this.updateUI();

        if (this.time <= 0) {
            UI.endGame("נגמר הזמן!", `הצלחת לאסוף שלל בשווי ${this.score} נקודות!`);
            return;
        }

        if (this.shakeTimer > 0) {
            this.shakeTimer -= dt / 1000;
        }

        // Smooth key movement
        const canvasW = GameState.canvas ? GameState.canvas.width : 800;
        if (this.keyMoveLeft) {
            this.player.x = Math.max(this.player.size / 2, this.player.x - this.keyboardSpeed * (dt / 1000));
            this.player.targetX = this.player.x;
        }
        if (this.keyMoveRight) {
            this.player.x = Math.min(canvasW - this.player.size / 2, this.player.x + this.keyboardSpeed * (dt / 1000));
            this.player.targetX = this.player.x;
        }

        // Smoothly interpolate player X to targetX (mouse/touch controls)
        if (!this.keyMoveLeft && !this.keyMoveRight) {
            this.player.x += (this.player.targetX - this.player.x) * 0.25;
        }

        // Update clouds
        this.clouds.forEach(c => {
            c.x += c.speed * (dt / 1000);
            if (c.x > canvasW + 100) {
                c.x = -100;
                c.y = Math.random() * 150 + 20;
            }
        });

        // Spawn falling items
        this.spawnTimer -= dt / 1000;
        if (this.spawnTimer <= 0) {
            let isBad = Math.random() < this.badChance;
            let typePool = isBad ? G31_BAD_TYPES : G31_GOOD_TYPES;
            let chosen = typePool[Math.floor(Math.random() * typePool.length)];

            this.items.push({
                x: Math.random() * (canvasW - 60) + 30,
                y: -50,
                vy: Math.random() * (this.speedRange.max - this.speedRange.min) + this.speedRange.min,
                emoji: chosen.e,
                score: chosen.s,
                size: 38,
                angle: Math.random() * Math.PI * 2,
                vAngle: (Math.random() * 4 - 2) // Rotation speed
            });

            this.spawnTimer = this.spawnInterval;
        }

        // Update items
        for (let i = this.items.length - 1; i >= 0; i--) {
            let item = this.items[i];
            item.y += item.vy * (dt / 1000);
            item.angle += item.vAngle * (dt / 1000);

            // Collision check with player's net
            // The mouth of the net is at player.y - 30. 
            // We check if the item overlaps horizontally and is at the right height.
            let netTop = this.player.y - 30;
            let dx = Math.abs(item.x - this.player.x);
            let dy = item.y - netTop;

            if (dx < this.player.netWidth / 2 + 10 && dy >= -15 && dy <= 15) {
                // Caught!
                this.score += item.score;
                this.updateUI();

                let sign = item.score > 0 ? '+' : '';
                let color = item.score > 0 ? '#4ade80' : '#f87171';
                UI.createPopEffect(item.x, item.y - 10, sign + item.score, color);

                if (item.score < 0) {
                    this.shakeTimer = 0.15; // Net shake
                    UI.screens.container.classList.add('shake');
                    setTimeout(() => UI.screens.container.classList.remove('shake'), 150);
                }

                this.items.splice(i, 1);
                continue;
            }

            // Remove if off screen
            const canvasH = GameState.canvas ? GameState.canvas.height : 600;
            if (item.y > canvasH + 50) {
                this.items.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        const canvasW = GameState.canvas.width;
        const canvasH = GameState.canvas.height;

        ctx.save();
        
        // Draw sky gradient
        let skyGrad = ctx.createLinearGradient(0, 0, 0, canvasH);
        skyGrad.addColorStop(0, '#38bdf8'); // Sky-400
        skyGrad.addColorStop(1, '#0284c7'); // Sky-700
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, canvasW, canvasH);

        // Draw clouds
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        this.clouds.forEach(c => {
            ctx.beginPath();
            ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
            ctx.arc(c.x + c.size * 0.6, c.y - c.size * 0.2, c.size * 0.8, 0, Math.PI * 2);
            ctx.arc(c.x - c.size * 0.6, c.y - c.size * 0.1, c.size * 0.7, 0, Math.PI * 2);
            ctx.arc(c.x + c.size * 1.1, c.y + c.size * 0.1, c.size * 0.6, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw items (rotated)
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        this.items.forEach(item => {
            ctx.save();
            ctx.translate(item.x, item.y);
            ctx.rotate(item.angle);
            ctx.font = `${item.size}px Arial`;
            ctx.fillText(item.emoji, 0, 0);
            ctx.restore();
        });

        // Draw Player (Potato holding a net)
        let px = this.player.x;
        let py = this.player.y;

        // Apply shake offset to player if recently hit by a bad item
        if (this.shakeTimer > 0) {
            px += (Math.random() * 8 - 4);
            py += (Math.random() * 4 - 2);
        }

        // 1. Draw the net bag (grid)
        ctx.fillStyle = 'rgba(241, 245, 249, 0.3)';
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2.5;

        // Draw net bowl shape
        ctx.beginPath();
        ctx.ellipse(px, py - 30, this.player.netWidth / 2, 10, 0, 0, Math.PI);
        ctx.quadraticCurveTo(px + this.player.netWidth / 4, py + 10, px, py + 15);
        ctx.quadraticCurveTo(px - this.player.netWidth / 4, py + 10, px - this.player.netWidth / 2, py - 30);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw vertical grid lines in the net
        ctx.strokeStyle = 'rgba(226, 232, 240, 0.6)';
        ctx.lineWidth = 1.5;
        for (let offset = -20; offset <= 20; offset += 10) {
            ctx.beginPath();
            ctx.moveTo(px + offset, py - 23);
            ctx.quadraticCurveTo(px + offset / 2, py + 5, px, py + 15);
            ctx.stroke();
        }

        // Draw horizontal grid lines in the net
        for (let h = py - 20; h < py + 15; h += 8) {
            let widthAtH = (1 - (h - (py - 20)) / 35) * (this.player.netWidth / 2);
            ctx.beginPath();
            ctx.moveTo(px - widthAtH, h);
            ctx.lineTo(px + widthAtH, h);
            ctx.stroke();
        }

        // 2. Draw net rim
        ctx.strokeStyle = '#94a3b8'; // gray metal rim
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(px, py - 30, this.player.netWidth / 2, 8, 0, 0, Math.PI * 2);
        ctx.stroke();

        // 3. Draw wood handle
        ctx.strokeStyle = '#b45309'; // wood brown
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(px, py - 22);
        ctx.lineTo(px - 15, py + 20);
        ctx.stroke();

        // 4. Draw potato body
        ctx.font = '55px Arial';
        ctx.fillText('🍠', px + 10, py + 20);

        ctx.restore();
    }

    handleInput(type, details) {
        const canvasW = GameState.canvas ? GameState.canvas.width : 800;

        if (type === 'keydown') {
            if (details.key === 'ArrowLeft' || details.key === 'a' || details.key === 'A') {
                this.keyMoveLeft = true;
            }
            if (details.key === 'ArrowRight' || details.key === 'd' || details.key === 'D') {
                this.keyMoveRight = true;
            }
        }

        if (type === 'keyup') {
            if (details.key === 'ArrowLeft' || details.key === 'a' || details.key === 'A') {
                this.keyMoveLeft = false;
            }
            if (details.key === 'ArrowRight' || details.key === 'd' || details.key === 'D') {
                this.keyMoveRight = false;
            }
        }

        if (type === 'mousedown') {
            this.isDragging = true;
            this.player.targetX = Math.max(40, Math.min(canvasW - 40, details.x));
        }

        if (type === 'mousemove') {
            // Track X position regardless of click state for smoother hover-to-play
            this.player.targetX = Math.max(40, Math.min(canvasW - 40, details.x));
        }

        if (type === 'mouseup') {
            this.isDragging = false;
        }
    }

    destroy() {
        this.items = [];
        this.clouds = [];
    }
}
