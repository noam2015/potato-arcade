import { MiniGame } from './MiniGame.js';
import { GameState } from '../core/GameState.js';
import { UI } from '../core/UI.js';

const G8_MENU = ['🍔', '🍟', '🍦', '🥤'];

export class Game8_Memory extends MiniGame {
    init(difficulty) {
        UI.screens.container.className = 'relative w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-3xl sm:shadow-2xl overflow-hidden bg-blue-100';

        this.g8Level = 1;
        this.g8Seq = [];
        this.g8PlayerSeq = [];
        this.g8Phase = 'SHOWING'; // 'SHOWING', 'WAITING', 'SUCCESS'
        this.g8ShowTimer = 0;
        this.g8ShowIndex = 0;
        this.difficulty = difficulty;

        this.nextLevel();
    }

    nextLevel() {
        this.g8Seq = [];
        this.g8PlayerSeq = [];
        
        let length = (this.difficulty === 'easy') 
            ? this.g8Level + 1 
            : (this.difficulty === 'medium' ? this.g8Level + 2 : this.g8Level + 3);

        for (let i = 0; i < length; i++) {
            this.g8Seq.push(G8_MENU[Math.floor(Math.random() * G8_MENU.length)]);
        }

        this.g8Phase = 'SHOWING';
        this.g8ShowIndex = 0;
        this.g8ShowTimer = 1.0;

        const levelEl = document.getElementById('g8-level');
        const statusEl = document.getElementById('g8-status');
        const controlsEl = document.getElementById('g8-controls');

        if (levelEl) levelEl.innerText = this.g8Level;
        if (statusEl) statusEl.innerText = 'צפה בהזמנה... 👀';
        if (controlsEl) controlsEl.classList.add('translate-y-full');
    }

    g8Input(item) {
        if (this.g8Phase !== 'WAITING') return;

        this.g8PlayerSeq.push(item);
        UI.createPopEffect(GameState.canvas.width / 2 + (Math.random() * 100 - 50), GameState.canvas.height / 2, item);

        let currentIndex = this.g8PlayerSeq.length - 1;
        const controlsEl = document.getElementById('g8-controls');
        const statusEl = document.getElementById('g8-status');

        if (this.g8PlayerSeq[currentIndex] !== this.g8Seq[currentIndex]) {
            if (controlsEl) controlsEl.classList.add('translate-y-full');
            UI.endGame("התבלבלת בהזמנה!", `הלקוח כועס. שרדת ${this.g8Level - 1} שלבים.`);
        } else if (this.g8PlayerSeq.length === this.g8Seq.length) {
            this.g8Phase = 'SUCCESS';
            if (statusEl) statusEl.innerText = 'הזמנה מושלמת! 🌟';
            if (controlsEl) controlsEl.classList.add('translate-y-full');
            
            this.g8Level++;
            setTimeout(() => this.nextLevel(), 1500);
        }
    }

    update(dt) {
        if (this.g8Phase === 'SHOWING') {
            this.g8ShowTimer -= dt / 1000;
            if (this.g8ShowTimer <= 0) {
                if (this.g8ShowIndex < this.g8Seq.length) {
                    UI.createPopEffect(GameState.canvas.width / 2, GameState.canvas.height / 2, this.g8Seq[this.g8ShowIndex]);
                    this.g8ShowIndex++;
                    this.g8ShowTimer = 0.8;
                } else {
                    this.g8Phase = 'WAITING';
                    const statusEl = document.getElementById('g8-status');
                    const controlsEl = document.getElementById('g8-controls');
                    
                    if (statusEl) statusEl.innerText = 'הכנס את ההזמנה!';
                    if (controlsEl) {
                        controlsEl.classList.remove('translate-y-full');
                    }
                }
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.font = '100px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💁‍♂️', GameState.canvas.width / 2, GameState.canvas.height / 2 + 100);
        ctx.restore();
    }

    destroy() {
        // Slide down controls
        const controlsEl = document.getElementById('g8-controls');
        if (controlsEl) controlsEl.classList.add('translate-y-full');
    }
}
