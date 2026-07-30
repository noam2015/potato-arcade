import { MiniGame } from './MiniGame.js';
import { GameState } from '../core/GameState.js';
import { UI } from '../core/UI.js';

class Appliance {
    constructor(game, x, y, type, emoji, fixTool) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.size = 80;
        this.emoji = emoji;
        this.fixTool = fixTool;
        this.isBroken = false;
        this.breakTimer = Math.random() * game.g1BreakVar + game.g1BreakMin;
        this.smoke = [];
    }

    update(dt) {
        if (!this.isBroken) {
            this.breakTimer -= dt;
            if (this.breakTimer <= 0) {
                this.isBroken = true;
            }
        } else {
            this.game.stressLevel += this.game.g1StressRate * (dt / 1000);
            if (Math.random() < 0.2) {
                this.smoke.push({
                    x: this.x + (Math.random() - 0.5) * 40,
                    y: this.y - 20,
                    life: 1,
                    vx: (Math.random() - 0.5) * 20,
                    vy: -50 - Math.random() * 30
                });
            }
        }

        for (let i = this.smoke.length - 1; i >= 0; i--) {
            let p = this.smoke[i];
            p.x += p.vx * (dt / 1000);
            p.y += p.vy * (dt / 1000);
            p.life -= dt / 1000;
            if (p.life <= 0) {
                this.smoke.splice(i, 1);
            }
        }
    }

    fix(t) {
        if (this.isBroken && t === this.fixTool) {
            this.isBroken = false;
            this.breakTimer = Math.random() * (this.game.g1BreakVar + 1000) + this.game.g1BreakMin;
            this.game.stressLevel = Math.max(0, this.game.stressLevel - 10);
            this.smoke = [];
            UI.createPopEffect(this.x, this.y, '✨');
        } else if (this.isBroken) {
            this.game.stressLevel += 5;
            UI.createPopEffect(this.x, this.y, '❌');
        }
    }

    draw(ctx) {
        let dx = this.x;
        let dy = this.y;
        if (this.isBroken) {
            dx += (Math.random() - 0.5) * 6;
            dy += (Math.random() - 0.5) * 6;
            ctx.save();
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(this.x + 30, this.y - 40, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            let t = this.fixTool === 'wrench' ? '🔧' : (this.fixTool === 'tape' ? '🩹' : '🔨');
            ctx.fillStyle = 'black';
            ctx.fillText(t, this.x + 30, this.y - 40);
            ctx.restore();
        }
        ctx.save();
        ctx.font = `${this.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, dx, dy);
        ctx.restore();

        this.smoke.forEach(p => {
            ctx.save();
            ctx.fillStyle = `rgba(100,100,100,${p.life})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 10 * p.life, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }
}

export class Game1_Repair extends MiniGame {
    init(difficulty) {
        // Reset styles and UI
        UI.screens.container.className = 'relative w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-3xl sm:shadow-2xl overflow-hidden bg-gray-100';
        
        this.MAX_STRESS = 100;
        this.stressLevel = 0;
        this.currentTool = null;
        this.selectTool(null);
        this.appliances = [];

        this.g1StressRate = (difficulty === 'easy') ? 1 : (difficulty === 'medium' ? 2 : 4);
        this.g1BreakMin = (difficulty === 'easy') ? 5000 : 1500;
        this.g1BreakVar = (difficulty === 'easy') ? 6000 : 3000;

        const midY = GameState.canvas.height / 2 + 50;
        const thirdW = GameState.canvas.width / 3;

        this.appliances.push(new Appliance(this, thirdW * 0.5, midY, 'washing', '🧺', 'tape'));
        this.appliances.push(new Appliance(this, thirdW * 1.5, midY - 60, 'treadmill', '🏃', 'wrench'));
        this.appliances.push(new Appliance(this, thirdW * 2.5, midY, 'jacuzzi', '🛁', 'hammer'));
    }

    selectTool(tool) {
        this.currentTool = tool;
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('selected');
            if (btn.dataset.tool === tool) {
                btn.classList.add('selected');
            }
        });
    }

    update(dt) {
        let sb = document.getElementById('stress-bar');
        if (sb) {
            sb.style.width = `${Math.min(100, this.stressLevel)}%`;
            if (this.stressLevel > 70) {
                sb.classList.add('shake');
                UI.screens.container.classList.add('bg-red-50');
            } else {
                sb.classList.remove('shake');
                UI.screens.container.classList.remove('bg-red-50');
            }
        }

        if (this.stressLevel >= this.MAX_STRESS) {
            UI.endGame("הבית נהרס!", "מד העצבים התפוצץ.");
            return;
        }

        this.appliances.forEach(app => app.update(dt));
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.ellipse(GameState.canvas.width / 2, GameState.canvas.height / 2 + 80, GameState.canvas.width * 0.4, 60, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        this.appliances.forEach(app => app.draw(ctx));
    }

    handleInput(type, details) {
        if (type === 'mousedown') {
            const { x, y } = details;
            if (this.currentTool) {
                this.appliances.forEach(app => {
                    if (Math.hypot(app.x - x, app.y - y) < app.size / 1.5) {
                        app.fix(this.currentTool);
                    }
                });
            }
        }
    }
}
