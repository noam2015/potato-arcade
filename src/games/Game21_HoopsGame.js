import { MiniGame } from './MiniGame.js';
import { GameState } from '../core/GameState.js';
import { UI } from '../core/UI.js';

export class Game21_HoopsGame extends MiniGame {
    init(difficulty) {
        UI.screens.container.className = 'relative w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-3xl sm:shadow-2xl overflow-hidden bg-sky-200';

        this.g21Score = 0;
        this.g21Lives = 3;
        this.g21Power = 0;
        this.g21PowerDir = 1;
        this.g21Ball = null;
        this.difficulty = difficulty;

        this.g21Hoop = { x: GameState.canvas.width / 2, y: 100, w: 100 };
        this.g21PlayerX = GameState.canvas.width / 2;
        this.isDragging = false;

        this.updateUI();
        this.setWind();
    }

    setWind() {
        let multiplier = this.difficulty === 'easy' ? 0.5 : (this.difficulty === 'medium' ? 1.0 : 1.5);
        this.g21Wind = (Math.random() * 10 - 5) * multiplier;
    }

    shoot() {
        if (this.g21Ball) return;
        this.g21Ball = {
            x: this.g21PlayerX,
            y: GameState.canvas.height - 100,
            vx: this.g21Wind * 100,
            vy: -(400 + this.g21Power * 8),
            size: 40
        };
    }

    updateUI() {
        const scoreEl = document.getElementById('g21-score');
        const livesEl = document.getElementById('g21-lives');
        if (scoreEl) scoreEl.innerText = this.g21Score;
        if (livesEl) livesEl.innerText = '🏀'.repeat(Math.max(0, this.g21Lives));
    }

    update(dt) {
        // Power bar oscillation
        this.g21Power += this.g21PowerDir * 100 * (dt / 1000);
        if (this.g21Power >= 100) {
            this.g21Power = 100;
            this.g21PowerDir = -1;
        }
        if (this.g21Power <= 0) {
            this.g21Power = 0;
            this.g21PowerDir = 1;
        }

        // Ball movement and collision
        if (this.g21Ball) {
            this.g21Ball.vy += 800 * (dt / 1000); // gravity
            this.g21Ball.x += this.g21Ball.vx * (dt / 1000);
            this.g21Ball.y += this.g21Ball.vy * (dt / 1000);

            // Check basket score collision
            const inY = this.g21Ball.vy > 0 && this.g21Ball.y > 110 && this.g21Ball.y < 150;
            const inX = Math.abs(this.g21Ball.x - this.g21Hoop.x) < 40;

            if (inY && inX) {
                this.g21Score++;
                this.updateUI();
                UI.createPopEffect(this.g21Ball.x, this.g21Ball.y, '🔥');
                this.g21Ball = null;
                this.setWind();
                return;
            }

            // Ball goes off-screen (miss)
            if (this.g21Ball.y > GameState.canvas.height) {
                this.g21Lives--;
                this.updateUI();
                UI.createPopEffect(this.g21Ball.x, GameState.canvas.height - 50, '❌');
                UI.screens.container.classList.add('shake');
                setTimeout(() => UI.screens.container.classList.remove('shake'), 200);
                this.g21Ball = null;
                this.setWind();

                if (this.g21Lives <= 0) {
                    UI.endGame("המשחק נגמר!", `קראת ${this.g21Score} סלים.`);
                }
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = '#bae6fd';
        ctx.fillRect(0, 0, GameState.canvas.width, GameState.canvas.height);

        // Balcony floor
        ctx.fillStyle = '#334155';
        ctx.fillRect(0, GameState.canvas.height - 120, GameState.canvas.width, 120);

        // Backboard
        ctx.fillStyle = 'white';
        ctx.fillRect(this.g21Hoop.x - 60, 50, 120, 80);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(this.g21Hoop.x - 50, 60, 100, 60);

        // Hoop rim
        ctx.strokeStyle = '#ea580c';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(this.g21Hoop.x - 40, 130);
        ctx.lineTo(this.g21Hoop.x + 40, 130);
        ctx.stroke();

        // Wind display
        ctx.fillStyle = 'black';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`רוח: ${Math.abs(Math.floor(this.g21Wind))} ${this.g21Wind > 0 ? '➡️' : '⬅️'}`, GameState.canvas.width / 2, 200);

        // Power bar
        ctx.fillStyle = 'white';
        ctx.fillRect(GameState.canvas.width / 2 - 100, GameState.canvas.height - 60, 200, 20);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(GameState.canvas.width / 2 - 100, GameState.canvas.height - 60, this.g21Power * 2, 20);

        if (this.g21Ball) {
            ctx.font = `${this.g21Ball.size}px Arial`;
            ctx.fillText('🏀', this.g21Ball.x, this.g21Ball.y);
        } else {
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.font = '18px Arial';
            ctx.fillText('גרור כדור לכוון, למעלה לזרוק', GameState.canvas.width / 2, GameState.canvas.height - 140);
            
            ctx.font = '40px Arial';
            ctx.fillText('🏀', this.g21PlayerX, GameState.canvas.height - 100);
        }
        ctx.restore();
    }

    handleInput(type, details) {
        if (type === 'keydown') {
            if (details.key === 'ArrowLeft') this.g21PlayerX = Math.max(40, this.g21PlayerX - 40);
            if (details.key === 'ArrowRight') this.g21PlayerX = Math.min(GameState.canvas.width - 40, this.g21PlayerX + 40);
            if (details.key === ' ' || details.key === 'Enter') {
                this.shoot();
            }
        }
        if (type === 'mousedown') {
            if (details.y > GameState.canvas.height - 150) {
                this.isDragging = true;
                this.g21PlayerX = Math.max(40, Math.min(GameState.canvas.width - 40, details.x));
            } else {
                this.shoot();
            }
        }
        if (type === 'mousemove' && this.isDragging) {
            this.g21PlayerX = Math.max(40, Math.min(GameState.canvas.width - 40, details.x));
        }
        if (type === 'mouseup') {
            this.isDragging = false;
        }
    }
}
