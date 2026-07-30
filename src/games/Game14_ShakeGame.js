import { MiniGame } from './MiniGame.js';
import { GameState } from '../core/GameState.js';
import { UI } from '../core/UI.js';

const G14_INGREDIENTS = ['🥤', '🍫', '🥛', '🥭', '🥬', '🧸', '🍡', '🍠'];
const G14_CUSTOMERS = ['👨', '👩', '🧑', '👴', '👵', '👱‍♂️', '👱‍♀️', '🧛‍♂️', '👽'];

export class Game14_ShakeGame extends MiniGame {
    init(difficulty) {
        UI.screens.container.className = 'relative w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-3xl sm:shadow-2xl overflow-hidden bg-pink-100';

        this.g14Score = 0;
        this.g14Lives = 3;
        
        this.difficulty = difficulty;
        this.g14MaxTime = (difficulty === 'easy') ? 20 : (difficulty === 'medium' ? 14 : 8);

        this.updateUI();
        this.nextOrder();

        const controlsEl = document.getElementById('g14-controls');
        if (controlsEl) {
            controlsEl.classList.remove('hidden');
            setTimeout(() => controlsEl.classList.remove('translate-y-full'), 50);
        }
    }

    nextOrder() {
        this.g14Blender = [];
        this.g14Customer = G14_CUSTOMERS[Math.floor(Math.random() * G14_CUSTOMERS.length)];
        this.g14Time = this.g14MaxTime;

        let amt = (this.difficulty === 'easy') ? 3 : (this.difficulty === 'medium' ? 4 : 5);
        this.g14Order = [];
        for (let i = 0; i < amt; i++) {
            this.g14Order.push(G14_INGREDIENTS[Math.floor(Math.random() * G14_INGREDIENTS.length)]);
        }
    }

    addG14(item) {
        if (this.g14Blender.length < 8) {
            this.g14Blender.push(item);
            UI.createPopEffect(GameState.canvas.width / 2 + (Math.random() * 60 - 30), GameState.canvas.height / 2 + 50, item);
        }
    }

    clearG14() {
        this.g14Blender = [];
        UI.createPopEffect(GameState.canvas.width / 2, GameState.canvas.height / 2 + 80, '🗑️');
    }

    blendG14() {
        let orderSorted = [...this.g14Order].sort();
        let blenderSorted = [...this.g14Blender].sort();
        
        let match = orderSorted.length === blenderSorted.length && 
                    orderSorted.every((v, i) => v === blenderSorted[i]);

        if (match) {
            this.g14Score++;
            UI.createPopEffect(GameState.canvas.width / 2, GameState.canvas.height / 2 - 50, '🌟');
            this.nextOrder();
        } else {
            this.g14Lives--;
            UI.createPopEffect(GameState.canvas.width / 2, GameState.canvas.height / 2 - 50, '🤮');
            this.g14Customer = '😠';
            UI.screens.container.classList.add('shake');
            setTimeout(() => UI.screens.container.classList.remove('shake'), 200);
            this.g14Blender = [];

            if (this.g14Lives <= 0) {
                setTimeout(() => UI.endGame("לקוחות זועמים!", `הכנת ${this.g14Score} שייקים.`), 500);
            }
        }

        this.updateUI();
    }

    updateUI() {
        const scoreEl = document.getElementById('g14-score');
        const livesEl = document.getElementById('g14-lives');
        if (scoreEl) scoreEl.innerText = this.g14Score;
        if (livesEl) livesEl.innerText = '❤️'.repeat(Math.max(0, this.g14Lives));
    }

    update(dt) {
        this.g14Time -= dt / 1000;
        
        const timerBar = document.getElementById('g14-timer-bar');
        if (timerBar) {
            timerBar.style.width = `${Math.max(0, (this.g14Time / this.g14MaxTime) * 100)}%`;
        }

        if (this.g14Time <= 0) {
            this.g14Lives--;
            UI.createPopEffect(GameState.canvas.width / 2, GameState.canvas.height / 2, '⏳');
            UI.screens.container.classList.add('shake');
            setTimeout(() => UI.screens.container.classList.remove('shake'), 200);
            
            this.updateUI();

            if (this.g14Lives <= 0) {
                setTimeout(() => UI.endGame("המשמרת נגמרה!", `הכנת ${this.g14Score} שייקים.`), 500);
            } else {
                this.nextOrder();
            }
        }
    }

    draw(ctx) {
        // Draw pink kitchen counter background
        ctx.save();
        ctx.fillStyle = '#fce7f3';
        ctx.fillRect(0, 0, GameState.canvas.width, GameState.canvas.height);

        ctx.fillStyle = '#9d174d';
        ctx.fillRect(0, GameState.canvas.height / 2 + 70, GameState.canvas.width, GameState.canvas.height);
        
        ctx.fillStyle = '#be185d';
        ctx.fillRect(0, GameState.canvas.height / 2 + 70, GameState.canvas.width, 20);

        // Draw customer
        ctx.font = '120px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let bob = Math.sin(performance.now() / 200) * 5;
        ctx.fillText(this.g14Customer, GameState.canvas.width / 2, GameState.canvas.height / 2 - 60 + bob);

        // Draw order bubble
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.roundRect(GameState.canvas.width / 2 - 140, GameState.canvas.height / 2 - 250 + bob, 280, 80, 20);
        ctx.fill();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Draw order items inside speech bubble
        ctx.font = '35px Arial';
        let startX = GameState.canvas.width / 2 - (this.g14Order.length * 20) + 20;
        for (let i = 0; i < this.g14Order.length; i++) {
            ctx.fillText(this.g14Order[i], startX + i * 40 - 20, GameState.canvas.height / 2 - 210 + bob);
        }

        // Draw blender body
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.moveTo(GameState.canvas.width / 2 - 60, GameState.canvas.height / 2 + 180);
        ctx.lineTo(GameState.canvas.width / 2 + 60, GameState.canvas.height / 2 + 180);
        ctx.lineTo(GameState.canvas.width / 2 + 80, GameState.canvas.height / 2 + 30);
        ctx.lineTo(GameState.canvas.width / 2 - 80, GameState.canvas.height / 2 + 30);
        ctx.fill();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Draw blender base
        ctx.fillStyle = '#475569';
        ctx.fillRect(GameState.canvas.width / 2 - 70, GameState.canvas.height / 2 + 180, 140, 50);
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(GameState.canvas.width / 2, GameState.canvas.height / 2 + 205, 10, 0, Math.PI * 2);
        ctx.fill();

        // Draw blended ingredients
        ctx.font = '28px Arial';
        for (let i = 0; i < this.g14Blender.length; i++) {
            let px = GameState.canvas.width / 2 + (Math.sin(i * 1.5) * 30);
            let py = GameState.canvas.height / 2 + 160 - i * 16;
            ctx.fillText(this.g14Blender[i], px, py);
        }
        ctx.restore();
    }

    destroy() {
        const controlsEl = document.getElementById('g14-controls');
        if (controlsEl) {
            controlsEl.classList.add('translate-y-full');
            setTimeout(() => controlsEl.classList.add('hidden'), 200);
        }
    }
}
