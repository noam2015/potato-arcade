import { MiniGame } from './MiniGame.js';
import { GameState } from '../core/GameState.js';
import { UI } from '../core/UI.js';

const G20_INGS = ['🍅', '🧀', '🍍', '🍠', '🌶️', '🍄'];
const G20_CUSTOMERS = ['👨', '👩', '🧑', '👴', '👵', '👱‍♂️', '👱‍♀️', '🧛‍♂️', '👽'];

export class Game20_PizzaGame extends MiniGame {
    init(difficulty) {
        UI.screens.container.className = 'relative w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-3xl sm:shadow-2xl overflow-hidden bg-orange-100';

        this.g20Score = 0;
        this.g20Lives = 3;
        this.g20Pizza = [];
        this.difficulty = difficulty;
        this.g20MaxTime = (difficulty === 'easy') ? 20 : (difficulty === 'medium' ? 15 : 10);

        this.updateUI();
        this.nextOrder();

        const controlsEl = document.getElementById('g20-controls');
        if (controlsEl) {
            controlsEl.classList.remove('hidden');
            setTimeout(() => controlsEl.classList.remove('translate-y-full'), 50);
        }
    }

    nextOrder() {
        this.g20Pizza = [];
        this.g20Customer = G20_CUSTOMERS[Math.floor(Math.random() * G20_CUSTOMERS.length)];
        this.g20Time = this.g20MaxTime;
        
        let amt = (this.difficulty === 'easy') ? 2 : (this.difficulty === 'medium' ? 3 : 4);
        this.g20Order = [];
        for (let i = 0; i < amt; i++) {
            this.g20Order.push(G20_INGS[Math.floor(Math.random() * G20_INGS.length)]);
        }
    }

    addG20(item) {
        if (this.g20Pizza.length < 6) {
            this.g20Pizza.push(item);
            UI.createPopEffect(GameState.canvas.width / 2 + (Math.random() * 60 - 30), GameState.canvas.height / 2 + 50, item);
        }
    }

    clearG20() {
        this.g20Pizza = [];
        UI.createPopEffect(GameState.canvas.width / 2, GameState.canvas.height / 2 + 80, '🗑️');
    }

    serveG20() {
        let orderSorted = [...this.g20Order].sort();
        let pizzaSorted = [...this.g20Pizza].sort();
        
        let match = orderSorted.length === pizzaSorted.length && 
                    orderSorted.every((v, i) => v === pizzaSorted[i]);

        if (match) {
            this.g20Score++;
            UI.createPopEffect(GameState.canvas.width / 2, GameState.canvas.height / 2 - 50, '🌟');
            this.nextOrder();
        } else {
            this.g20Lives--;
            UI.createPopEffect(GameState.canvas.width / 2, GameState.canvas.height / 2 - 50, '🤮');
            this.g20Customer = '😠';
            UI.screens.container.classList.add('shake');
            setTimeout(() => UI.screens.container.classList.remove('shake'), 200);
            this.g20Pizza = [];

            if (this.g20Lives <= 0) {
                setTimeout(() => UI.endGame("הפיצריה נסגרה!", `הגשת ${this.g20Score} מגשים.`), 500);
            }
        }

        this.updateUI();
    }

    updateUI() {
        const scoreEl = document.getElementById('g20-score');
        const livesEl = document.getElementById('g20-lives');
        if (scoreEl) scoreEl.innerText = this.g20Score;
        if (livesEl) livesEl.innerText = '❤️'.repeat(Math.max(0, this.g20Lives));
    }

    update(dt) {
        this.g20Time -= dt / 1000;
        
        const timerBar = document.getElementById('g20-timer-bar');
        if (timerBar) {
            timerBar.style.width = `${Math.max(0, (this.g20Time / this.g20MaxTime) * 100)}%`;
        }

        if (this.g20Time <= 0) {
            this.g20Lives--;
            UI.createPopEffect(GameState.canvas.width / 2, GameState.canvas.height / 2, '⏳');
            UI.screens.container.classList.add('shake');
            setTimeout(() => UI.screens.container.classList.remove('shake'), 200);
            
            this.updateUI();

            if (this.g20Lives <= 0) {
                setTimeout(() => UI.endGame("הפיצריה נסגרה!", `הגשת ${this.g20Score} מגשים.`), 500);
            } else {
                this.nextOrder();
            }
        }
    }

    draw(ctx) {
        // Draw pizza background table
        ctx.save();
        ctx.fillStyle = '#ffedd5';
        ctx.fillRect(0, 0, GameState.canvas.width, GameState.canvas.height);

        ctx.fillStyle = '#991b1b';
        ctx.fillRect(0, GameState.canvas.height / 2 + 20, GameState.canvas.width, GameState.canvas.height);
        
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(0, GameState.canvas.height / 2 + 20, GameState.canvas.width, 20);

        // Draw customer
        ctx.font = '100px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let bob = Math.sin(performance.now() / 200) * 5;
        ctx.fillText(this.g20Customer, GameState.canvas.width / 2, GameState.canvas.height / 2 - 100 + bob);

        // Draw order bubble
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.roundRect(GameState.canvas.width / 2 - 120, GameState.canvas.height / 2 - 250 + bob, 240, 80, 20);
        ctx.fill();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Draw order emojis
        ctx.font = '35px Arial';
        let startX = GameState.canvas.width / 2 - (this.g20Order.length * 20) + 20;
        for (let i = 0; i < this.g20Order.length; i++) {
            ctx.fillText(this.g20Order[i], startX + i * 40 - 20, GameState.canvas.height / 2 - 210 + bob);
        }

        // Draw pizza dough base circle
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(GameState.canvas.width / 2, GameState.canvas.height / 2 + 150, 100, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 10;
        ctx.stroke();

        // Draw placed ingredients around circular layout
        ctx.font = '30px Arial';
        for (let i = 0; i < this.g20Pizza.length; i++) {
            let angle = (i / this.g20Pizza.length) * Math.PI * 2;
            let px = GameState.canvas.width / 2 + Math.cos(angle) * 40;
            let py = GameState.canvas.height / 2 + 150 + Math.sin(angle) * 40;
            ctx.fillText(this.g20Pizza[i], px, py);
        }
        ctx.restore();
    }

    destroy() {
        const controlsEl = document.getElementById('g20-controls');
        if (controlsEl) {
            controlsEl.classList.add('translate-y-full');
            setTimeout(() => controlsEl.classList.add('hidden'), 200);
        }
    }
}
