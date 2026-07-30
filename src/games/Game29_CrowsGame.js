import { MiniGame } from './MiniGame.js';
import { GameState } from '../core/GameState.js';
import { UI } from '../core/UI.js';

export class Game29_CrowsGame extends MiniGame {
    init(difficulty) {
        UI.screens.container.className = 'relative w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-3xl sm:shadow-2xl overflow-hidden bg-green-200';

        this.g29Score = 0;
        this.g29Lives = 3;
        this.g29Birds = [];
        this.g29SpawnTimer = 0;

        this.g29Speed = (difficulty === 'easy') ? 100 : (difficulty === 'medium' ? 180 : 300);

        this.updateUI();
    }

    updateUI() {
        const scoreEl = document.getElementById('g29-score');
        const livesEl = document.getElementById('g29-lives');
        if (scoreEl) scoreEl.innerText = this.g29Score;
        if (livesEl) livesEl.innerText = '❤️'.repeat(Math.max(0, this.g29Lives));
    }

    update(dt) {
        this.g29SpawnTimer -= dt / 1000;
        if (this.g29SpawnTimer <= 0) {
            let side = Math.floor(Math.random() * 4);
            let ex, ey;

            if (side === 0) { ex = Math.random() * GameState.canvas.width; ey = -50; }
            else if (side === 1) { ex = GameState.canvas.width + 50; ey = Math.random() * GameState.canvas.height; }
            else if (side === 2) { ex = Math.random() * GameState.canvas.width; ey = GameState.canvas.height + 50; }
            else { ex = -50; ey = Math.random() * GameState.canvas.height; }

            let emojis = ['🐦‍⬛', '🦅', '🕊️'];
            this.g29Birds.push({
                x: ex,
                y: ey,
                emoji: emojis[Math.floor(Math.random() * emojis.length)]
            });

            this.g29SpawnTimer = Math.max(0.3, 1.2 - (this.g29Score * 0.03));
        }

        // Move birds towards center popcorn box
        let cx = GameState.canvas.width / 2;
        let cy = GameState.canvas.height / 2;

        for (let i = this.g29Birds.length - 1; i >= 0; i--) {
            let b = this.g29Birds[i];
            let ang = Math.atan2(cy - b.y, cx - b.x);
            
            b.x += Math.cos(ang) * this.g29Speed * (dt / 1000);
            b.y += Math.sin(ang) * this.g29Speed * (dt / 1000);

            // Popcorn box collision check (center reach)
            if (Math.hypot(b.x - cx, b.y - cy) < 40) {
                this.g29Lives--;
                this.updateUI();
                UI.createPopEffect(cx, cy, '💥');
                UI.screens.container.classList.add('shake');
                setTimeout(() => UI.screens.container.classList.remove('shake'), 200);
                this.g29Birds.splice(i, 1);

                if (this.g29Lives <= 0) {
                    UI.endGame("נגמר החטיף!", `הברחת ${this.g29Score} עורבים רעבים.`);
                    return;
                }
            }
        }
    }

    draw(ctx) {
        // Draw garden green lawn background
        ctx.save();
        ctx.fillStyle = '#86efac';
        ctx.fillRect(0, 0, GameState.canvas.width, GameState.canvas.height);

        // Popcorn bucket center bobbing
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '80px Arial';
        let bob = Math.sin(performance.now() / 150) * 5;
        ctx.fillText('🍿', GameState.canvas.width / 2, GameState.canvas.height / 2 + bob);

        // Draw attacking birds
        ctx.font = '50px Arial';
        this.g29Birds.forEach(b => {
            ctx.fillText(b.emoji, b.x, b.y);
        });
        ctx.restore();
    }

    handleInput(type, details) {
        if (type === 'mousedown') {
            const { x, y } = details;
            let hit = false;
            
            for (let i = this.g29Birds.length - 1; i >= 0; i--) {
                let b = this.g29Birds[i];
                if (Math.hypot(b.x - x, b.y - y) < 40) {
                    UI.createPopEffect(b.x, b.y, '💥');
                    this.g29Birds.splice(i, 1);
                    this.g29Score++;
                    this.updateUI();
                    hit = true;
                    break;
                }
            }

            if (!hit) {
                UI.createPopEffect(x, y, '💨');
            }
        }
    }
}
