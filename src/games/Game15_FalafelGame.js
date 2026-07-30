import { MiniGame } from './MiniGame.js';
import { GameState } from '../core/GameState.js';
import { UI } from '../core/UI.js';

export class Game15_FalafelGame extends MiniGame {
    init(difficulty) {
        UI.screens.container.className = 'relative w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-3xl sm:shadow-2xl overflow-hidden bg-amber-100';

        this.g15Score = 0;
        this.g15Lives = 3;
        this.g15Falafels = [];

        this.g15Pita = {
            x: 0,
            y: 50,
            w: (difficulty === 'easy') ? 140 : (difficulty === 'medium' ? 100 : 70),
            h: 40,
            speed: (difficulty === 'easy') ? 150 : (difficulty === 'medium' ? 250 : 400),
            dir: 1
        };
        this.g15Pita.x = GameState.canvas.width / 2 - this.g15Pita.w / 2;

        this.updateUI();
    }

    updateUI() {
        const scoreEl = document.getElementById('g15-score');
        const livesEl = document.getElementById('g15-lives');
        if (scoreEl) scoreEl.innerText = this.g15Score;
        if (livesEl) livesEl.innerText = '❤️'.repeat(this.g15Lives);
    }

    shoot() {
        this.g15Falafels.push({
            x: GameState.canvas.width / 2,
            y: GameState.canvas.height,
            speed: 400
        });
    }

    update(dt) {
        // Move Pita
        this.g15Pita.x += this.g15Pita.speed * this.g15Pita.dir * (dt / 1000);
        if (this.g15Pita.x + this.g15Pita.w > GameState.canvas.width) {
            this.g15Pita.x = GameState.canvas.width - this.g15Pita.w;
            this.g15Pita.dir = -1;
        }
        if (this.g15Pita.x < 0) {
            this.g15Pita.x = 0;
            this.g15Pita.dir = 1;
        }

        // Move Falafels
        for (let i = this.g15Falafels.length - 1; i >= 0; i--) {
            let f = this.g15Falafels[i];
            f.y -= f.speed * (dt / 1000);

            // Collision check
            const collided = f.y < this.g15Pita.y + this.g15Pita.h && 
                             f.y > this.g15Pita.y && 
                             f.x > this.g15Pita.x && 
                             f.x < this.g15Pita.x + this.g15Pita.w;

            if (collided) {
                this.g15Score++;
                this.updateUI();
                UI.createPopEffect(f.x, f.y, '🎯');
                
                this.g15Pita.speed += 10;
                this.g15Pita.w = Math.max(40, this.g15Pita.w - 1);
                this.g15Falafels.splice(i, 1);
                continue;
            }

            // Missed check
            if (f.y < 0) {
                this.g15Lives--;
                this.updateUI();
                UI.createPopEffect(f.x, 20, '❌');
                UI.screens.container.classList.add('shake');
                setTimeout(() => UI.screens.container.classList.remove('shake'), 200);
                this.g15Falafels.splice(i, 1);

                if (this.g15Lives <= 0) {
                    UI.endGame("פספסת!", `קלעת ${this.g15Score} מנות פלאפל.`);
                    return;
                }
            }
        }
    }

    draw(ctx) {
        // Draw background
        ctx.save();
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(0, 0, GameState.canvas.width, GameState.canvas.height);

        // Draw moving Pita container
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.roundRect(this.g15Pita.x, this.g15Pita.y, this.g15Pita.w, this.g15Pita.h, 10);
        ctx.fill();

        ctx.fillStyle = '#fde68a';
        ctx.beginPath();
        ctx.roundRect(this.g15Pita.x + 5, this.g15Pita.y - 10, this.g15Pita.w - 10, this.g15Pita.h, 20);
        ctx.fill();
        ctx.restore();

        // Draw shooter emoji
        ctx.save();
        ctx.font = '60px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🧆', GameState.canvas.width / 2, GameState.canvas.height - 40);

        // Draw active falafels
        this.g15Falafels.forEach(f => {
            ctx.fillText('🧆', f.x, f.y);
        });
        ctx.restore();
    }

    handleInput(type, details) {
        if (type === 'mousedown') {
            this.shoot();
        }
    }
}
