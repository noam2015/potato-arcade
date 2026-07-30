import { MiniGame } from './MiniGame.js';
import { GameState } from '../core/GameState.js';
import { UI } from '../core/UI.js';

export class Game24_MatkotGame extends MiniGame {
    init(difficulty) {
        UI.screens.container.className = 'relative w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-3xl sm:shadow-2xl overflow-hidden bg-yellow-100';

        this.g24Score = 0;
        this.g24Lives = 3;
        this.g24TargetY = GameState.canvas.height - 120;

        let initialSpeed = (difficulty === 'easy') ? 300 : (difficulty === 'medium' ? 500 : 700);
        this.g24Ball = {
            x: GameState.canvas.width / 2,
            y: 100,
            vy: initialSpeed,
            speed: initialSpeed
        };

        this.updateUI();
    }

    resize(w, h) {
        this.g24TargetY = h - 120;
    }

    updateUI() {
        const scoreEl = document.getElementById('g24-score');
        const livesEl = document.getElementById('g24-lives');
        if (scoreEl) scoreEl.innerText = this.g24Score;
        if (livesEl) livesEl.innerText = '❤️'.repeat(Math.max(0, this.g24Lives));
    }

    hitMatkot() {
        // Hit check
        if (this.g24Ball.vy > 0 && Math.abs(this.g24Ball.y - this.g24TargetY) < 60) {
            this.g24Ball.vy = -this.g24Ball.speed;
            this.g24Ball.speed += 20;
            this.g24Score++;
            this.updateUI();
            UI.createPopEffect(GameState.canvas.width / 2, this.g24TargetY, '💦', '#38bdf8');
        }
    }

    update(dt) {
        this.g24Ball.y += this.g24Ball.vy * (dt / 1000);

        // Ceiling bounce (automated opponent return)
        if (this.g24Ball.vy < 0 && this.g24Ball.y <= 100) {
            this.g24Ball.vy = this.g24Ball.speed;
            UI.createPopEffect(GameState.canvas.width / 2, 100, '💥', 'white');
        }

        // Falling off-screen (miss)
        if (this.g24Ball.y > GameState.canvas.height + 30) {
            this.g24Lives--;
            this.updateUI();
            UI.screens.container.classList.add('shake');
            setTimeout(() => UI.screens.container.classList.remove('shake'), 200);
            
            UI.createPopEffect(GameState.canvas.width / 2, GameState.canvas.height - 50, '❌');
            
            this.g24Ball.y = 100;
            this.g24Ball.vy = this.g24Ball.speed;

            if (this.g24Lives <= 0) {
                UI.endGame("נפסלת!", `הגעת לראלי של ${this.g24Score} מכות.`);
            }
        }
    }

    draw(ctx) {
        // Beach sand and sea divider
        ctx.save();
        ctx.fillStyle = '#fde047';
        ctx.fillRect(0, GameState.canvas.height / 2, GameState.canvas.width, GameState.canvas.height / 2);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(0, 0, GameState.canvas.width, GameState.canvas.height / 2);

        // Opponent
        ctx.font = '60px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🩳', GameState.canvas.width / 2, 80);

        // Target hit circle zone
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.ellipse(GameState.canvas.width / 2, this.g24TargetY, 60, 20, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Player racquet
        ctx.font = '50px Arial';
        ctx.fillText('🏓', GameState.canvas.width / 2 + 70, this.g24TargetY);

        // Ball
        ctx.font = '40px Arial';
        ctx.fillText('🎾', GameState.canvas.width / 2, this.g24Ball.y);
        ctx.restore();
    }

    handleInput(type, details) {
        if (type === 'keydown') {
            if (details.key === ' ' || details.key === 'Enter') {
                this.hitMatkot();
            }
        }
        if (type === 'mousedown') {
            this.hitMatkot();
        }
    }
}
