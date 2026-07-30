import { MiniGame } from './MiniGame.js';
import { GameState } from '../core/GameState.js';
import { UI } from '../core/UI.js';

export class Game26_MangalGame extends MiniGame {
    init(difficulty) {
        UI.screens.container.className = 'relative w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-3xl sm:shadow-2xl overflow-hidden bg-red-950';

        this.g26Score = 0;
        this.g26Temp = 50;
        this.g26Time = 15;
        this.g26Lives = 3;
        
        this.g26DropRate = (difficulty === 'easy') ? 15 : (difficulty === 'medium' ? 25 : 35);
        this.g26MinSafe = 20;
        this.g26MaxSafe = 80;

        this.updateSafeZoneUI();
        this.updateUI();
    }

    updateSafeZoneUI() {
        let safeZone = document.getElementById('g26-safe-zone');
        if (safeZone) {
            safeZone.style.left = this.g26MinSafe + '%';
            safeZone.style.right = (100 - this.g26MaxSafe) + '%';
        }
    }

    updateUI() {
        const scoreEl = document.getElementById('g26-score');
        const timeEl = document.getElementById('g26-time');
        const livesEl = document.getElementById('g26-lives');

        if (scoreEl) scoreEl.innerText = this.g26Score;
        if (timeEl) timeEl.innerText = Math.max(0, Math.ceil(this.g26Time));
        if (livesEl) livesEl.innerText = '❤️'.repeat(Math.max(0, this.g26Lives));
    }

    nafnaf() {
        this.g26Temp = Math.min(100, this.g26Temp + 8);
        UI.createPopEffect(
            GameState.canvas.width / 2 + (Math.random() * 100 - 50),
            GameState.canvas.height / 2 - 50,
            '💨'
        );
    }

    update(dt) {
        this.g26Time -= dt / 1000;
        this.updateUI();

        // Round won (grilled successfully)
        if (this.g26Time <= 0) {
            this.g26Score++;
            this.updateUI();
            UI.createPopEffect(GameState.canvas.width / 2, GameState.canvas.height / 2, '🥩', '#4ade80');
            
            this.g26Time = 15;
            this.g26Temp = 50;
            
            this.g26DropRate += (GameState.currentDifficulty === 'hard') ? 10 : 5;
            this.g26MinSafe = Math.min(48, this.g26MinSafe + 3);
            this.g26MaxSafe = Math.max(52, this.g26MaxSafe - 3);
            
            this.updateSafeZoneUI();
            return;
        }

        // Drop temperature over time
        this.g26Temp -= this.g26DropRate * (dt / 1000);
        
        let bar = document.getElementById('g26-temp-bar');
        if (bar) {
            bar.style.left = `${Math.min(100, Math.max(0, this.g26Temp))}%`;
        }

        // Temperature went out of safe zone boundaries
        if (this.g26Temp <= this.g26MinSafe || this.g26Temp >= this.g26MaxSafe) {
            this.g26Lives--;
            this.updateUI();
            
            UI.createPopEffect(GameState.canvas.width / 2, GameState.canvas.height / 2, this.g26Temp <= this.g26MinSafe ? '🧊' : '🔥');
            UI.screens.container.classList.add('shake');
            setTimeout(() => UI.screens.container.classList.remove('shake'), 200);
            
            this.g26Temp = 50;

            if (this.g26Lives <= 0) {
                UI.endGame("הלך הבשר!", `הכנת ${this.g26Score} סטייקים.`);
            }
        }
    }

    draw(ctx) {
        // Red grill interior background
        ctx.save();
        ctx.fillStyle = '#450a0a';
        ctx.fillRect(0, 0, GameState.canvas.width, GameState.canvas.height);

        // Barbecue grill metal plate
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(GameState.canvas.width / 2 - 150, GameState.canvas.height / 2 - 50, 300, 150);

        // Steaks bobbing
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let i = 0; i < 5; i++) {
            let px = GameState.canvas.width / 2 - 100 + i * 50;
            let bob = Math.sin(performance.now() / (100 + i * 20)) * 5;
            ctx.font = '40px Arial';
            ctx.fillText('🥩', px, GameState.canvas.height / 2 + bob);
        }

        // Fire sparks particle effect
        if (this.g26Temp > 60) {
            for (let i = 0; i < 3; i++) {
                ctx.fillStyle = `rgba(255, 100, 0, ${Math.random() * 0.5})`;
                ctx.beginPath();
                ctx.arc(
                    GameState.canvas.width / 2 - 100 + Math.random() * 200, 
                    GameState.canvas.height / 2 - 20 + Math.random() * 20, 
                    Math.random() * 15, 
                    0, 
                    Math.PI * 2
                );
                ctx.fill();
            }
        }
        ctx.restore();
    }

    handleInput(type, details) {
        if (type === 'keydown') {
            if (details.key === ' ') {
                this.nafnaf();
            }
        }
        if (type === 'mousedown') {
            this.nafnaf();
        }
    }
}
