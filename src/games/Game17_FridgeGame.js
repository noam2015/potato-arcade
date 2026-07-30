import { MiniGame } from './MiniGame.js';
import { GameState } from '../core/GameState.js';
import { UI } from '../core/UI.js';

export class Game17_FridgeGame extends MiniGame {
    init(difficulty) {
        UI.screens.container.className = 'relative w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-3xl sm:shadow-2xl overflow-hidden bg-slate-900';

        this.difficulty = difficulty;
        this.g17Level = 1;
        this.g17Dist = (difficulty === 'easy') ? 50 : (difficulty === 'medium' ? 100 : 150);
        this.g17State = 'SAFE'; // 'SAFE', 'WARN', 'DANGER'
        this.g17Timer = 3.0;
        this.g17IsMoving = false;

        const instructEl = document.getElementById('g17-instruction');
        if (instructEl) instructEl.classList.remove('hidden');

        this.updateUI();
    }

    updateUI() {
        const scoreEl = document.getElementById('g17-score');
        const iconEl = document.getElementById('g17-status-icon');

        if (scoreEl) scoreEl.innerText = Math.max(0, Math.floor(this.g17Dist));
        
        if (iconEl) {
            if (this.g17State === 'SAFE') iconEl.innerText = '😴';
            else if (this.g17State === 'WARN') iconEl.innerText = '😠';
            else iconEl.innerText = '👁️';
        }
    }

    update(dt) {
        this.g17Timer -= dt / 1000;
        
        if (this.g17Timer <= 0) {
            if (this.g17State === 'SAFE') {
                this.g17State = 'WARN';
                this.g17Timer = Math.max(0.3, 0.8 - this.g17Level * 0.05) + Math.random() * 0.5;
                UI.screens.container.classList.remove('bg-red-900');
            } else if (this.g17State === 'WARN') {
                this.g17State = 'DANGER';
                this.g17Timer = Math.max(1.0, 2.0 - this.g17Level * 0.1) + Math.random() * 2.0;
                UI.screens.container.classList.add('bg-red-900');
            } else {
                this.g17State = 'SAFE';
                this.g17Timer = Math.max(1.0, 2.5 - this.g17Level * 0.1) + Math.random() * 3.0;
                UI.screens.container.classList.remove('bg-red-900');
            }
            this.updateUI();
        }

        // Danger caught check
        if (this.g17State === 'DANGER' && this.g17IsMoving) {
            UI.createPopEffect(GameState.canvas.width / 2, GameState.canvas.height / 2, '🚨');
            UI.endGame("נתפסת!", `הגעת ל-${this.g17Level - 1} מקררים והיית במרחק ${Math.floor(this.g17Dist)} מטר מהבא.`);
            return;
        }

        // Move player
        if (this.g17IsMoving && (this.g17State === 'SAFE' || this.g17State === 'WARN')) {
            const moveAmt = (this.difficulty === 'easy' ? 15 : 20);
            this.g17Dist -= moveAmt * (dt / 1000);
            this.updateUI();

            if (this.g17Dist <= 0) {
                this.g17Level++;
                this.g17Dist = (this.difficulty === 'easy' ? 50 : 100) + (this.g17Level * 20);
                this.g17State = 'SAFE';
                this.g17Timer = 3.0;
                
                UI.screens.container.classList.remove('bg-red-900');
                UI.createPopEffect(GameState.canvas.width / 2, GameState.canvas.height / 2, '🍰');
                this.updateUI();
            }
        }
    }

    draw(ctx) {
        // Draw dark background
        ctx.save();
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, GameState.canvas.width, GameState.canvas.height);

        // Flash red during danger
        if (this.g17State === 'DANGER') {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
            ctx.fillRect(0, 0, GameState.canvas.width, GameState.canvas.height);
        }

        // Draw Fridge
        ctx.font = '120px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🧊', GameState.canvas.width / 2, GameState.canvas.height / 2 - 150);

        // Draw player ninja
        ctx.font = '80px Arial';
        let bob = this.g17IsMoving ? Math.sin(performance.now() / 100) * 10 : 0;
        ctx.fillText('🥷', GameState.canvas.width / 2, GameState.canvas.height - 100 + bob);
        ctx.restore();
    }

    handleInput(type, details) {
        if (type === 'mousedown') {
            this.g17IsMoving = true;
            const instructEl = document.getElementById('g17-instruction');
            if (instructEl) instructEl.classList.add('hidden');
        }
        if (type === 'mouseup') {
            this.g17IsMoving = false;
        }
    }

    destroy() {
        const instructEl = document.getElementById('g17-instruction');
        if (instructEl) instructEl.classList.add('hidden');
        UI.screens.container.classList.remove('bg-red-900');
    }
}
