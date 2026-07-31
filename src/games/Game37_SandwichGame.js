import { MiniGame } from './MiniGame.js';
import { GameState } from '../core/GameState.js';
import { UI } from '../core/UI.js';

const G37_GOOD_ITEMS = [
    { e: '🧀', name: 'cheese', s: 1 },
    { e: '🍅', name: 'tomato', s: 1 },
    { e: '🥬', name: 'lettuce', s: 1 },
    { e: '🍫', name: 'chocolate', s: 1 },
    { e: '🥒', name: 'cucumber', s: 1 },
    { e: '🍠', name: 'potato_bonus', s: 2 } // Potato is bonus!
];

const G37_BAD_ITEMS = [
    { e: '💩', name: 'poop' }, // Poop requested by user
    { e: '🪰', name: 'fly' }   // Fly / bug
];

export class Game37_SandwichGame extends MiniGame {
    init(difficulty) {
        UI.screens.container.className = 'relative w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-3xl sm:shadow-2xl overflow-hidden bg-amber-900';

        this.score = 0;
        this.lives = 3;
        this.difficulty = difficulty;

        // Player: Bottom bread slice
        this.player = {
            x: GameState.canvas ? GameState.canvas.width / 2 : 400,
            y: GameState.canvas ? GameState.canvas.height - 80 : 520,
            targetX: GameState.canvas ? GameState.canvas.width / 2 : 400,
            width: 90,
            height: 20
        };

        this.stackedItems = []; // Emojis stacked on the bread
        this.fallingItems = [];
        this.spawnTimer = 0.5;
        this.isWin = false;
        
        // Final bread drop state
        this.finalBreadActive = false;
        this.finalBreadY = -100;
        this.finalBreadX = 400;

        // Progressive logic: Two sandwiches
        this.sandwichesMade = 0; // 0 = first sandwich (8 layers), 1 = second (10 layers)
        this.targetHeight = 8;

        // Difficulty variables
        if (difficulty === 'easy') {
            this.fallSpeedRange = { min: 140, max: 200 };
            this.spawnRate = 1.3;
            this.badChance = 0.22;
            this.swayFactor = 0.6; // lower sway
        } else if (difficulty === 'medium') {
            this.fallSpeedRange = { min: 200, max: 300 };
            this.spawnRate = 0.9;
            this.badChance = 0.4;
            this.swayFactor = 1.2;
        } else {
            this.fallSpeedRange = { min: 260, max: 420 };
            this.spawnRate = 0.6;
            this.badChance = 0.55;
            this.swayFactor = 2.0; // heavy sway!
        }

        // Store base variables for progressive shift
        this.baseFallSpeedRange = { min: this.fallSpeedRange.min, max: this.fallSpeedRange.max };
        this.baseSpawnRate = this.spawnRate;
        this.baseBadChance = this.badChance;
        this.baseSwayFactor = this.swayFactor;

        this.updateUI();
    }

    resize(w, h) {
        this.player.y = h - 80;
        this.player.x = Math.max(50, Math.min(w - 50, this.player.x));
        this.player.targetX = this.player.x;
    }

    updateUI() {
        const scoreEl = document.getElementById('g37-score');
        const livesEl = document.getElementById('g37-lives');
        
        let labelText = `שכבות: ${this.stackedItems.length} / ${this.targetHeight}`;
        if (this.sandwichesMade === 1) {
            labelText = `🔥 קומה כפולה: ${this.stackedItems.length} / ${this.targetHeight}`;
        }
        
        if (scoreEl) scoreEl.innerText = labelText;
        if (livesEl) livesEl.innerText = '❤️'.repeat(Math.max(0, this.lives));
    }

    spawnFallingItem() {
        const canvasW = GameState.canvas ? GameState.canvas.width : 800;
        let isBad = Math.random() < this.badChance;
        let itemPool = isBad ? G37_BAD_ITEMS : G37_GOOD_ITEMS;
        let chosen = itemPool[Math.floor(Math.random() * itemPool.length)];

        this.fallingItems.push({
            x: Math.random() * (canvasW - 80) + 40,
            y: -50,
            vy: Math.random() * (this.fallSpeedRange.max - this.fallSpeedRange.min) + this.fallSpeedRange.min,
            emoji: chosen.e,
            name: chosen.name,
            size: 38
        });
    }

