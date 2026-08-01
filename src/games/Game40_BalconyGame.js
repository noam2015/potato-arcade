import { MiniGame } from './MiniGame.js';
import { GameState } from '../core/GameState.js';
import { UI } from '../core/UI.js';

export class Game40_BalconyGame extends MiniGame {
    init(difficulty) {
        UI.screens.container.className = 'relative w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-3xl sm:shadow-2xl overflow-hidden bg-zinc-800';

        this.score = 0;
        this.lives = 3;
        this.difficulty = difficulty;

        // Balcony slots: 5 slots to fill with bricks
        this.slots = [
            { x: 150, y: 380, filled: false, emoji: '' },
            { x: 270, y: 380, filled: false, emoji: '' },
            { x: 390, y: 380, filled: false, emoji: '' },
            { x: 510, y: 380, filled: false, emoji: '' },
            { x: 630, y: 380, filled: false, emoji: '' }
        ];

        this.fallingBlocks = [];
        this.spawnTimer = 0.5;

        // Inspector Drone state
        this.drone = {
            active: false,
            x: -100,
            y: 90,
            vx: 0,
            warningTimer: 0,
            flashTimer: 0,
            direction: 1 // 1 = left to right, -1 = right to left
        };
        this.droneTimer = 3.0; // Drone visits soon

        // Laundry cover state
        this.laundryActive = false;

        // Difficulty variables
        if (difficulty === 'easy') {
            this.fallSpeed = 150;
            this.spawnRate = 1.6;
            this.droneInterval = 8.0;
            this.droneSpeed = 160;
        } else if (difficulty === 'medium') {
            this.fallSpeed = 220;
            this.spawnRate = 1.0;
            this.droneInterval = 6.0;
            this.droneSpeed = 260;
        } else {
            this.fallSpeed = 310;
            this.spawnRate = 0.65;
            this.droneInterval = 4.0;
            this.droneSpeed = 380;
        }

        this.updateUI();
    }

    resize(w, h) {
        // Center slots horizontally based on canvas width
        const canvasW = w;
        let spacing = Math.min(110, canvasW / 7);
        let startX = canvasW / 2 - (spacing * 2);
        this.slots.forEach((s, idx) => {
            s.x = startX + idx * spacing;
            s.y = h - 180;
        });
    }

    updateUI() {
        const scoreEl = document.getElementById('g40-score');
        const livesEl = document.getElementById('g40-lives');
        let filledCount = this.slots.filter(s => s.filled).length;
        if (scoreEl) scoreEl.innerText = filledCount;
        if (livesEl) livesEl.innerText = '❤️'.repeat(Math.max(0, this.lives));
    }

    spawnBlock() {
        const canvasW = GameState.canvas ? GameState.canvas.width : 800;
        let emojis = ['🧱', '🪟', '🧱', '⬜'];
        let emoji = emojis[Math.floor(Math.random() * emojis.length)];

        this.fallingBlocks.push({
            x: Math.random() * (canvasW - 100) + 50,
            y: -50,
            vy: this.fallSpeed + Math.random() * 50,
            emoji: emoji,
            size: 40
        });
    }

