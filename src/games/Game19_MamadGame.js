import { MiniGame } from './MiniGame.js';
import { GameState } from '../core/GameState.js';
import { UI } from '../core/UI.js';

export class Game19_MamadGame extends MiniGame {
    init(difficulty) {
        UI.screens.container.className = 'relative w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-3xl sm:shadow-2xl overflow-hidden bg-gray-800';

        this.g19Time = 30;
        this.g19Level = 1;
        this.g19Dist = (difficulty === 'easy') ? 100 : (difficulty === 'medium' ? 150 : 200);
        this.g19Obstacles = [];
        this.isDragging = false;

        this.g19Player = {
            x: GameState.canvas.width / 2,
            y: GameState.canvas.height - 80,
            size: 60,
            emoji: '🏃'
        };

        this.g19Speed = (difficulty === 'easy') ? 150 : (difficulty === 'medium' ? 250 : 400);
        this.g19SpawnRate = (difficulty === 'easy') ? 1.0 : 0.6;
        this.g19SpawnTimer = 0;

        this.updateUI();
    }

    resize(w, h) {
        this.g19Player.y = h - 80;
    }

    updateUI() {
        const scoreEl = document.getElementById('g19-score');
        const timeEl = document.getElementById('g19-time');
        if (scoreEl) scoreEl.innerText = Math.max(0, Math.floor(this.g19Dist));
        if (timeEl) timeEl.innerText = Math.max(0, Math.ceil(this.g19Time));
    }

    update(dt) {
        this.g19Time -= dt / 1000;
        this.g19Dist -= (this.g19Speed / 100) * (dt / 1000);
        this.updateUI();

        if (this.g19Time <= 0) {
            UI.endGame("נגמר הזמן!", `הגעת למרחק ${Math.floor(this.g19Dist)} מטרים מהממ"ד האחרון.`);
            return;
        }

        // Reached next shelter check
        if (this.g19Dist <= 0) {
            this.g19Time += 15;
            this.g19Level++;
            this.g19Dist = (GameState.currentDifficulty === 'easy' ? 100 : 150) + (this.g19Level * 50);
            
            UI.createPopEffect(GameState.canvas.width / 2, GameState.canvas.height / 2, '🛡️');
            UI.createPopEffect(GameState.canvas.width / 2, GameState.canvas.height / 2 - 40, '+15s', '#4ade80');
            this.g19Speed += 20;
            this.updateUI();
        }

        // Spawn obstacles/time items
        this.g19SpawnTimer -= dt / 1000;
        if (this.g19SpawnTimer <= 0) {
            let isTimeCard = Math.random() < 0.2;
            let em = isTimeCard ? '⏳' : ['🧸', '🪑', '🐈', '🛹'][Math.floor(Math.random() * 4)];
            
            this.g19Obstacles.push({
                x: Math.random() * (GameState.canvas.width - 80) + 40,
                y: -50,
                size: 50,
                emoji: em,
                isTimeCard: isTimeCard
            });
            this.g19SpawnTimer = this.g19SpawnRate;
            this.g19Speed += 5;
        }

        // Update obstacles
        for (let i = this.g19Obstacles.length - 1; i >= 0; i--) {
            let ob = this.g19Obstacles[i];
            ob.y += this.g19Speed * (dt / 1000);

            // Collision check
            if (Math.hypot(this.g19Player.x - ob.x, this.g19Player.y - ob.y) < 45) {
                if (ob.isTimeCard) {
                    this.g19Time += 5;
                    UI.createPopEffect(ob.x, ob.y, '+5s', '#4ade80');
                } else {
                    this.g19Time -= 3;
                    UI.createPopEffect(this.g19Player.x, this.g19Player.y, '💥');
                    UI.screens.container.classList.add('shake');
                    setTimeout(() => UI.screens.container.classList.remove('shake'), 200);
                }
                this.g19Obstacles.splice(i, 1);
                this.updateUI();
                continue;
            }

            if (ob.y > GameState.canvas.height + 50) {
                this.g19Obstacles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = '#374151';
        ctx.fillRect(0, 0, GameState.canvas.width, GameState.canvas.height);

        // Draw side borders
        ctx.fillStyle = '#4b5563';
        ctx.fillRect(0, 0, 20, GameState.canvas.height);
        ctx.fillRect(GameState.canvas.width - 20, 0, 20, GameState.canvas.height);

        // Draw obstacles
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        this.g19Obstacles.forEach(ob => {
            ctx.font = `${ob.size}px Arial`;
            ctx.fillText(ob.emoji, ob.x, ob.y);
        });

        // Draw player runner bobbing
        let bob = Math.sin(performance.now() / 50) * 5;
        ctx.font = `${this.g19Player.size}px Arial`;
        ctx.fillText(this.g19Player.emoji, this.g19Player.x, this.g19Player.y + bob);
        ctx.restore();
    }

    handleInput(type, details) {
        if (type === 'keydown') {
            if (details.key === 'ArrowLeft') this.g19Player.x = Math.max(this.g19Player.size / 2, this.g19Player.x - 60);
            if (details.key === 'ArrowRight') this.g19Player.x = Math.min(GameState.canvas.width - this.g19Player.size / 2, this.g19Player.x + 60);
        }
        if (type === 'mousedown') {
            this.isDragging = true;
            this.g19Player.x = Math.max(this.g19Player.size / 2, Math.min(GameState.canvas.width - this.g19Player.size / 2, details.x));
        }
        if (type === 'mousemove' && this.isDragging) {
            this.g19Player.x = Math.max(this.g19Player.size / 2, Math.min(GameState.canvas.width - this.g19Player.size / 2, details.x));
        }
        if (type === 'mouseup') {
            this.isDragging = false;
        }
    }
}