    update(dt) {
        if (this.isWin) return;

        // Interpolate player X position (smooth dragging)
        this.player.x += (this.player.targetX - this.player.x) * 0.3;

        // Spawning logic (Only spawn ingredients if we have less than target stacked items)
        if (this.stackedItems.length < this.targetHeight && !this.finalBreadActive) {
            this.spawnTimer -= dt / 1000;
            if (this.spawnTimer <= 0) {
                this.spawnFallingItem();
                this.spawnTimer = this.spawnRate + Math.random() * 0.5;
            }
        } else if (this.stackedItems.length >= this.targetHeight && !this.finalBreadActive) {
            // Trigger final top bread drop!
            this.finalBreadActive = true;
            this.finalBreadX = Math.random() * (GameState.canvas.width - 80) + 40;
            this.finalBreadY = -60;
        }

        // Update falling items
        for (let i = this.fallingItems.length - 1; i >= 0; i--) {
            let item = this.fallingItems[i];
            item.y += item.vy * (dt / 1000);

            // Check collision with the top of the stack
            // Top of the stack is player.y - 15 - (stackCount * 18)
            let stackTopY = this.player.y - 15 - (this.stackedItems.length * 18);
            
            // Allow a small horizontal window of alignment at the top of the stack
            // Sway calculation shifts the top of the stack. We calculate the top sway:
            let topSway = 0;
            if (this.stackedItems.length > 0) {
                topSway = Math.sin(performance.now() / 200 + this.stackedItems.length * 0.3) * (this.stackedItems.length * this.swayFactor);
            }
            let stackTopX = this.player.x + topSway;

            let dx = Math.abs(item.x - stackTopX);
            let dy = item.y - stackTopY;

            if (dx < 45 && dy >= -15 && dy <= 15) {
                // Caught!
                if (item.name === 'poop' || item.name === 'fly') {
                    // Oops! Caught poop/fly
                    this.lives--;
                    this.updateUI();

                    UI.createPopEffect(item.x, item.y, '🤢 💩 פוסל!', '#f87171');
                    UI.screens.container.classList.add('shake');
                    setTimeout(() => UI.screens.container.classList.remove('shake'), 200);

                    // Clear last 2 ingredients from stack as penalty
                    if (this.stackedItems.length > 0) this.stackedItems.pop();
                    if (this.stackedItems.length > 0) this.stackedItems.pop();
                    this.updateUI();

                    if (this.lives <= 0) {
                        UI.endGame("סנדוויץ' מורעל! 🤮", "תפסת יותר מדי זבל וקקי, הסנדוויץ' לא ראוי למאכל אדם!");
                        return;
                    }
                } else {
                    // Caught good ingredient! Stack it
                    this.stackedItems.push(item.emoji);
                    this.score += item.emoji === '🍠' ? 20 : 10; // extra points for potato!
                    this.updateUI();
                    
                    let pointsLabel = item.emoji === '🍠' ? '+20 בטטה! 🍠' : '+10';
                    let pointsColor = item.emoji === '🍠' ? '#facc15' : '#4ade80';
                    UI.createPopEffect(stackTopX, stackTopY - 15, pointsLabel, pointsColor);
                }
                this.fallingItems.splice(i, 1);
                continue;
            }

            // Remove if past bottom screen
            const canvasH = GameState.canvas ? GameState.canvas.height : 600;
            if (item.y > canvasH + 50) {
                this.fallingItems.splice(i, 1);
            }
        }

        // Update top final bread if active
        if (this.finalBreadActive) {
            let speed = this.difficulty === 'easy' ? 140 : (this.difficulty === 'medium' ? 200 : 260);
            this.finalBreadY += speed * (dt / 1000);

            let stackTopY = this.player.y - 15 - (this.stackedItems.length * 18);
            let topSway = Math.sin(performance.now() / 200 + this.stackedItems.length * 0.3) * (this.stackedItems.length * this.swayFactor);
            let stackTopX = this.player.x + topSway;

            let dx = Math.abs(this.finalBreadX - stackTopX);
            let dy = this.finalBreadY - stackTopY;

            if (dx < 50 && dy >= -15 && dy <= 15) {
                if (this.sandwichesMade === 0) {
                    // First sandwich done! Move to second, double-decker sandwich
                    this.sandwichesMade = 1;
                    this.stackedItems = []; // Reset stack
                    this.fallingItems = []; // Clear falling items
                    this.finalBreadActive = false;
                    this.targetHeight = 10; // 10 layers required for stage 2!

                    // Progressive speed/rate/sway/hazard upgrades
                    this.fallSpeedRange = { min: this.baseFallSpeedRange.min * 1.35, max: this.baseFallSpeedRange.max * 1.35 };
                    this.spawnRate = this.baseSpawnRate * 0.65; // 35% faster spawn
                    this.swayFactor = this.baseSwayFactor * 1.45; // 45% heavier sway!
                    this.badChance = Math.min(0.8, this.baseBadChance * 1.3);

                    // Transition visual pop
                    UI.screens.container.classList.add('bg-green-100');
                    setTimeout(() => UI.screens.container.classList.remove('bg-green-100'), 150);

                    const canvasW = GameState.canvas.width;
                    UI.createPopEffect(canvasW / 2, canvasH / 2 - 100, 'סנדוויץ׳ ראשון מוכן! עכשיו בונים קומה כפולה... 🥪🔥', '#fbbf24');
                    this.updateUI();
                } else {
                    // Both sandwiches completed! Win!
                    this.isWin = true;
                    this.finalBreadY = stackTopY - 10;
                    this.finalBreadX = stackTopX;
                    UI.endGame("מאסטר הסנדוויצ'ים! 🥪🏆", `יאמי! הכנת סנדוויץ' קומות כפול מטורף (10 שכבות!) בשווי של ${this.score} נקודות.`);
                }
            }

            // If final bread misses the sandwich and hits bottom, spawn a new one
            if (this.finalBreadY > GameState.canvas.height + 50) {
                this.finalBreadY = -60;
                this.finalBreadX = Math.random() * (GameState.canvas.width - 80) + 40;
            }
        }
    }

