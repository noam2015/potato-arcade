import { MiniGame } from './MiniGame.js';
import { GameState } from '../core/GameState.js';
import { UI } from '../core/UI.js';

const G12_FRUIT_TYPES = ['🍎', '🍌', '🍉', '🍓', '🍍', '🥝', '🍑'];

export class Game12_FruitNinja extends MiniGame {
    init(difficulty) {
        UI.screens.container.className = 'relative w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-3xl sm:shadow-2xl overflow-hidden bg-orange-50';

        this.g12Score = 0;
        this.g12Lives = 3;
        this.g12Fruits = [];
        this.g12Trail = [];
        this.g12IsSwiping = false;

        this.difficulty = difficulty;
        this.g12SpawnRate = (difficulty === 'easy') ? 1.5 : (difficulty === 'medium' ? 1.0 : 0.6);
        this.g12Gravity = (difficulty === 'easy') ? 600 : (difficulty === 'medium' ? 800 : 1000);
        this.g12SpawnTimer = 0;

        this.updateUI();
    }

    updateUI() {
        const scoreEl = document.getElementById('g12-score');
        const livesEl = document.getElementById('g12-lives');
        if (scoreEl) scoreEl.innerText = this.g12Score;
        if (livesEl) livesEl.innerText = '❤️'.repeat(Math.max(0, this.g12Lives));
    }

    spawnFruit() {
        let numToSpawn = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < numToSpawn; i++) {
            let isBomb = (this.difficulty !== 'easy') && (Math.random() < 0.2);
            let emoji = isBomb ? '💣' : G12_FRUIT_TYPES[Math.floor(Math.random() * G12_FRUIT_TYPES.length)];
            
            this.g12Fruits.push({
                x: Math.random() * (GameState.canvas.width - 100) + 50,
                y: GameState.canvas.height + 50,
                vx: (Math.random() - 0.5) * 300,
                vy: -(Math.random() * 300 + (this.g12Gravity * 0.8)),
                size: 90,
                emoji: emoji,
                isBomb: isBomb,
                rotation: 0,
                rotSpeed: (Math.random() - 0.5) * 5
            });
        }
    }

    checkSlice(x, y) {
        for (let i = this.g12Fruits.length - 1; i >= 0; i--) {
            let f = this.g12Fruits[i];
            if (Math.hypot(f.x - x, f.y - y) < f.size / 1.1) {
                if (f.isBomb) {
                    this.g12Lives--;
                    this.updateUI();
                    UI.createPopEffect(f.x, f.y, '💥', 'red');
                    UI.screens.container.classList.add('shake');
                    setTimeout(() => UI.screens.container.classList.remove('shake'), 300);
                    this.g12Fruits.splice(i, 1);
                    
                    if (this.g12Lives <= 0) {
                        this.g12IsSwiping = false;
                        UI.endGame("פגעת בפצצה!", `חתכת ${this.g12Score} פירות לפני הפיצוץ.`);
                        return;
                    }
                } else {
                    this.g12Score++;
                    this.updateUI();
                    UI.createPopEffect(f.x, f.y, '💦', '#f87171');
                    UI.createPopEffect(f.x - 40, f.y, f.emoji);
                    UI.createPopEffect(f.x + 40, f.y, f.emoji);
                    this.g12Fruits.splice(i, 1);
                }
            }
        }
    }

    update(dt) {
        this.g12SpawnTimer -= dt / 1000;
        if (this.g12SpawnTimer <= 0) {
            this.spawnFruit();
            this.g12SpawnTimer = this.g12SpawnRate;
        }

        for (let i = this.g12Fruits.length - 1; i >= 0; i--) {
            let f = this.g12Fruits[i];
            f.vy += this.g12Gravity * (dt / 1000);
            f.x += f.vx * (dt / 1000);
            f.y += f.vy * (dt / 1000);
            f.rotation += f.rotSpeed * (dt / 1000);

            // Falling below screen check
            if (f.y > GameState.canvas.height + 150 && f.vy > 0) {
                if (!f.isBomb) {
                    this.g12Lives--;
                    this.updateUI();
                    UI.createPopEffect(f.x, GameState.canvas.height - 50, '❌');
                    if (this.g12Lives <= 0) {
                        UI.endGame("הפירות נפלו!", `הצלחת לחתוך ${this.g12Score} פירות.`);
                        return;
                    }
                }
                this.g12Fruits.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = '#fff7ed';
        ctx.fillRect(0, 0, GameState.canvas.width, GameState.canvas.height);

        // Draw fruits
        this.g12Fruits.forEach(f => {
            ctx.save();
            ctx.translate(f.x, f.y);
            ctx.rotate(f.rotation);
            ctx.font = `${f.size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(f.emoji, 0, 0);
            ctx.restore();
        });

        // Draw swipe trail
        if (this.g12IsSwiping && this.g12Trail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(this.g12Trail[0].x, this.g12Trail[0].y);
            for (let i = 1; i < this.g12Trail.length; i++) {
                ctx.lineTo(this.g12Trail[i].x, this.g12Trail[i].y);
            }
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
            ctx.lineWidth = 10;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
        }
        ctx.restore();
    }

    handleInput(type, details) {
        if (type === 'mousedown') {
            this.g12IsSwiping = true;
            this.g12Trail = [];
            this.g12Trail.push({ x: details.x, y: details.y });
            this.checkSlice(details.x, details.y);
        }
        if (type === 'mousemove' && this.g12IsSwiping) {
            this.g12Trail.push({ x: details.x, y: details.y });
            if (this.g12Trail.length > 15) {
                this.g12Trail.shift();
            }
            this.checkSlice(details.x, details.y);
        }
        if (type === 'mouseup') {
            this.g12IsSwiping = false;
            this.g12Trail = [];
        }
    }
}
