import { MiniGame } from './MiniGame.js';
import { GameState } from '../core/GameState.js';
import { UI } from '../core/UI.js';

const CANDY_EMOJIS_POOL = [
    '🍬', '🍭', '🍫', '🧁', '🍩', '🍪', '🍮', '🍯', '🍧', '🍨', '🍦', '🍰', 
    '🎂', '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍒', '🍑'
];

export class Game10_CandyMemory extends MiniGame {
    init(difficulty) {
        UI.screens.container.className = 'relative w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-3xl sm:shadow-2xl overflow-hidden bg-pink-100';

        this.g10Matches = 0;
        this.g10Mistakes = 0;
        this.g10FirstCard = null;
        this.g10SecondCard = null;
        this.g10Lock = false;

        this.g10TotalPairs = (difficulty === 'easy') ? 6 : (difficulty === 'medium' ? 12 : 24);

        const scoreEl = document.getElementById('g10-score');
        const totalEl = document.getElementById('g10-total');
        const mistakesEl = document.getElementById('g10-mistakes');

        if (scoreEl) scoreEl.innerText = '0';
        if (totalEl) totalEl.innerText = this.g10TotalPairs;
        if (mistakesEl) mistakesEl.innerText = '0';

        let deck = [
            ...CANDY_EMOJIS_POOL.slice(0, this.g10TotalPairs),
            ...CANDY_EMOJIS_POOL.slice(0, this.g10TotalPairs)
        ].sort(() => 0.5 - Math.random());

        this.g10Cards = deck.map((emoji, index) => ({
            id: index,
            emoji: emoji,
            isFlipped: false,
            isMatched: false,
            x: 0,
            y: 0,
            w: 0,
            h: 0
        }));
    }

    handleCardClick(x, y) {
        if (this.g10Lock) return;

        let clicked = this.g10Cards.find(c => 
            x >= c.x && x <= c.x + c.w && 
            y >= c.y && y <= c.y + c.h && 
            !c.isFlipped && !c.isMatched
        );

        if (!clicked) return;

        clicked.isFlipped = true;

        if (!this.g10FirstCard) {
            this.g10FirstCard = clicked;
        } else {
            this.g10SecondCard = clicked;
            this.g10Lock = true;

            const scoreEl = document.getElementById('g10-score');
            const mistakesEl = document.getElementById('g10-mistakes');

            if (this.g10FirstCard.emoji === this.g10SecondCard.emoji) {
                this.g10Matches++;
                if (scoreEl) scoreEl.innerText = this.g10Matches;
                
                UI.createPopEffect(this.g10FirstCard.x + this.g10FirstCard.w / 2, this.g10FirstCard.y + this.g10FirstCard.h / 2, '✨');
                UI.createPopEffect(this.g10SecondCard.x + this.g10SecondCard.w / 2, this.g10SecondCard.y + this.g10SecondCard.h / 2, '✨');

                setTimeout(() => {
                    this.g10FirstCard.isMatched = true;
                    this.g10SecondCard.isMatched = true;
                    this.g10FirstCard = null;
                    this.g10SecondCard = null;
                    this.g10Lock = false;

                    if (this.g10Matches === this.g10TotalPairs) {
                        UI.endGame("כל הכבוד!", `סיימת עם ${this.g10Mistakes} טעויות.`);
                    }
                }, 500);
            } else {
                this.g10Mistakes++;
                if (mistakesEl) mistakesEl.innerText = this.g10Mistakes;
                
                setTimeout(() => {
                    this.g10FirstCard.isFlipped = false;
                    this.g10SecondCard.isFlipped = false;
                    this.g10FirstCard = null;
                    this.g10SecondCard = null;
                    this.g10Lock = false;
                }, 800);
            }
        }
    }

    update(dt) {
        // Simple canvas rendering logic in draw method
    }

    draw(ctx) {
        // Draw background
        ctx.save();
        ctx.fillStyle = '#fce7f3';
        ctx.fillRect(0, 0, GameState.canvas.width, GameState.canvas.height);

        let cols = this.g10TotalPairs === 6 ? 3 : (this.g10TotalPairs === 12 ? 4 : 8);
        let rows = Math.ceil((this.g10TotalPairs * 2) / cols);

        let cardW = Math.min(85, Math.floor((GameState.canvas.width - 40) / cols) - 10);
        let cardH = Math.min(105, Math.floor((GameState.canvas.height - 100) / rows) - 10);

        let startX = (GameState.canvas.width - (cols * cardW + (cols - 1) * 10)) / 2;
        let startY = (GameState.canvas.height - (rows * cardH + (rows - 1) * 10)) / 2 + 25;

        this.g10Cards.forEach((card, index) => {
            let r = Math.floor(index / cols);
            let c = index % cols;

            card.x = startX + c * (cardW + 10);
            card.y = startY + r * (cardH + 10);
            card.w = cardW;
            card.h = cardH;

            ctx.fillStyle = card.isMatched ? '#a7f3d0' : (card.isFlipped ? '#ffffff' : '#f43f5e');
            ctx.beginPath();
            ctx.roundRect(card.x, card.y, card.w, card.h, 12);
            ctx.fill();

            ctx.lineWidth = 2;
            ctx.strokeStyle = card.isMatched ? '#059669' : '#e11d48';
            ctx.stroke();

            ctx.font = `${Math.floor(cardW * 0.45)}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'black';
            ctx.fillText(
                card.isFlipped || card.isMatched ? card.emoji : '❓', 
                card.x + card.w / 2, 
                card.y + card.h / 2
            );
        });
        ctx.restore();
    }

    handleInput(type, details) {
        if (type === 'mousedown') {
            this.handleCardClick(details.x, details.y);
        }
    }
}