    draw(ctx) {
        const canvasW = GameState.canvas.width;
        const canvasH = GameState.canvas.height;

        ctx.save();

        // 1. Draw Kitchen counter background
        ctx.fillStyle = '#fef3c7'; // amber-100 warm wall
        ctx.fillRect(0, 0, canvasW, canvasH);

        // Draw counter wood
        ctx.fillStyle = '#d97706'; // warm wood counter
        ctx.fillRect(0, canvasH - 70, canvasW, 70);
        ctx.fillStyle = '#b45309';
        ctx.fillRect(0, canvasH - 70, canvasW, 8); // edge

        // Draw tiling lines on the wall in background
        ctx.strokeStyle = 'rgba(217, 119, 6, 0.1)';
        ctx.lineWidth = 2;
        for (let x = 60; x < canvasW; x += 100) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvasH - 70);
            ctx.stroke();
        }
        for (let y = 60; y < canvasH - 70; y += 100) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvasW, y);
            ctx.stroke();
        }

        // 2. Draw Falling Items
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        this.fallingItems.forEach(item => {
            ctx.font = `${item.size}px Arial`;
            ctx.fillText(item.emoji, item.x, item.y);
        });

        // 3. Draw top final bread if active
        if (this.finalBreadActive && !this.isWin) {
            ctx.font = '55px Arial';
            ctx.fillText('🍞', this.finalBreadX, this.finalBreadY);
            
            // Draw a shiny indicator
            ctx.fillStyle = 'rgba(250, 204, 21, 0.35)';
            ctx.beginPath();
            ctx.arc(this.finalBreadX, this.finalBreadY, 35, 0, Math.PI * 2);
            ctx.fill();
        }

        // 4. Draw Stacked Items (with Sway animation)
        let px = this.player.x;
        let py = this.player.y;

        ctx.font = '50px Arial';
        this.stackedItems.forEach((emoji, i) => {
            // Apply sinusoidal sway based on stack index
            let sway = Math.sin(performance.now() / 200 + (i + 1) * 0.3) * ((i + 1) * this.swayFactor);
            ctx.fillText(emoji, px + sway, py - 18 - i * 18);
        });

        // Draw top bread on win
        if (this.isWin) {
            let sway = Math.sin(performance.now() / 200 + (this.targetHeight + 1) * 0.3) * ((this.targetHeight + 1) * this.swayFactor);
            ctx.fillText('🍞', px + sway, py - 18 - this.targetHeight * 18);
        }

        // 5. Draw Player (Bottom bread slice 🍞)
        ctx.fillStyle = '#b45309'; // crust color
        ctx.roundRect(px - this.player.width / 2, py - this.player.height / 2, this.player.width, this.player.height, 6);
        ctx.fill();

        ctx.fillStyle = '#fef08a'; // crumb color (interior bread)
        ctx.roundRect(px - this.player.width / 2 + 4, py - this.player.height / 2 + 3, this.player.width - 8, this.player.height - 6, 4);
        ctx.fill();

        // 6. Draw Stack guidelines / visual helper (Premium UI)
        if (this.stackedItems.length > 0 && !this.isWin) {
            // Draw a subtle dotted safety balance line through the stack center
            ctx.strokeStyle = 'rgba(251, 191, 36, 0.25)';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 6]);
            ctx.beginPath();
            ctx.moveTo(px, py);
            // Draw curving guideline matching sway
            for (let i = 0; i <= this.stackedItems.length + 1; i++) {
                let sway = Math.sin(performance.now() / 200 + i * 0.3) * (i * this.swayFactor);
                ctx.lineTo(px + sway, py - i * 18);
            }
            ctx.stroke();
            ctx.setLineDash([]); // reset
        }

        ctx.restore();
    }

    handleInput(type, details) {
        if (type === 'mousedown' || type === 'mousemove') {
            this.player.targetX = details.x;
        }
        if (type === 'keydown') {
            if (details.key === 'ArrowLeft' || details.key === 'a' || details.key === 'A') {
                this.player.targetX = Math.max(50, this.player.targetX - 25);
            }
            if (details.key === 'ArrowRight' || details.key === 'd' || details.key === 'D') {
                this.player.targetX = Math.min(GameState.canvas.width - 50, this.player.targetX + 25);
            }
        }
    }

    destroy() {
        this.stackedItems = [];
        this.fallingItems = [];
    }
}
