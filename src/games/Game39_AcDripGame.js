import { MiniGame } from './MiniGame.js';
import { GameState } from '../core/GameState.js';
import { UI } from '../core/UI.js';

export class Game39_AcDripGame extends MiniGame {
    init(difficulty) {
        UI.screens.container.className = 'relative w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-3xl sm:shadow-2xl overflow-hidden bg-sky-950';

        this.score = 0;
        this.lives = 3;
        this.difficulty = difficulty;

        // Player: Bucket
        this.player = {
            x: GameState.canvas ? GameState.canvas.width / 2 : 400,
            y: GameState.canvas ? GameState.canvas.height - 80 : 520,
            targetX: GameState.canvas ? GameState.canvas.width / 2 : 400,
            w: 80,
            h: 70
        };

        this.drops = [];
        this.spawnTimer = 0.5;

        // Visual effects
        this.splashes = [];
        this.windAngle = 0;

        // Difficulty balancing
        if (difficulty === 'easy') {
            this.fallSpeedRange = { min: 140, max: 200 };
            this.spawnRate = 1.5;
            this.geckoChance = 0.0;
            this.windFactor = 0.0; // no wind
        } else if (difficulty === 'medium') {
            this.fallSpeedRange = { min: 200, max: 280 };
            this.spawnRate = 0.9;
            this.geckoChance = 0.2;
            this.windFactor = 0.8;
        } else {
            this.fallSpeedRange = { min: 280, max: 400 };
            this.spawnRate = 0.55;
            this.geckoChance = 0.35;
            this.windFactor = 2.0; // heavy wind swaying
        }

        this.updateUI();
    }

    resize(w, h) {
        this.player.y = h - 80;
        this.player.x = Math.max(40, Math.min(w - 40, this.player.x));
        this.player.targetX = this.player.x;
    }

    updateUI() {
        const scoreEl = document.getElementById('g39-score');
        const livesEl = document.getElementById('g39-lives');
        if (scoreEl) scoreEl.innerText = this.score;
        if (livesEl) livesEl.innerText = '❤️'.repeat(Math.max(0, this.lives));
    }

    spawnDrop() {
        const canvasW = GameState.canvas ? GameState.canvas.width : 800;
        
        let rand = Math.random();
        let emoji = '💧';
        let name = 'water';
        let speed = Math.random() * (this.fallSpeedRange.max - this.fallSpeedRange.min) + this.fallSpeedRange.min;

        if (rand < this.geckoChance) {
            // gecko or rust
            if (Math.random() < 0.5) {
                emoji = '🦎';
                name = 'gecko';
            } else {
                emoji = '⚙️';
                name = 'rust';
            }
        } else if (rand > 0.92) {
            emoji = '🧊'; // Ice bonus
            name = 'ice';
        }

        // Spawn position: Drips from the AC unit located in the center top
        // AC width is 240, centered
        let acStartX = canvasW / 2 - 120;
        let spawnX = acStartX + Math.random() * 240;

        this.drops.push({
            x: spawnX,
            y: 90, // below AC
            vy: speed,
            emoji: emoji,
            name: name,
            size: emoji === '💧' ? 24 : 32,
            waveOffset: Math.random() * Math.PI * 2
        });
    }