    update(dt) {
        const canvasW = GameState.canvas ? GameState.canvas.width : 800;
        const canvasH = GameState.canvas ? GameState.canvas.height : 600;

        // Drone camera flash fade
        if (this.drone.flashTimer > 0) {
            this.drone.flashTimer -= dt / 1000;
        }

        // Spawning blocks
        this.spawnTimer -= dt / 1000;
        if (this.spawnTimer <= 0) {
            this.spawnBlock();
            this.spawnTimer = this.spawnRate + Math.random() * 0.4;
        }

        // Drone spawning timer
        if (!this.drone.active) {
            this.droneTimer -= dt / 1000;
            if (this.droneTimer <= 0) {
                // Trigger warning first
                this.drone.active = true;
                this.drone.warningTimer = 1.8; // 1.8s flashing warning
                this.drone.direction = Math.random() < 0.5 ? 1 : -1;
                this.drone.x = this.drone.direction === 1 ? -80 : canvasW + 80;
                this.drone.vx = this.droneSpeed * this.drone.direction;
            }
        } else {
            // Drone warning phase
            if (this.drone.warningTimer > 0) {
                this.drone.warningTimer -= dt / 1000;
            } else {
                // Drone movement phase
                this.drone.x += this.drone.vx * (dt / 1000);

                // Sneaky drone behavior on Hard difficulty (fake-outs)
                if (this.difficulty === 'hard' && Math.random() < 0.015 && Math.abs(this.drone.vx) > 50) {
                    this.drone.vx = -this.drone.vx * 0.8; // reverse direction suddenly!
                }

                // Check inspector detection
                // If drone is on-screen (e.g. 50 < x < canvasW - 50)
                let isOnScreen = this.drone.x > 50 && this.drone.x < canvasW - 50;
                if (isOnScreen && !this.laundryActive) {
                    // Inspector sees the construction! Photo penalty!
                    this.lives--;
                    this.updateUI();
                    
                    this.drone.flashTimer = 0.35; // flash screen white
                    UI.createPopEffect(this.drone.x, this.drone.y + 40, '📸 קנס! בניה לא חוקית!', '#ef4444');
                    UI.screens.container.classList.add('shake');
                    setTimeout(() => UI.screens.container.classList.remove('shake'), 200);

                    // Reset drone so it doesn't penalize repeatedly in same pass
                    this.drone.active = false;
                    this.droneTimer = this.droneInterval + Math.random() * 3;

                    if (this.lives <= 0) {
                        UI.endGame("צו הריסה! 🧾🛸", "קיבלת יותר מדי קנסות על בניה לא חוקית.");
                        return;
                    }
                }

                // Offscreen checks
                let isOffLeft = this.drone.direction === -1 && this.drone.x < -100;
                let isOffRight = this.drone.direction === 1 && this.drone.x > canvasW + 100;
                if (isOffLeft || isOffRight) {
                    this.drone.active = false;
                    this.droneTimer = this.droneInterval + Math.random() * 3;
                }
            }
        }

        // Update blocks
        for (let i = this.fallingBlocks.length - 1; i >= 0; i--) {
            let b = this.fallingBlocks[i];
            b.y += b.vy * (dt / 1000);

            // Reached bottom / missed
            if (b.y > canvasH + 40) {
                this.fallingBlocks.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        const canvasW = GameState.canvas.width;
        const canvasH = GameState.canvas.height;
        const centerX = canvasW / 2;

        ctx.save();

        // 1. Draw Balcony sky background
        let skyGrad = ctx.createLinearGradient(0, 0, 0, canvasH);
        skyGrad.addColorStop(0, '#0f172a'); // slate-900
        skyGrad.addColorStop(1, '#1e293b'); // slate-800
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, canvasW, canvasH);

        // Draw distant city silhouettes
        ctx.fillStyle = '#0f172a';
        for (let i = 0; i < 6; i++) {
            ctx.fillRect(i * 150 + 20, canvasH - 240, 100, 180);
        }

        // Draw balcony handrail and concrete posts
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(0, canvasH - 120, canvasW, 120); // Balcony floor
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(0, canvasH - 120, canvasW, 8); // ledge

        // 2. Draw slots of the wall to close
        this.slots.forEach(s => {
            // Draw slot outline
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 4;
            ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
            ctx.beginPath();
            ctx.roundRect(s.x - 45, s.y - 45, 90, 90, 8);
            ctx.fill();
            ctx.stroke();

            // Draw content if filled
            if (s.filled) {
                ctx.font = '55px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(s.emoji, s.x, s.y);
            } else {
                // Outline dotted placeholder
                ctx.fillStyle = '#475569';
                ctx.font = '30px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('+', s.x, s.y);
            }
        });

        // 3. Draw falling blocks
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        this.fallingBlocks.forEach(b => {
            ctx.font = `${b.size}px Arial`;
            ctx.fillText(b.emoji, b.x, b.y);
        });

        // 4. Draw Laundry Cover if active
        if (this.laundryActive) {
            // Draw laundry lines and sheets covering slots
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 3;
            let firstSlotX = this.slots[0].x - 60;
            let lastSlotX = this.slots[4].x + 60;
            let lineY = this.slots[0].y - 65;

            ctx.beginPath();
            ctx.moveTo(firstSlotX, lineY);
            ctx.lineTo(lastSlotX, lineY);
            ctx.stroke();

            // Draw white bedsheet/laundry covering the slots
            ctx.fillStyle = 'rgba(241, 245, 249, 0.95)'; // solid white laundry sheet
            ctx.beginPath();
            ctx.roundRect(firstSlotX + 10, lineY, (lastSlotX - firstSlotX) - 20, 150, [4, 4, 15, 15]);
            ctx.fill();

            // Draw clothespins `📌`
            ctx.font = '16px Arial';
            for (let pinX = firstSlotX + 40; pinX < lastSlotX; pinX += 80) {
                ctx.fillText('📎', pinX, lineY);
            }

            // Draw text on the sheet
            ctx.fillStyle = '#475569';
            ctx.font = 'bold 18px Arial';
            ctx.fillText('👕 כביסה בלבד! 👕', (firstSlotX + lastSlotX) / 2, lineY + 75);
        }

        // 5. Draw Drone Warning / Flash / Drone itself
        if (this.drone.active) {
            if (this.drone.warningTimer > 0) {
                // Flashing alert
                if (Math.floor(performance.now() / 250) % 2 === 0) {
                    ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
                    ctx.fillRect(0, 0, canvasW, canvasH);

                    ctx.fillStyle = '#ef4444';
                    ctx.font = 'bold 24px Arial';
                    ctx.fillText('🛸🚨 פקח מתקרב! הסתר את הבניה! 🛸🚨', centerX, 60);
                }
            } else {
                // Draw drone unit
                ctx.font = '55px Arial';
                ctx.fillText('🛸', this.drone.x, this.drone.y);
                
                // Draw inspector camera sight lines pointing down
                ctx.strokeStyle = 'rgba(239, 68, 68, 0.2)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(this.drone.x - 20, this.drone.y + 15);
                ctx.lineTo(this.drone.x - 80, canvasH - 120);
                ctx.moveTo(this.drone.x + 20, this.drone.y + 15);
                ctx.lineTo(this.drone.x + 80, canvasH - 120);
                ctx.stroke();

                // Draw alert indicator
                ctx.fillStyle = '#ef4444';
                ctx.font = 'bold 14px Arial';
                ctx.fillText('⚠️ צילום פיקוח!', this.drone.x, this.drone.y - 30);
            }
        }

        // Draw camera flash overlay (full white screen)
        if (this.drone.flashTimer > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${this.drone.flashTimer * 2.5})`;
            ctx.fillRect(0, 0, canvasW, canvasH);
        }

        // 6. Draw Laundry Button guide at bottom
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, canvasH - 50, canvasW, 50);
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.fillText('לחץ והחזק קליק / רווח כדי לפרוס כביסה 🧺', centerX, canvasH - 25);

        ctx.restore();
    }

    handleInput(type, details) {
        // Spacebar / Click and hold triggers laundry cover
        if (type === 'keydown' && details.key === ' ') {
            this.laundryActive = true;
        }
        if (type === 'keyup' && details.key === ' ') {
            this.laundryActive = false;
        }

        if (type === 'mousedown') {
            // Check if holding Laundry cover
            // If they click on the bottom bar, or anywhere while they want to hide:
            // But wait, they also need to click to catch blocks!
            // Let's make it so holding the click anywhere triggers laundry,
            // EXCEPT if they click exactly on a falling block!
            // That is perfect: click block = catch it; click background/hold = laundry!

            let clickedBlock = false;
            let cx = details.x;
            let cy = details.y;

            if (!this.laundryActive) {
                for (let i = 0; i < this.fallingBlocks.length; i++) {
                    let b = this.fallingBlocks[i];
                    let dx = Math.abs(cx - b.x);
                    let dy = Math.abs(cy - b.y);

                    if (dx < 25 && dy < 25) {
                        // Caught block!
                        clickedBlock = true;
                        this.fallingBlocks.splice(i, 1);

                        // Find next empty slot
                        let nextEmpty = this.slots.find(s => !s.filled);
                        if (nextEmpty) {
                            nextEmpty.filled = true;
                            nextEmpty.emoji = b.emoji;
                            this.updateUI();

                            UI.createPopEffect(nextEmpty.x, nextEmpty.y - 20, '🏗️ נבנה!', '#4ade80');

                            // Check Win Condition
                            let allFilled = this.slots.every(s => s.filled);
                            if (allFilled) {
                                UI.endGame("המרפסת סגורה! 🏗️🎉", "סגרת את המרפסת בהצלחה והפקח העירוני נשאר בידיים ריקות!");
                                return;
                            }
                        }
                        break;
                    }
                }
            }

            if (!clickedBlock) {
                // Start holding laundry sheet
                this.laundryActive = true;
            }
        }

        if (type === 'mouseup') {
            this.laundryActive = false;
        }
    }

    destroy() {
        this.fallingBlocks = [];
    }
}
