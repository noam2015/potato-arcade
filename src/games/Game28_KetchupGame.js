import { MiniGame } from './MiniGame.js';
import { GameState } from '../core/GameState.js';
import { UI } from '../core/UI.js';

export class Game28_KetchupGame extends MiniGame {
    init(difficulty) {
        UI.screens.container.className = 'relative w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-3xl sm:shadow-2xl overflow-hidden bg-red-100';

        this.g28Score = 0;
        this.g28Lives = 3;
        this.g28Cursor = 50;
        this.g28Dir = 1;

        this.g28Speed = (difficulty === 'easy') ? 200 : (difficulty === 'medium' ? 400 : 600);
        this.g28TargetW = (difficulty === 'easy') ? 30 : 20;

        this.randomizeTarget();
        this.updateUI();
    }

    randomizeTarget() {
        this.g28TargetX = Math.random() * (100 - this.g28TargetW);
    }

    updateUI() {
        const scoreEl = document.getElementById('g28-score');
        const livesEl = document.getElementById('g28-lives');
        if (scoreEl) scoreEl.innerText = this.g28Score;
        if (livesEl) livesEl.innerText = '❤️'.repeat(Math.max(0, this.g28Lives));
    }

    squeezeKetchup() {
        if (this.g28Cursor >= this.g28TargetX && this.g28Cursor <= this.g28TargetX + this.g28TargetW) {
            this.g28Score++;
            this.updateUI();
            UI.createPopEffect(GameState.canvas.width / 2, GameState.canvas.height / 2 + 50, '💦', '#ef4444');
            
            this.g28Speed += 30;
            this.g28TargetW = Math.max(5, this.g28TargetW - 1);
            this.randomizeTarget();
        } else {
            this.g28Lives--;
            this.updateUI();
            
            UI.createPopEffect(GameState.canvas.width / 2, GameState.canvas.height / 2, '❌');
            UI.screens.container.classList.add('shake');
            setTimeout(() => UI.screens.container.classList.remove('shake'), 200);

            if (this.g28Lives <= 0) {
                UI.endGame("השפרצת הכל!", `הוצאת ${this.g28Score} מנות קטשופ.`);
            }
        }
    }

    update(dt) {
        // Move slider cursor back and forth
        this.g28Cursor += this.g28Dir * (this.g28Speed / 10) * (dt / 1000);
        if (this.g28Cursor > 100) {
            this.g28Cursor = 100;
            this.g28Dir = -1;
        }
        if (this.g28Cursor < 0) {
            this.g28Cursor = 0;
            this.g28Dir = 1;
        }
    }

    draw(ctx) {
        // Draw background and Ketchup Bottle
        ctx.save();
        ctx.fillStyle = '#fee2e2';
        ctx.fillRect(0, 0, GameState.canvas.width, GameState.canvas.height);

        ctx.font = '150px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🥫', GameState.canvas.width / 2, GameState.canvas.height / 2 - 50);

        // Target bar track background
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(20, GameState.canvas.height - 100, GameState.canvas.width - 40, 40);

        // Safe target zone (green segment)
        let targetPx = 20 + (this.g28TargetX / 100) * (GameState.canvas.width - 40);
        let targetWPx = (this.g28TargetW / 100) * (GameState.canvas.width - 40);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(targetPx, GameState.canvas.height - 100, targetWPx, 40);

        // Current cursor position indicator (white bar)
        let cursorPx = 20 + (this.g28Cursor / 100) * (GameState.canvas.width - 40);
        ctx.fillStyle = 'white';
        ctx.fillRect(cursorPx - 3, GameState.canvas.height - 110, 6, 60);
        ctx.restore();
    }

    handleInput(type, details) {
        if (type === 'keydown') {
            if (details.key === ' ' || details.key === 'Enter') {
                this.squeezeKetchup();
            }
        }
        if (type === 'mousedown') {
            this.squeezeKetchup();
        }
    }
}
