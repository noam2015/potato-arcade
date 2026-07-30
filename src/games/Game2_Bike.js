import { MiniGame } from './MiniGame.js';
import { GameState } from '../core/GameState.js';
import { UI } from '../core/UI.js';

class Bike {
    constructor(game) {
        this.game = game;
        this.lane = 1;
        this.y = 0;
        this.x = 80;
        this.size = 60;
        this.emoji = '🚲';
    }

    update(dt) {
        this.y += (this.game.g2Lanes[this.lane] - this.y) * 15 * (dt / 1000);
    }

    draw(ctx) {
        ctx.save();
        ctx.font = `${this.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const bob = Math.sin(performance.now() / 100) * 3;
        ctx.fillText(this.emoji, this.x, this.y + bob);
        ctx.font = '30px Arial';
        ctx.fillText('😎', this.x - 10, this.y - 20 + bob);
        ctx.restore();
    }
}

class Entity {
    constructor(game, x, lane, emoji, type) {
        this.game = game;
        this.x = x;
        this.lane = lane;
        this.emoji = emoji;
        this.type = type;
        this.size = 40;
        this.marked = false;
    }

    update(dt) {
        this.x -= this.game.g2Speed * (dt / 1000);
        if (this.x < -100) {
            this.marked = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.font = `${this.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, this.x, this.game.g2Lanes[this.lane]);
        ctx.restore();
    }
}

export class Game2_Bike extends MiniGame {
    init(difficulty) {
        UI.screens.container.className = 'relative w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-3xl sm:shadow-2xl overflow-hidden bg-blue-300';
        
        this.g2Lanes = [
            GameState.canvas.height * 0.3,
            GameState.canvas.height * 0.5,
            GameState.canvas.height * 0.7
        ];
        
        this.bike = new Bike(this);
        this.bike.y = this.g2Lanes[1];
        
        this.obstacles = [];
        this.collectibles = [];
        this.g2Distance = 0;
        this.g2Tickets = 0;
        this.touchStartY = 0;

        this.g2Speed = (difficulty === 'easy') ? 250 : (difficulty === 'medium' ? 400 : 650);
        this.diffMultiplier = (difficulty === 'easy') ? 0.6 : (difficulty === 'medium' ? 1 : 1.8);

        const ticketsScoreEl = document.getElementById('score-tickets');
        const distScoreEl = document.getElementById('score-dist');
        if (ticketsScoreEl) ticketsScoreEl.innerText = '0';
        if (distScoreEl) distScoreEl.innerText = '0';
    }

    resize(w, h) {
        this.g2Lanes = [h * 0.3, h * 0.5, h * 0.7];
    }

    update(dt) {
        this.g2Distance += (this.g2Speed * dt) / 1000;
        this.g2Speed += dt * 0.01 * this.diffMultiplier;
        
        const distScoreEl = document.getElementById('score-dist');
        if (distScoreEl) distScoreEl.innerText = Math.floor(this.g2Distance / 10);

        if (Math.random() < (0.02 + (this.g2Speed / 10000)) * this.diffMultiplier) {
            let lane = Math.floor(Math.random() * 3);
            if (Math.random() < 0.3) {
                this.collectibles.push(new Entity(this, GameState.canvas.width + 50, lane, '🎟️', 'ticket'));
            } else {
                this.obstacles.push(new Entity(this, GameState.canvas.width + 50, lane, Math.random() < 0.5 ? '🚶' : '💧', 'obs'));
            }
        }

        this.bike.update(dt);

        const entities = [...this.obstacles, ...this.collectibles];
        entities.forEach(ent => {
            ent.update(dt);
            if (Math.abs(ent.x - this.bike.x) < 40 && Math.abs(this.g2Lanes[ent.lane] - this.bike.y) < 20) {
                if (ent.type === 'obs') {
                    UI.endGame("התרסקות באמסטרדם!", `אספת ${this.g2Tickets} כרטיסים.`);
                } else if (ent.type === 'ticket' && !ent.marked) {
                    this.g2Tickets++;
                    const ticketsScoreEl = document.getElementById('score-tickets');
                    if (ticketsScoreEl) ticketsScoreEl.innerText = this.g2Tickets;
                    UI.createPopEffect(ent.x, this.g2Lanes[ent.lane], '+1');
                    ent.marked = true;
                }
            }
        });

        this.obstacles = this.obstacles.filter(o => !o.marked);
        this.collectibles = this.collectibles.filter(c => !c.marked);
    }

    draw(ctx) {
        // Draw path
        ctx.save();
        ctx.fillStyle = '#60a5fa';
        ctx.fillRect(0, GameState.canvas.height * 0.8, GameState.canvas.width, GameState.canvas.height * 0.2);
        
        // Draw lane separators
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 4;
        ctx.setLineDash([20, 20]);
        ctx.beginPath();
        ctx.moveTo(0, this.g2Lanes[0] + 40);
        ctx.lineTo(GameState.canvas.width, this.g2Lanes[0] + 40);
        ctx.moveTo(0, this.g2Lanes[1] + 40);
        ctx.lineTo(GameState.canvas.width, this.g2Lanes[1] + 40);
        ctx.stroke();
        ctx.restore();

        // Draw entities
        this.obstacles.forEach(o => o.draw(ctx));
        this.collectibles.forEach(c => c.draw(ctx));

        // Draw bike
        this.bike.draw(ctx);
    }

    handleInput(type, details) {
        if (type === 'keydown') {
            if (details.key === 'ArrowUp' && this.bike.lane > 0) {
                this.bike.lane--;
            }
            if (details.key === 'ArrowDown' && this.bike.lane < 2) {
                this.bike.lane++;
            }
        }
        if (type === 'mousedown') {
            this.touchStartY = details.clientY;
        }
        if (type === 'mouseup') {
            let diff = details.clientY - this.touchStartY;
            if (diff < -30 && this.bike.lane > 0) {
                this.bike.lane--;
            } else if (diff > 30 && this.bike.lane < 2) {
                this.bike.lane++;
            }
        }
    }
}
