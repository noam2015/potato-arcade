import { MiniGame } from './MiniGame.js';
import { GameState } from '../core/GameState.js';
import { UI } from '../core/UI.js';

export class Game16_CoffeeGame extends MiniGame {
    init(difficulty) {
        UI.screens.container.className = 'relative w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-3xl sm:shadow-2xl overflow-hidden bg-stone-200';

        this.g16Tilt = 0;
        this.g16Time = 0;
        this.g16Drift = 0;
        this.g16PlayerX = GameState.canvas.width / 2;
        this.isDragging = false;

        this.updateUI();
    }

    updateUI() {
        const scoreEl = document.getElementById('g16-score');
        if (scoreEl) scoreEl.innerText = Math.floor(this.g16Time);
    }

    update(dt) {
        this.g16Time += dt / 1000;
        this.updateUI();

        // Balance physics
        this.g16Drift += (Math.random() - 0.5) * (0.01 + this.g16Time * 0.0001);
        let playerOffset = (this.g16PlayerX - GameState.canvas.width / 2) / (GameState.canvas.width / 2);
        
        this.g16Tilt += this.g16Drift * (dt / 16) - (playerOffset * 0.05 * (dt / 16));

        // Update balance bar HTML UI
        let bar = document.getElementById('g16-balance-bar');
        if (bar) {
            let pct = (this.g16Tilt / (Math.PI / 3)) * 50 + 50;
            bar.style.left = `${Math.min(100, Math.max(0, pct))}%`;
        }

        // Spill check
        if (Math.abs(this.g16Tilt) > Math.PI / 3) {
            UI.createPopEffect(GameState.canvas.width / 2, GameState.canvas.height - 200, '💦');
            UI.screens.container.classList.add('shake');
            setTimeout(() => UI.screens.container.classList.remove('shake'), 300);
            
            UI.endGame("הקפה נשפך!", `החזקת מעמד ${Math.floor(this.g16Time)} שניות.`);
        }
    }

    draw(ctx) {
        // Draw background
        ctx.save();
        ctx.fillStyle = '#e7e5e4';
        ctx.fillRect(0, 0, GameState.canvas.width, GameState.canvas.height);

        // Floor
        ctx.fillStyle = '#a8a29e';
        ctx.fillRect(0, GameState.canvas.height - 100, GameState.canvas.width, 100);

        // Draw player + cup tilted
        ctx.translate(GameState.canvas.width / 2, GameState.canvas.height - 150);
        ctx.rotate(this.g16Tilt);
        
        ctx.font = '100px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('🧗', 0, 0);

        ctx.font = '50px Arial';
        for (let i = 1; i <= 5; i++) {
            let bobX = Math.sin(this.g16Time * 10 + i) * 5;
            ctx.fillText('☕', 0 + bobX, -i * 40);
        }
        ctx.restore();
    }

    handleInput(type, details) {
        if (type === 'mousedown') {
            this.isDragging = true;
            this.g16PlayerX = details.x;
        }
        if (type === 'mousemove' && this.isDragging) {
            this.g16PlayerX = details.x;
        }
        if (type === 'mouseup') {
            this.isDragging = false;
        }
    }
}
