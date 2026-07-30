import { MiniGame } from './MiniGame.js';
import { GameState } from '../core/GameState.js';
import { UI } from '../core/UI.js';

export class Game13_AirplaneGame extends MiniGame {
    init(difficulty) {
        UI.screens.container.className = 'relative w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-3xl sm:shadow-2xl overflow-hidden bg-sky-200';

        this.g13Score = 0;
        this.g13Lives = 3;
        this.g13Obstacles = [];
        this.g13SpawnTimer = 0;

        this.g13Player = {
            x: GameState.canvas.width / 2,
            y: GameState.canvas.height - 100,
            size: 60,
            emoji: '✈️'
        };

        this.g13Target = { x: 0, y: 0, active: false };
        this.g13IsDragging = false;

        this.g13Speed = (difficulty === 'easy') ? 350 : (difficulty === 'medium' ? 550 : 800);
        this.g13SpawnRate = (difficulty === 'easy') ? 0.8 : (difficulty === 'medium' ? 0.45 : 0.25);

        this.updateUI();
    }

    updateUI() {
        const scoreEl = document.getElementById('g13-score');
        const livesEl = document.getElementById('g13-lives');
        if (scoreEl) scoreEl.innerText = Math.floor(this.g13Score);
        if (livesEl) livesEl.innerText = '❤️'.repeat(Math.max(0, this.g13Lives));
    }

    update(dt) {
        this.g13Score += dt / 200;
        this.updateUI();

        // Guide plane to target
        if (this.g13Target.active) {
            let dx = this.g13Target.x - this.g13Player.x;
            let dy = this.g13Target.y - this.g13Player.y;
            let dist = Math.hypot(dx, dy);
            let speed = 800;
            
            if (dist > 5) {
                this.g13Player.x += (dx / dist) * speed * (dt / 1000);
                this.g13Player.y += (dy / dist) * speed * (dt / 1000);
            } else {
                this.g13Target.active = false;
            }
        }

        // Clamp plane
        this.g13Player.x = Math.max(this.g13Player.size / 2, Math.min(GameState.canvas.width - this.g13Player.size / 2, this.g13Player.x));
        this.g13Player.y = Math.max(this.g13Player.size / 2, Math.min(GameState.canvas.height - this.g13Player.size / 2, this.g13Player.y));

        // Spawn obstacles
        this.g13SpawnTimer -= dt / 1000;
        if (this.g13SpawnTimer <= 0) {
            let s = Math.random() * 50 + 50;
            let emojis = ['🦅', '🎈', '🚁', '⛈️', '🛸'];
            
            this.g13Obstacles.push({
                x: Math.random() * (GameState.canvas.width - s) + s / 2,
                y: -100,
                size: s,
                emoji: emojis[Math.floor(Math.random() * emojis.length)],
                speed: this.g13Speed + Math.random() * 150
            });

            this.g13SpawnTimer = this.g13SpawnRate;
            this.g13Speed += 3.5;
        }

        // Update obstacles
        for (let i = this.g13Obstacles.length - 1; i >= 0; i--) {
            let ob = this.g13Obstacles[i];
            ob.y += ob.speed * (dt / 1000);

            // Collision check
            if (Math.hypot(this.g13Player.x - ob.x, this.g13Player.y - ob.y) < (this.g13Player.size / 2 + ob.size / 2 - 15)) {
                this.g13Lives--;
                this.updateUI();
                UI.createPopEffect(this.g13Player.x, this.g13Player.y, '💥');
                UI.screens.container.classList.add('shake');
                setTimeout(() => UI.screens.container.classList.remove('shake'), 200);
                this.g13Obstacles.splice(i, 1);
                
                if (this.g13Lives <= 0) {
                    this.g13IsDragging = false;
                    UI.endGame("התרסקות!", `טסת למרחק של ${Math.floor(this.g13Score)} ק"מ.`);
                    return;
                }
                continue;
            }

            if (ob.y > GameState.canvas.height + ob.size) {
                this.g13Obstacles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        // Draw sky background
        ctx.save();
        ctx.fillStyle = '#bae6fd';
        ctx.fillRect(0, 0, GameState.canvas.width, GameState.canvas.height);

        // Draw obstacles
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        this.g13Obstacles.forEach(ob => {
            ctx.font = `${ob.size}px Arial`;
            ctx.fillText(ob.emoji, ob.x, ob.y);
        });

        // Draw plane
        ctx.font = `${this.g13Player.size}px Arial`;
        ctx.fillText(this.g13Player.emoji, this.g13Player.x, this.g13Player.y);
        ctx.restore();
    }

    handleInput(type, details) {
        if (type === 'keydown') {
            let step = 60;
            if (details.key === 'ArrowUp') { this.g13Target.y = Math.max(0, this.g13Player.y - step); this.g13Target.x = this.g13Player.x; this.g13Target.active = true; }
            if (details.key === 'ArrowDown') { this.g13Target.y = Math.min(GameState.canvas.height, this.g13Player.y + step); this.g13Target.x = this.g13Player.x; this.g13Target.active = true; }
            if (details.key === 'ArrowLeft') { this.g13Target.x = Math.max(0, this.g13Player.x - step); this.g13Target.y = this.g13Player.y; this.g13Target.active = true; }
            if (details.key === 'ArrowRight') { this.g13Target.x = Math.min(GameState.canvas.width, this.g13Player.x + step); this.g13Target.y = this.g13Player.y; this.g13Target.active = true; }
        }
        if (type === 'mousedown') {
            this.g13IsDragging = true;
            this.g13Target.x = details.x;
            this.g13Target.y = details.y;
            this.g13Target.active = true;
        }
        if (type === 'mousemove' && this.g13IsDragging) {
            this.g13Target.x = details.x;
            this.g13Target.y = details.y;
            this.g13Target.active = true;
        }
        if (type === 'mouseup') {
            this.g13IsDragging = false;
        }
    }
}