    update(dt) {
        // Smooth bucket movement
        this.player.x += (this.player.targetX - this.player.x) * 0.25;

        // Wind angle update
        this.windAngle += (dt / 1000) * 2;

        // Spawning
        this.spawnTimer -= dt / 1000;
        if (this.spawnTimer <= 0) {
            this.spawnDrop();
            this.spawnTimer = this.spawnRate + Math.random() * 0.4;
        }

        const canvasH = GameState.canvas ? GameState.canvas.height : 600;

        // Splashes
        for (let i = this.splashes.length - 1; i >= 0; i--) {
            let s = this.splashes[i];
            s.timer -= dt / 1000;
            if (s.timer <= 0) {
                this.splashes.splice(i, 1);
            }
        }

        // Update drops
        for (let i = this.drops.length - 1; i >= 0; i--) {
            let drop = this.drops[i];
            drop.y += drop.vy * (dt / 1000);

            // Wind drift (only affects water/ice)
            if (drop.name === 'water' || drop.name === 'ice') {
                drop.x += Math.sin(this.windAngle + drop.waveOffset) * this.windFactor * 1.5;
            }

            // Check collision with bucket (player)
            let dx = Math.abs(drop.x - this.player.x);
            let dy = drop.y - (this.player.y - 25);

            if (dx < this.player.w / 2 + 10 && dy >= -10 && dy <= 20) {
                // Caught!
                if (drop.name === 'water') {
                    this.score++;
                    this.updateUI();
                    UI.createPopEffect(drop.x, drop.y, '+1💧', '#3b82f6');
                    
                    if (this.score >= 15) {
                        UI.endGame("החדר יבש! 💧🎉", "הצלחת לאסוף את כל המים ולמנוע הצפה של הסלון!");
                        return;
                    }
                } else if (drop.name === 'ice') {
                    this.score += 2; // bonus!
                    this.updateUI();
                    UI.createPopEffect(drop.x, drop.y, '🧊 בונוס קירור! +2', '#fbbf24');
                    
                    if (this.score >= 15) {
                        UI.endGame("החדר יבש! 💧🎉", "הצלחת לאסוף את כל המים ולמנוע הצפה של הסלון!");
                        return;
                    }
                } else {
                    // gecko or rust caught
                    this.lives--;
                    this.updateUI();
                    let msg = drop.name === 'gecko' ? '🦎 שממית בדלי! אוי!' : '⚙️ חלודה מלוכלכת!';
                    UI.createPopEffect(drop.x, drop.y, msg, '#f87171');
                    UI.screens.container.classList.add('shake');
                    setTimeout(() => UI.screens.container.classList.remove('shake'), 200);

                    if (this.lives <= 0) {
                        UI.endGame("הדלי נסדק! 🪣💥", "הדלי התמלא בחלודה ובזוחלים ונשבר.");
                        return;
                    }
                }

                this.drops.splice(i, 1);
                continue;
            }

            // Hit floor (missed droplet)
            if (drop.y >= canvasH - 75) {
                if (drop.name === 'water') {
                    this.lives--;
                    this.updateUI();
                    
                    // Create floor splash
                    this.splashes.push({
                        x: drop.x,
                        y: canvasH - 70,
                        timer: 0.3
                    });

                    UI.createPopEffect(drop.x, drop.y, '💧 פספוס!', '#ef4444');
                    UI.screens.container.classList.add('shake');
                    setTimeout(() => UI.screens.container.classList.remove('shake'), 150);

                    if (this.lives <= 0) {
                        UI.endGame("הסלון הוצף! 🌊🛋️", "טיפות המזגן הציפו את השטיח היקר בסלון.");
                        return;
                    }
                }
                this.drops.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        const canvasW = GameState.canvas.width;
        const canvasH = GameState.canvas.height;
        const centerX = canvasW / 2;

        ctx.save();

        // 1. Draw Living Room Wall
        let wallGrad = ctx.createLinearGradient(0, 0, 0, canvasH);
        wallGrad.addColorStop(0, '#0c4a6e'); // sky-900
        wallGrad.addColorStop(1, '#075985'); // sky-800
        ctx.fillStyle = wallGrad;
        ctx.fillRect(0, 0, canvasW, canvasH);

        // Counter/floor
        ctx.fillStyle = '#b45309'; // parquet wood floor
        ctx.fillRect(0, canvasH - 70, canvasW, 70);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(0, canvasH - 70, canvasW, 8); // edge

        // Draw a photo frame in background
        ctx.fillStyle = '#78350f'; // wood frame
        ctx.fillRect(100, 160, 100, 80);
        ctx.fillStyle = '#1e3a8a';
        ctx.fillRect(105, 165, 90, 70);
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🍠', 150, 200);

        // 2. Draw Air Conditioner unit (Top Center)
        let acX = centerX - 120;
        let acY = 30;
        let acW = 240;
        let acH = 60;

        ctx.fillStyle = '#f1f5f9'; // white slate
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(acX, acY, acW, acH, 6);
        ctx.fill();
        ctx.stroke();

        // AC vents / grid
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(acX + 20, acY + acH - 12, acW - 40, 4);

        // AC green indicator light
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(acX + acW - 20, acY + 18, 5, 0, Math.PI * 2);
        ctx.fill();

        // AC digital temperature display
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(acX + acW - 60, acY + 10, 30, 16);
        ctx.fillStyle = '#10b981';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('16C', acX + acW - 45, acY + 22);

        // Wind blowing lines from AC
        if (this.windFactor > 0) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 2;
            let windXShift = Math.sin(this.windAngle) * this.windFactor * 15;
            for (let offset = -40; offset <= 40; offset += 40) {
                ctx.beginPath();
                ctx.moveTo(centerX + offset, acY + acH);
                ctx.bezierCurveTo(
                    centerX + offset + windXShift / 2, acY + acH + 40,
                    centerX + offset + windXShift, acY + acH + 80,
                    centerX + offset + windXShift * 1.5, acY + acH + 130
                );
                ctx.stroke();
            }
        }

        // 3. Draw Splashes on Floor
        ctx.fillStyle = 'rgba(14, 165, 233, 0.6)';
        this.splashes.forEach(s => {
            ctx.beginPath();
            ctx.ellipse(s.x, s.y, 16, 6, 0, 0, Math.PI * 2);
            ctx.fill();
        });

        // 4. Draw Falling Drops / Items
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        this.drops.forEach(drop => {
            ctx.font = `${drop.size}px Arial`;
            ctx.fillText(drop.emoji, drop.x, drop.y);
        });

        // 5. Draw Bucket (Player 🪣)
        let px = this.player.x;
        let py = this.player.y;
        let pw = this.player.w;
        let ph = this.player.h;

        // Bucket handle (metal arc)
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(px, py - ph / 2 + 10, pw / 2, Math.PI, 0);
        ctx.stroke();

        // Bucket body (blue plastic container)
        ctx.fillStyle = '#3b82f6'; // Blue bucket
        ctx.strokeStyle = '#1d4ed8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(px - pw / 2, py - ph / 2 + 10);
        ctx.lineTo(px + pw / 2, py - ph / 2 + 10);
        ctx.lineTo(px + pw / 3, py + ph / 2);
        ctx.lineTo(px - pw / 3, py + ph / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Shiny metal bands on bucket
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(px - pw / 2 + 5, py - ph / 2 + 18, pw - 10, 8);

        // Water level inside bucket
        if (this.score > 0) {
            let waterHeight = Math.min(ph - 15, 8 + (this.score * 3.2));
            ctx.fillStyle = 'rgba(14, 165, 233, 0.85)'; // Water color
            ctx.beginPath();
            ctx.moveTo(px - pw / 2.3, py + ph / 2 - waterHeight);
            ctx.lineTo(px + pw / 2.3, py + ph / 2 - waterHeight);
            ctx.lineTo(px + pw / 3, py + ph / 2);
            ctx.lineTo(px - pw / 3, py + ph / 2);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }

    handleInput(type, details) {
        if (type === 'mousedown' || type === 'mousemove') {
            this.player.targetX = details.x;
        }
        if (type === 'keydown') {
            if (details.key === 'ArrowLeft' || details.key === 'a' || details.key === 'A') {
                this.player.targetX = Math.max(40, this.player.targetX - 30);
            }
            if (details.key === 'ArrowRight' || details.key === 'd' || details.key === 'D') {
                this.player.targetX = Math.min(GameState.canvas.width - 40, this.player.targetX + 30);
            }
        }
    }

    destroy() {
        this.drops = [];
        this.splashes = [];
    }
}
