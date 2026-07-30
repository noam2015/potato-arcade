import { MiniGame } from './MiniGame.js';
import { GameState } from '../core/GameState.js';
import { UI } from '../core/UI.js';

export class Game5_Flappy extends MiniGame {
    init(difficulty) {
        UI.screens.container.className = 'relative w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-3xl sm:shadow-2xl overflow-hidden bg-sky-300';

        this.g5Bird = {
            y: GameState.canvas.height / 2,
            vy: 0,
            gravity: (difficulty === 'easy') ? 900 : 1500,
            flap: (difficulty === 'easy') ? -350 : -450
        };

        this.g5Pipes = [];
        this.g5Score = 0;
        this.g5Speed = (difficulty === 'easy') ? 150 : 300;
        this.g5SpawnTimer = 0;
        this.g5PipeGap = (difficulty === 'easy') ? 250 : 130;

        const scoreEl = document.getElementById('g5-score');
        if (scoreEl) scoreEl.innerText = '0';
    }

    flap() {
        this.g5Bird.vy = this.g5Bird.flap;
        UI.createPopEffect(GameState.canvas.width / 3, this.g5Bird.y, '💨');
    }

    update(dt) {
        this.g5Bird.vy += this.g5Bird.gravity * (dt / 1000);
        this.g5Bird.y += this.g5Bird.vy * (dt / 1000);

        this.g5SpawnTimer -= dt;
        if (this.g5SpawnTimer <= 0) {
            let h = Math.random() * (GameState.canvas.height - this.g5PipeGap - 100) + 50;
            this.g5Pipes.push({ x: GameState.canvas.width, top: h, passed: false });
            this.g5SpawnTimer = 1500;
        }

        for (let i = this.g5Pipes.length - 1; i >= 0; i--) {
            let p = this.g5Pipes[i];
            p.x -= this.g5Speed * (dt / 1000);

            // Collision check
            const birdSize = 20; // approximation of bird hitbox radius
            const horizontalCollision = (GameState.canvas.width / 3 + birdSize > p.x) && (GameState.canvas.width / 3 - birdSize < p.x + 60);
            
            if (horizontalCollision) {
                if (this.g5Bird.y - birdSize < p.top || this.g5Bird.y + birdSize > p.top + this.g5PipeGap) {
                    UI.endGame("היונה התרסקה", `עברת ${this.g5Score} צינורות.`);
                    return;
                }
            }

            if (!p.passed && p.x + 60 < GameState.canvas.width / 3) {
                p.passed = true;
                this.g5Score++;
                const scoreEl = document.getElementById('g5-score');
                if (scoreEl) scoreEl.innerText = this.g5Score;
            }

            if (p.x < -60) {
                this.g5Pipes.splice(i, 1);
            }
        }

        if (this.g5Bird.y > GameState.canvas.height || this.g5Bird.y < 0) {
            UI.endGame("היונה נפלה", `עברת ${this.g5Score} צינורות.`);
        }
    }

    draw(ctx) {
        // Draw bird
        ctx.save();
        ctx.font = '50px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🐦', GameState.canvas.width / 3, this.g5Bird.y);
        ctx.restore();

        // Draw pipes
        ctx.save();
        ctx.fillStyle = '#10b981';
        this.g5Pipes.forEach(p => {
            ctx.fillRect(p.x, 0, 60, p.top);
            ctx.fillRect(p.x, p.top + this.g5PipeGap, 60, GameState.canvas.height);
        });
        ctx.restore();
    }

    handleInput(type, details) {
        if (type === 'keydown') {
            if (details.key === ' ' || details.key === 'ArrowUp') {
                this.flap();
            }
        }
        if (type === 'mousedown') {
            this.flap();
        }
    }
}
