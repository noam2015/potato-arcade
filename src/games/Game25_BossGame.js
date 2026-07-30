import { MiniGame } from './MiniGame.js';
import { GameState } from '../core/GameState.js';
import { UI } from '../core/UI.js';

export class Game25_BossGame extends MiniGame {
    init(difficulty) {
        UI.screens.container.className = 'relative w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-3xl sm:shadow-2xl overflow-hidden bg-gray-900';

        this.g25Score = 0;
        this.g25State = 'SAFE'; // 'SAFE', 'WARN', 'DANGER'
        this.g25Timer = 2.0;
        this.g25IsPlaying = false;

        const scoreEl = document.getElementById('g25-score');
        if (scoreEl) scoreEl.innerText = '0';

        const warningEl = document.getElementById('g25-warning');
        if (warningEl) warningEl.classList.add('hidden');
    }

    update(dt) {
        this.g25Timer -= dt / 1000;
        
        if (this.g25Timer <= 0) {
            const warningEl = document.getElementById('g25-warning');
            
            if (this.g25State === 'SAFE') {
                this.g25State = 'WARN';
                this.g25Timer = 0.5 + Math.random();
                if (warningEl) warningEl.classList.remove('hidden');
            } else if (this.g25State === 'WARN') {
                this.g25State = 'DANGER';
                this.g25Timer = 1.0 + Math.random();
                if (warningEl) warningEl.classList.add('hidden');
            } else {
                this.g25State = 'SAFE';
                this.g25Timer = 2.0 + Math.random() * 2;
            }
        }

        // Caught by boss check
        if (this.g25State === 'DANGER' && this.g25IsPlaying) {
            UI.endGame("פוטרת!", `צברת ${Math.floor(this.g25Score)} נקודות מורל לפני שנתפסת.`);
            return;
        }

        // Increase score if playing
        if (this.g25IsPlaying) {
            this.g25Score += dt / 10;
            const scoreEl = document.getElementById('g25-score');
            if (scoreEl) scoreEl.innerText = Math.floor(this.g25Score);
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(0, 0, GameState.canvas.width, GameState.canvas.height);

        // Desk
        ctx.fillStyle = '#4b5563';
        ctx.fillRect(GameState.canvas.width / 2 - 150, GameState.canvas.height - 200, 300, 200);

        // Monitor screen (blue if playing game, dark if charts)
        ctx.fillStyle = this.g25IsPlaying ? '#3b82f6' : '#111827';
        ctx.fillRect(GameState.canvas.width / 2 - 100, GameState.canvas.height - 300, 200, 150);

        // Monitor stand
        ctx.fillStyle = '#9ca3af';
        ctx.fillRect(GameState.canvas.width / 2 - 20, GameState.canvas.height - 150, 40, 50);

        // Screen content emoji
        ctx.font = '50px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (this.g25IsPlaying) {
            ctx.fillText('🎮', GameState.canvas.width / 2, GameState.canvas.height - 225);
        } else {
            ctx.fillText('📊', GameState.canvas.width / 2, GameState.canvas.height - 225);
        }

        // Instruction guide
        if (this.g25Score < 10) {
            ctx.fillStyle = 'white';
            ctx.font = '20px Arial';
            ctx.fillText('החזק מגע (או רווח) כדי לשחק. עזוב כשהבוס מגיע!', GameState.canvas.width / 2, 100);
        }

        // Angry boss appearance
        if (this.g25State === 'DANGER') {
            ctx.font = '150px Arial';
            ctx.fillText('🦹‍♂️', GameState.canvas.width / 2, GameState.canvas.height / 2 - 100);
        }
        ctx.restore();
    }

    handleInput(type, details) {
        if (type === 'keydown') {
            if (details.key === ' ') {
                this.g25IsPlaying = true;
            }
        }
        if (type === 'keyup') {
            if (details.key === ' ') {
                this.g25IsPlaying = false;
            }
        }
        if (type === 'mousedown') {
            this.g25IsPlaying = true;
        }
        if (type === 'mouseup') {
            this.g25IsPlaying = false;
        }
    }

    destroy() {
        const warningEl = document.getElementById('g25-warning');
        if (warningEl) warningEl.classList.add('hidden');
    }
}
