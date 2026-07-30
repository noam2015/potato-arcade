import { MiniGame } from './MiniGame.js';
import { GameState } from '../core/GameState.js';
import { UI } from '../core/UI.js';

export class Game11_SlapPursuit extends MiniGame {
    init(difficulty) {
        UI.screens.container.className = 'relative w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-3xl sm:shadow-2xl overflow-hidden bg-indigo-100';

        this.g11Score = 0;
        this.g11Time = 30;
        this.g11Lives = 3;
        this.g11Enemies = [];
        this.g11SpawnTimer = 0;

        this.g11Player = {
            x: GameState.canvas.width / 2,
            y: GameState.canvas.height / 2,
            size: 60,
            speed: (difficulty === 'hard') ? 500 : 400,
            emoji: '😎'
        };

        this.g11Target = { x: 0, y: 0, active: false };
        this.isDragging = false;

        this.g11SpawnRate = (difficulty === 'easy') ? 1.5 : (difficulty === 'medium' ? 1.0 : 0.5);

        this.updateUI();
    }

    updateUI() {
        const scoreEl = document.getElementById('g11-score');
        const timeEl = document.getElementById('g11-time');
        const livesEl = document.getElementById('g11-lives');

        if (scoreEl) scoreEl.innerText = this.g11Score;
        if (timeEl) timeEl.innerText = Math.max(0, Math.ceil(this.g11Time));
        if (livesEl) livesEl.innerText = '❤️'.repeat(this.g11Lives);
    }

    triggerSlap() {
        let hit = false;
        for (let i = this.g11Enemies.length - 1; i >= 0; i--) {
            const dist = Math.hypot(this.g11Player.x - this.g11Enemies[i].x, this.g11Player.y - this.g11Enemies[i].y);
            if (dist < 80) {
                this.g11Score++;
                this.updateUI();
                UI.createPopEffect(this.g11Enemies[i].x, this.g11Enemies[i].y, '💥');
                this.g11Enemies.splice(i, 1);
                hit = true;
            }
        }
        if (!hit) {
            UI.createPopEffect(this.g11Player.x, this.g11Player.y, '💨');
        }
    }

    update(dt) {
        this.g11Time -= dt / 1000;
        this.updateUI();

        if (this.g11Time <= 0) {
            UI.endGame("הזמן נגמר!", `חילקת ${this.g11Score} כפות מצלצלות!`);
            return;
        }

        // Move player to target
        if (this.g11Target.active) {
            let dx = this.g11Target.x - this.g11Player.x;
            let dy = this.g11Target.y - this.g11Player.y;
            let dist = Math.hypot(dx, dy);
            
            if (dist > 5) {
                this.g11Player.x += (dx / dist) * this.g11Player.speed * (dt / 1000);
                this.g11Player.y += (dy / dist) * this.g11Player.speed * (dt / 1000);
            } else {
                this.g11Target.active = false;
            }
        }

        // Clamp player
        this.g11Player.x = Math.max(this.g11Player.size / 2, Math.min(GameState.canvas.width - this.g11Player.size / 2, this.g11Player.x));
        this.g11Player.y = Math.max(this.g11Player.size / 2, Math.min(GameState.canvas.height - this.g11Player.size / 2, this.g11Player.y));

        // Spawning enemies
        this.g11SpawnTimer -= dt / 1000;
        if (this.g11SpawnTimer <= 0) {
            let side = Math.floor(Math.random() * 4);
            let ex, ey;

            if (side === 0) { ex = Math.random() * GameState.canvas.width; ey = -50; }
            else if (side === 1) { ex = GameState.canvas.width + 50; ey = Math.random() * GameState.canvas.height; }
            else if (side === 2) { ex = Math.random() * GameState.canvas.width; ey = GameState.canvas.height + 50; }
            else { ex = -50; ey = Math.random() * GameState.canvas.height; }

            this.g11Enemies.push({
                x: ex,
                y: ey,
                size: 50,
                speed: Math.random() * 100 + 100,
                emoji: ['🤡', '🤓', '👽', '👻'][Math.floor(Math.random() * 4)]
            });
            this.g11SpawnTimer = this.g11SpawnRate;
        }

        // Update enemies
        for (let i = this.g11Enemies.length - 1; i >= 0; i--) {
            let e = this.g11Enemies[i];
            let dx = this.g11Player.x - e.x;
            let dy = this.g11Player.y - e.y;
            let dist = Math.hypot(dx, dy);

            // Capture check
            if (dist < 35) {
                this.g11Lives--;
                this.updateUI();
                UI.createPopEffect(this.g11Player.x, this.g11Player.y, '😵');
                UI.screens.container.classList.add('shake');
                setTimeout(() => UI.screens.container.classList.remove('shake'), 200);
                this.g11Enemies.splice(i, 1);
                
                if (this.g11Lives <= 0) {
                    UI.endGame("חטפת כפות!", `חילקת ${this.g11Score} כפות.`);
                    return;
                }
                continue;
            }

            if (dist > 0) {
                e.x += (dx / dist) * e.speed * (dt / 1000);
                e.y += (dy / dist) * e.speed * (dt / 1000);
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = '#e0e7ff';
        ctx.fillRect(0, 0, GameState.canvas.width, GameState.canvas.height);

        // Draw enemies
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        this.g11Enemies.forEach(e => {
            ctx.font = `${e.size}px Arial`;
            ctx.fillText(e.emoji, e.x, e.y);
        });

        // Draw player
        ctx.font = `${this.g11Player.size}px Arial`;
        ctx.fillText(this.g11Player.emoji, this.g11Player.x, this.g11Player.y);
        ctx.restore();
    }

    handleInput(type, details) {
        if (type === 'keydown') {
            if (details.key === 'ArrowUp') { this.g11Target.y = this.g11Player.y - 150; this.g11Target.x = this.g11Player.x; this.g11Target.active = true; }
            if (details.key === 'ArrowDown') { this.g11Target.y = this.g11Player.y + 150; this.g11Target.x = this.g11Player.x; this.g11Target.active = true; }
            if (details.key === 'ArrowLeft') { this.g11Target.x = this.g11Player.x - 150; this.g11Target.y = this.g11Player.y; this.g11Target.active = true; }
            if (details.key === 'ArrowRight') { this.g11Target.x = this.g11Player.x + 150; this.g11Target.y = this.g11Player.y; this.g11Target.active = true; }
            if (details.key === ' ' || details.key === 'Enter') {
                this.triggerSlap();
            }
        }
        if (type === 'mousedown') {
            this.isDragging = true;
            this.g11Target.x = details.x;
            this.g11Target.y = details.y;
            this.g11Target.active = true;
            this.triggerSlap();
        }
        if (type === 'mousemove' && this.isDragging) {
            this.g11Target.x = details.x;
            this.g11Target.y = details.y;
            this.g11Target.active = true;
        }
        if (type === 'mouseup') {
            this.isDragging = false;
        }
    }
}
