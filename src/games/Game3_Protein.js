import { MiniGame } from './MiniGame.js';
import { GameState } from '../core/GameState.js';
import { UI } from '../core/UI.js';

const G3_GOAL = 170;
const G3_FAT_LIMIT = 40;

const g3Types = [
    { type: 'good', emoji: '🍗', p: 15, f: 0, size: 40, prob: 0.35 },
    { type: 'good', emoji: '🐟', p: 25, f: 0, size: 40, prob: 0.15 },
    { type: 'bad', emoji: '🧈', p: 0, f: 10, size: 40, prob: 0.25 },
    { type: 'bad', emoji: '🍟', p: 0, f: 15, size: 40, prob: 0.25 }
];

class G3Item {
    constructor(game) {
        this.game = game;
        const r = Math.random();
        let cumulativeProb = 0;
        let selected = g3Types[0];

        for (let t of g3Types) {
            cumulativeProb += t.prob;
            if (r <= cumulativeProb) {
                selected = t;
                break;
            }
        }

        this.type = selected.type;
        this.emoji = selected.emoji;
        this.p = selected.p;
        this.f = selected.f;
        this.size = selected.size;
        this.x = Math.random() * (GameState.canvas.width - this.size) + this.size / 2;
        this.y = -this.size;
        this.speed = (Math.random() * 3 + 2) * game.g3FallMultiplier;
        this.marked = false;
    }

    update(dt) {
        this.y += this.speed * (dt / 16);
        if (this.y > GameState.canvas.height + this.size) {
            this.marked = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.font = `${this.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, this.x, this.y);
        ctx.restore();
    }
}

export class Game3_Protein extends MiniGame {
    init(difficulty) {
        UI.screens.container.className = 'relative w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-3xl sm:shadow-2xl overflow-hidden bg-blue-50';

        this.player = {
            x: GameState.canvas.width / 2,
            y: GameState.canvas.height - 80,
            size: 60,
            speed: 8,
            baseSpeed: 8,
            emoji: '🏃',
            protein: 0,
            fat: 0,
            dx: 0
        };

        this.g3Items = [];
        this.g3Frames = 0;
        this.isDragging = false;

        this.g3SpawnRate = (difficulty === 'easy') ? 90 : 40;
        this.g3FallMultiplier = (difficulty === 'easy') ? 0.7 : 1.4;

        this.updateUI();
    }

    resize(w, h) {
        this.player.y = h - this.player.size - 20;
    }

    updateUI() {
        const proteinText = document.getElementById('protein-text');
        const fatText = document.getElementById('fat-text');
        const proteinBar = document.getElementById('protein-bar');
        const fatBar = document.getElementById('fat-bar');

        if (proteinText) proteinText.innerText = Math.floor(this.player.protein);
        if (fatText) fatText.innerText = Math.floor(this.player.fat);
        
        if (proteinBar) {
            proteinBar.style.width = `${Math.min((this.player.protein / G3_GOAL) * 100, 100)}%`;
        }
        if (fatBar) {
            fatBar.style.width = `${Math.min((this.player.fat / G3_FAT_LIMIT) * 100, 100)}%`;
        }

        this.player.speed = this.player.baseSpeed * (1 - (this.player.fat / G3_FAT_LIMIT) * 0.6);
    }

    update(dt) {
        if (!this.isDragging) {
            this.player.x += this.player.dx * (dt / 16);
            if (this.player.x < this.player.size / 2) {
                this.player.x = this.player.size / 2;
            }
            if (this.player.x > GameState.canvas.width - this.player.size / 2) {
                this.player.x = GameState.canvas.width - this.player.size / 2;
            }
        }

        if (this.player.fat >= G3_FAT_LIMIT * 0.7) {
            this.player.emoji = '🥵';
        } else if (this.player.protein > G3_GOAL * 0.5) {
            this.player.emoji = '💪';
        } else {
            this.player.emoji = '🏃';
        }

        this.g3Frames++;
        if (this.g3Frames % Math.floor(this.g3SpawnRate) === 0) {
            this.g3Items.push(new G3Item(this));
        }

        if (this.g3Frames % 600 === 0) {
            this.g3SpawnRate = Math.max(20, this.g3SpawnRate - 5);
            this.g3FallMultiplier += 0.1;
        }

        this.g3Items.forEach(item => {
            item.update(dt);
            const playerDist = Math.hypot(this.player.x - item.x, this.player.y - item.y);
            const collisionDist = this.player.size / 2 + item.size / 2 - 10;
            
            if (playerDist < collisionDist && !item.marked) {
                item.marked = true;
                if (item.type === 'good') {
                    this.player.protein += item.p;
                    UI.createPopEffect(item.x, item.y, '✨');
                } else {
                    this.player.fat += item.f;
                    UI.createPopEffect(item.x, item.y, '❌');
                    UI.screens.container.classList.add('shake');
                    setTimeout(() => UI.screens.container.classList.remove('shake'), 200);
                }
                this.updateUI();
            }
        });

        this.g3Items = this.g3Items.filter(i => !i.marked);

        if (this.player.fat >= G3_FAT_LIMIT) {
            UI.endGame("כבדים מדי!", `השגת ${Math.floor(this.player.protein)}ג' חלבון.`);
        } else if (this.player.protein >= G3_GOAL) {
            UI.endGame("איזה שרירים! 🏆", `הגעת ליעד עם ${Math.floor(this.player.fat)}ג' שומן בלבד!`);
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.font = `${this.player.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.player.emoji, this.player.x, this.player.y);
        ctx.restore();

        this.g3Items.forEach(i => i.draw(ctx));
    }

    handleInput(type, details) {
        if (type === 'keydown') {
            if (details.key === 'ArrowLeft') this.player.dx = -this.player.speed;
            if (details.key === 'ArrowRight') this.player.dx = this.player.speed;
        }
        if (type === 'keyup') {
            if (details.key === 'ArrowLeft' && this.player.dx < 0) this.player.dx = 0;
            if (details.key === 'ArrowRight' && this.player.dx > 0) this.player.dx = 0;
        }
        if (type === 'mousedown') {
            this.isDragging = true;
            this.player.x = Math.max(this.player.size / 2, Math.min(GameState.canvas.width - this.player.size / 2, details.x));
        }
        if (type === 'mousemove' && this.isDragging) {
            this.player.x = Math.max(this.player.size / 2, Math.min(GameState.canvas.width - this.player.size / 2, details.x));
        }
        if (type === 'mouseup') {
            this.isDragging = false;
        }
    }
}
