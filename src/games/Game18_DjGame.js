import { MiniGame } from './MiniGame.js';
import { GameState } from '../core/GameState.js';
import { UI } from '../core/UI.js';

const G18_ICONS = ['🎵', '🎸', '🥁'];

export class Game18_DjGame extends MiniGame {
    init(difficulty) {
        UI.screens.container.className = 'relative w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-3xl sm:shadow-2xl overflow-hidden bg-fuchsia-950';

        this.g18Score = 0;
        this.g18Lives = 3;
        this.g18Notes = [];
        this.g18SpawnTimer = 0;

        this.g18Speed = (difficulty === 'easy') ? 300 : (difficulty === 'medium' ? 450 : 650);

        this.updateUI();
    }

    updateUI() {
        const scoreEl = document.getElementById('g18-score');
        const livesEl = document.getElementById('g18-lives');
        if (scoreEl) scoreEl.innerText = this.g18Score;
        if (livesEl) livesEl.innerText = '❤️'.repeat(this.g18Lives);
    }

    hitNote(lane) {
        let hit = false;
        for (let i = 0; i < this.g18Notes.length; i++) {
            let n = this.g18Notes[i];
            const targetRange = n.lane === lane && n.y > GameState.canvas.height - 160 && n.y < GameState.canvas.height - 40;
            
            if (targetRange) {
                this.g18Score++;
                this.updateUI();
                UI.createPopEffect((lane * GameState.canvas.width / 3) + GameState.canvas.width / 6, n.y, n.emoji);
                this.g18Notes.splice(i, 1);
                hit = true;
                break;
            }
        }

        if (!hit) {
            this.g18Lives--;
            this.updateUI();
            UI.screens.container.classList.add('shake');
            setTimeout(() => UI.screens.container.classList.remove('shake'), 100);
            
            if (this.g18Lives <= 0) {
                UI.endGame("זייפת!", `הגעת לקומבו של ${this.g18Score} תווים.`);
            }
        }
    }

    update(dt) {
        this.g18SpawnTimer -= dt / 1000;
        if (this.g18SpawnTimer <= 0) {
            this.g18Notes.push({
                lane: Math.floor(Math.random() * 3),
                y: -50,
                emoji: G18_ICONS[Math.floor(Math.random() * G18_ICONS.length)]
            });
            this.g18SpawnTimer = 0.5 + Math.random() * 0.5;
            this.g18Speed += 2;
        }

        for (let i = this.g18Notes.length - 1; i >= 0; i--) {
            let n = this.g18Notes[i];
            n.y += this.g18Speed * (dt / 1000);

            // Missed note check
            if (n.y > GameState.canvas.height) {
                this.g18Lives--;
                this.updateUI();
                UI.screens.container.classList.add('shake');
                setTimeout(() => UI.screens.container.classList.remove('shake'), 100);
                
                const noteX = (n.lane * GameState.canvas.width / 3) + GameState.canvas.width / 6;
                UI.createPopEffect(noteX, GameState.canvas.height - 50, '❌');
                this.g18Notes.splice(i, 1);

                if (this.g18Lives <= 0) {
                    UI.endGame("המסיבה נהרסה!", `הגעת לקומבו של ${this.g18Score} תווים.`);
                    return;
                }
            }
        }
    }

    draw(ctx) {
        // Draw background
        ctx.save();
        ctx.fillStyle = '#4a044e';
        ctx.fillRect(0, 0, GameState.canvas.width, GameState.canvas.height);

        // Draw 3 lanes
        let w = GameState.canvas.width / 3;
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(w, 0); ctx.lineTo(w, GameState.canvas.height);
        ctx.moveTo(w * 2, 0); ctx.lineTo(w * 2, GameState.canvas.height);
        ctx.stroke();

        // Draw beat target bar
        ctx.fillStyle = 'rgba(217, 70, 239, 0.3)';
        ctx.fillRect(0, GameState.canvas.height - 120, GameState.canvas.width, 80);

        // Draw falling notes
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        this.g18Notes.forEach(n => {
            ctx.font = '50px Arial';
            ctx.fillText(n.emoji, (n.lane * w) + w / 2, n.y);
        });
        ctx.restore();
    }

    handleInput(type, details) {
        if (type === 'keydown') {
            if (details.key === 'ArrowLeft') this.hitNote(0);
            if (details.key === 'ArrowDown') this.hitNote(1);
            if (details.key === 'ArrowRight') this.hitNote(2);
        }
        if (type === 'mousedown') {
            let third = GameState.canvas.width / 3;
            if (details.x < third) this.hitNote(0);
            else if (details.x < third * 2) this.hitNote(1);
            else this.hitNote(2);
        }
    }
}
