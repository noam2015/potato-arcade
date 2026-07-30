import { MiniGame } from './MiniGame.js';
import { GameState } from '../core/GameState.js';
import { UI } from '../core/UI.js';

export class Game23_SupermarketGame extends MiniGame {
    init(difficulty) {
        UI.screens.container.className = 'relative w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-3xl sm:shadow-2xl overflow-hidden bg-gray-200';

        this.g23Score = 0;
        this.g23Lives = 3;
        this.g23Entities = [];
        this.isDragging = false;

        this.g23Player = {
            x: GameState.canvas.width / 2,
            y: GameState.canvas.height - 80,
            size: 60,
            emoji: '🛒'
        };

        this.g23Speed = (difficulty === 'easy') ? 300 : (difficulty === 'medium' ? 500 : 750);
        this.g23SpawnRate = (difficulty === 'easy') ? 0.8 : (difficulty === 'medium' ? 0.5 : 0.25);
        this.g23SpawnTimer = 0;

        this.updateUI();
    }

    resize(w, h) {
        this.g23Player.y = h - 80;
    }

    updateUI() {
        const scoreEl = document.getElementById('g23-score');
        const livesEl = document.getElementById('g23-lives');
        if (scoreEl) scoreEl.innerText = Math.floor(this.g23Score);
        if (livesEl) livesEl.innerText = '❤️'.repeat(Math.max(0, this.g23Lives));
    }

    update(dt) {
        this.g23Score += dt / 100;
        this.updateUI();

        // Spawn items
        this.g23SpawnTimer -= dt / 1000;
        if (this.g23SpawnTimer <= 0) {
            let isBonus = Math.random() < 0.2;
            let em = isBonus ? '🏷️' : ['👵', '🥛', '🥫', '🍌'][Math.floor(Math.random() * 4)];
            
            this.g23Entities.push({
                x: Math.random() * (GameState.canvas.width - 80) + 40,
                y: -50,
                size: 50,
                emoji: em,
                type: isBonus ? 'bonus' : 'obs'
            });
            this.g23SpawnTimer = this.g23SpawnRate;
            this.g23Speed += 8;
        }

        // Update items
        for (let i = this.g23Entities.length - 1; i >= 0; i--) {
            let ent = this.g23Entities[i];
            ent.y += this.g23Speed * (dt / 1000);

            // Collision check
            if (Math.hypot(this.g23Player.x - ent.x, this.g23Player.y - ent.y) < 45) {
                if (ent.type === 'obs') {
                    this.g23Lives--;
                    this.updateUI();
                    UI.createPopEffect(this.g23Player.x, this.g23Player.y, '💥');
                    UI.screens.container.classList.add('shake');
                    setTimeout(() => UI.screens.container.classList.remove('shake'), 200);
                    
                    if (this.g23Lives <= 0) {
                        UI.endGame("תאונת קניות!", `הגעת לניקוד של ${Math.floor(this.g23Score)}.`);
                        return;
                    }
                } else {
                    this.g23Score += 10;
                    this.updateUI();
                    UI.createPopEffect(ent.x, ent.y, '✨', '#facc15');
                }
                this.g23Entities.splice(i, 1);
                continue;
            }

            if (ent.y > GameState.canvas.height + 50) {
                this.g23Entities.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(0, 0, GameState.canvas.width, GameState.canvas.height);

        // Draw rolling background stripes effect
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 4;
        const lineOffset = (performance.now() / 10) % 40;
        for (let i = 0; i < GameState.canvas.height; i += 40) {
            ctx.beginPath();
            ctx.moveTo(0, i + lineOffset);
            ctx.lineTo(GameState.canvas.width, i + lineOffset);
            ctx.stroke();
        }

        // Draw items
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        this.g23Entities.forEach(ent => {
            ctx.font = `${ent.size}px Arial`;
            ctx.fillText(ent.emoji, ent.x, ent.y);
        });

        // Draw cart
        let bob = Math.sin(performance.now() / 50) * 5;
        ctx.font = `${this.g23Player.size}px Arial`;
        ctx.fillText(this.g23Player.emoji, this.g23Player.x, this.g23Player.y + bob);
        ctx.restore();
    }

    handleInput(type, details) {
        if (type === 'keydown') {
            if (details.key === 'ArrowLeft') this.g23Player.x = Math.max(this.g23Player.size / 2, this.g23Player.x - 60);
            if (details.key === 'ArrowRight') this.g23Player.x = Math.min(GameState.canvas.width - this.g23Player.size / 2, this.g23Player.x + 60);
        }
        if (type === 'mousedown') {
            this.isDragging = true;
            this.g23Player.x = Math.max(this.g23Player.size / 2, Math.min(GameState.canvas.width - this.g23Player.size / 2, details.x));
        }
        if (type === 'mousemove' && this.isDragging) {
            this.g23Player.x = Math.max(this.g23Player.size / 2, Math.min(GameState.canvas.width - this.g23Player.size / 2, details.x));
        }
        if (type === 'mouseup') {
            this.isDragging = false;
        }
    }
}
