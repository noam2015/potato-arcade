import { MiniGame } from './MiniGame.js';
import { GameState } from '../core/GameState.js';
import { UI } from '../core/UI.js';

export class Game27_TrafficGame extends MiniGame {
    init(difficulty) {
        UI.screens.container.className = 'relative w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-3xl sm:shadow-2xl overflow-hidden bg-gray-500';

        this.g27Score = 0;
        this.g27Lives = 3;
        this.g27Cars = [];
        this.g27PlayerLane = 1;
        this.g27SpawnTimer = 0;
        this.touchStartX = 0;

        this.g27Speed = (difficulty === 'easy') ? 250 : (difficulty === 'medium' ? 400 : 600);

        this.updateUI();
    }

    updateUI() {
        const scoreEl = document.getElementById('g27-score');
        const livesEl = document.getElementById('g27-lives');
        if (scoreEl) scoreEl.innerText = Math.floor(this.g27Score);
        if (livesEl) livesEl.innerText = '❤️'.repeat(Math.max(0, this.g27Lives));
    }

    update(dt) {
        this.g27Score += (this.g27Speed / 100) * (dt / 1000);
        this.g27Speed += 5 * (dt / 1000);
        this.updateUI();

        // Spawn cars
        this.g27SpawnTimer -= dt / 1000;
        if (this.g27SpawnTimer <= 0) {
            let openLane = Math.floor(Math.random() * 3);
            for (let l = 0; l < 3; l++) {
                if (l !== openLane) {
                    this.g27Cars.push({ lane: l, y: -60 });
                }
            }
            this.g27SpawnTimer = Math.max(0.7, 2.0 - (this.g27Speed / 800));
        }

        // Update cars position and collision
        let laneW = GameState.canvas.width / 3;
        for (let i = this.g27Cars.length - 1; i >= 0; i--) {
            let c = this.g27Cars[i];
            c.y += this.g27Speed * (dt / 1000);
            
            let cx = (c.lane * laneW) + laneW / 2;

            // Collision check
            const collided = c.lane === this.g27PlayerLane && Math.abs(c.y - (GameState.canvas.height - 100)) < 50;
            if (collided) {
                this.g27Lives--;
                this.updateUI();
                UI.createPopEffect(cx, c.y, '💥');
                UI.screens.container.classList.add('shake');
                setTimeout(() => UI.screens.container.classList.remove('shake'), 200);
                this.g27Cars.splice(i, 1);

                if (this.g27Lives <= 0) {
                    UI.endGame("תאונת שרשרת!", `נסעת ${Math.floor(this.g27Score)} מטרים בפקק.`);
                    return;
                }
                continue;
            }

            // Remove off-screen cars
            if (c.y > GameState.canvas.height + 60) {
                this.g27Cars.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        // Draw asphalt road background
        ctx.save();
        ctx.fillStyle = '#4b5563';
        ctx.fillRect(0, 0, GameState.canvas.width, GameState.canvas.height);

        let laneW = GameState.canvas.width / 3;

        // Draw lane lines
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 4;
        ctx.setLineDash([20, 20]);
        ctx.lineDashOffset = -(performance.now() / 1000 * this.g27Speed) % 40;
        
        ctx.beginPath();
        ctx.moveTo(laneW, 0); ctx.lineTo(laneW, GameState.canvas.height);
        ctx.moveTo(laneW * 2, 0); ctx.lineTo(laneW * 2, GameState.canvas.height);
        ctx.stroke();
        ctx.restore();

        // Draw car obstacles
        ctx.save();
        ctx.font = '50px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        this.g27Cars.forEach(c => {
            let cx = (c.lane * laneW) + laneW / 2;
            ctx.fillText('🛻', cx, c.y);
        });

        // Draw player car
        let playerX = (this.g27PlayerLane * laneW) + laneW / 2;
        ctx.fillText('🚗', playerX, GameState.canvas.height - 100);
        ctx.restore();
    }

    handleInput(type, details) {
        if (type === 'keydown') {
            if (details.key === 'ArrowLeft' && this.g27PlayerLane > 0) this.g27PlayerLane--;
            if (details.key === 'ArrowRight' && this.g27PlayerLane < 2) this.g27PlayerLane++;
        }
        if (type === 'mousedown') {
            this.touchStartX = details.clientX;
        }
        if (type === 'mouseup') {
            let diffX = details.clientX - this.touchStartX;
            if (diffX < -30 && this.g27PlayerLane > 0) {
                this.g27PlayerLane--;
            } else if (diffX > 30 && this.g27PlayerLane < 2) {
                this.g27PlayerLane++;
            } else if (Math.abs(diffX) < 10) {
                // Click direct lane selection
                let laneW = GameState.canvas.width / 3;
                if (details.x < laneW) this.g27PlayerLane = 0;
                else if (details.x < laneW * 2) this.g27PlayerLane = 1;
                else this.g27PlayerLane = 2;
            }
        }
    }
}
