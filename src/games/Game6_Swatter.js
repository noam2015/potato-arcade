import { MiniGame } from './MiniGame.js';
import { GameState } from '../core/GameState.js';
import { UI } from '../core/UI.js';

export class Game6_Swatter extends MiniGame {
    init(difficulty) {
        UI.screens.container.className = 'relative w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-3xl sm:shadow-2xl overflow-hidden bg-yellow-100';

        this.g6Bugs = [];
        this.g6Score = 0;
        this.g6Lives = 3;
        this.g6BugTimer = 0;

        this.g6SpawnRate = (difficulty === 'easy') ? 1.2 : 0.4;
        this.g6BugSpeed = (difficulty === 'easy') ? 80 : 200;

        this.updateUI();
    }

    updateUI() {
        const scoreEl = document.getElementById('g6-score');
        const livesEl = document.getElementById('g6-lives');
        if (scoreEl) scoreEl.innerText = this.g6Score;
        if (livesEl) livesEl.innerText = '❤️'.repeat(this.g6Lives);
    }

    update(dt) {
        this.g6BugTimer -= dt / 1000;
        if (this.g6BugTimer <= 0) {
            this.g6Bugs.push({
                x: Math.random() * (GameState.canvas.width - 60) + 30,
                y: -40,
                size: 50,
                emoji: Math.random() > 0.5 ? '🕷️' : '🦟'
            });
            this.g6BugTimer = this.g6SpawnRate;
        }

        for (let i = this.g6Bugs.length - 1; i >= 0; i--) {
            let b = this.g6Bugs[i];
            b.y += this.g6BugSpeed * (dt / 1000);
            b.x += Math.sin(b.y / 50) * 2;

            if (b.y > GameState.canvas.height + b.size) {
                this.g6Lives--;
                this.updateUI();
                UI.createPopEffect(b.x, GameState.canvas.height - 20, '🩸');
                this.g6Bugs.splice(i, 1);
                
                if (this.g6Lives <= 0) {
                    UI.endGame("נעקצת!", `חיסלת ${this.g6Score} חרקים.`);
                    return;
                }
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        this.g6Bugs.forEach(b => {
            ctx.font = `${b.size}px Arial`;
            ctx.fillText(b.emoji, b.x, b.y);
        });
        
        ctx.restore();
    }

    handleInput(type, details) {
        if (type === 'mousedown') {
            const { x, y } = details;
            let hit = false;
            
            for (let i = this.g6Bugs.length - 1; i >= 0; i--) {
                let b = this.g6Bugs[i];
                if (Math.hypot(b.x - x, b.y - y) < b.size) {
                    UI.createPopEffect(b.x, b.y, '💥');
                    this.g6Bugs.splice(i, 1);
                    this.g6Score++;
                    this.updateUI();
                    hit = true;
                    break;
                }
            }
            
            if (!hit) {
                UI.createPopEffect(x, y, '👟');
            }
        }
    }
}
