import { MiniGame } from './MiniGame.js';
import { GameState } from '../core/GameState.js';
import { UI } from '../core/UI.js';

export class Game30_PhoneGame extends MiniGame {
    init(difficulty) {
        UI.screens.container.className = 'relative w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-3xl sm:shadow-2xl overflow-hidden bg-slate-200';

        this.g30Score = 0;
        this.g30Lives = 3;
        
        this.g30MaxTime = (difficulty === 'easy') ? 4.0 : (difficulty === 'medium' ? 2.5 : 1.5);
        this.g30Time = this.g30MaxTime;
        this.g30Target = 0;

        this.updateUI();
        this.nextPrompt();

        const controlsEl = document.getElementById('g30-controls');
        if (controlsEl) {
            controlsEl.classList.remove('hidden');
            setTimeout(() => controlsEl.classList.remove('translate-y-full'), 50);
        }
    }

    nextPrompt() {
        this.g30Target = Math.floor(Math.random() * 9) + 1;
        this.g30Time = this.g30MaxTime;
        
        let prompts = [
            `לניתוק השיחה הקש ${this.g30Target}`, 
            `לבירור חשבון הקש ${this.g30Target}`, 
            `לנציג שירות הקש ${this.g30Target}`, 
            `לחזרה לתפריט הקש ${this.g30Target}`
        ];
        
        const promptEl = document.getElementById('g30-prompt');
        if (promptEl) {
            promptEl.innerText = prompts[Math.floor(Math.random() * prompts.length)];
        }
    }

    g30Press(num) {
        if (GameState.state !== 'GAME30') return;

        if (num === this.g30Target) {
            this.g30Score++;
            this.updateUI();
            UI.createPopEffect(GameState.canvas.width / 2, GameState.canvas.height / 2, '✅', '#22c55e');
            
            this.g30MaxTime = Math.max(0.5, this.g30MaxTime - 0.05);
            this.nextPrompt();
        } else {
            this.g30Lives--;
            this.updateUI();
            
            UI.createPopEffect(GameState.canvas.width / 2, GameState.canvas.height / 2, '❌');
            UI.screens.container.classList.add('shake');
            setTimeout(() => UI.screens.container.classList.remove('shake'), 200);

            if (this.g30Lives <= 0) {
                setTimeout(() => UI.endGame("השיחה נותקה!", `עברת ${this.g30Score} תפריטים בהצלחה.`), 500);
            } else {
                this.nextPrompt();
            }
        }
    }

    updateUI() {
        const scoreEl = document.getElementById('g30-score');
        const livesEl = document.getElementById('g30-lives');
        if (scoreEl) scoreEl.innerText = this.g30Score;
        if (livesEl) livesEl.innerText = '❤️'.repeat(Math.max(0, this.g30Lives));
    }

    update(dt) {
        this.g30Time -= dt / 1000;

        const timerBar = document.getElementById('g30-timer-bar');
        if (timerBar) {
            timerBar.style.width = `${Math.max(0, (this.g30Time / this.g30MaxTime) * 100)}%`;
        }

        if (this.g30Time <= 0) {
            this.g30Lives--;
            this.updateUI();
            UI.createPopEffect(GameState.canvas.width / 2, GameState.canvas.height / 2, '⏳');
            UI.screens.container.classList.add('shake');
            setTimeout(() => UI.screens.container.classList.remove('shake'), 200);

            if (this.g30Lives <= 0) {
                setTimeout(() => UI.endGame("השיחה נותקה!", `עברת ${this.g30Score} תפריטים בהצלחה.`), 500);
            } else {
                this.nextPrompt();
            }
        }
    }

    draw(ctx) {
        // Draw customer support dialer background
        ctx.save();
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(0, 0, GameState.canvas.width, GameState.canvas.height);

        ctx.font = '120px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let bob = Math.sin(performance.now() / 150) * 10;
        ctx.fillText('📞', GameState.canvas.width / 2, GameState.canvas.height / 2 - 80 + bob);
        ctx.restore();
    }

    destroy() {
        const controlsEl = document.getElementById('g30-controls');
        if (controlsEl) {
            controlsEl.classList.add('translate-y-full');
        }
    }
}
