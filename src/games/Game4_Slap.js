import { MiniGame } from './MiniGame.js';
import { GameState } from '../core/GameState.js';
import { UI } from '../core/UI.js';

export class Game4_Slap extends MiniGame {
    init(difficulty) {
        UI.screens.container.className = 'relative w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-3xl sm:shadow-2xl overflow-hidden bg-purple-900';

        this.g4Score = 0;
        this.g4Lives = 3;
        this.g4Slider = { x: 20, dir: 1 };
        this.g4Zone = { x: 0, width: 80 };

        this.g4Speed = (difficulty === 'easy') ? 250 : 500;
        this.g4Zone.width = (difficulty === 'easy') ? 100 : 50;
        this.g4SpeedInc = (difficulty === 'easy') ? 15 : 50;

        this.updateUI();
        this.resetRound();
    }

    resetRound() {
        this.g4Slider.x = 20;
        this.g4Slider.dir = 1;
        
        let minX = GameState.canvas.width * 0.2;
        let maxX = GameState.canvas.width * 0.8 - this.g4Zone.width;
        this.g4Zone.x = Math.random() * (maxX - minX) + minX;
        
        this.g4Face = '🤡';
        this.g4State = 'RUNNING';
    }

    updateUI() {
        const scoreEl = document.getElementById('g4-score');
        const livesEl = document.getElementById('g4-lives');
        if (scoreEl) scoreEl.innerText = this.g4Score;
        if (livesEl) livesEl.innerText = '❤️'.repeat(this.g4Lives);
    }

    attemptSlap() {
        if (this.g4State !== 'RUNNING') return;

        if (this.g4Slider.x >= this.g4Zone.x && this.g4Slider.x <= this.g4Zone.x + this.g4Zone.width) {
            this.g4State = 'SLAPPED';
            this.g4Face = '😵';
            this.g4Score += 10;
            this.g4Speed += this.g4SpeedInc;
            
            if (this.g4Zone.width > 30) {
                this.g4Zone.width -= 2;
            }
            
            UI.createPopEffect(GameState.canvas.width / 2, GameState.canvas.height / 2 - 50, '💥');
        } else {
            this.g4State = 'MISSED';
            this.g4Face = '😂';
            this.g4Lives--;
            UI.createPopEffect(GameState.canvas.width / 2, GameState.canvas.height / 2 - 50, '❌');
        }

        this.updateUI();

        if (this.g4Lives <= 0) {
            setTimeout(() => UI.endGame("הליצן ניצח", `השגת ${this.g4Score} נקודות.`), 500);
        } else {
            setTimeout(() => this.resetRound(), 1000);
        }
    }

    update(dt) {
        if (this.g4State === 'RUNNING') {
            this.g4Slider.x += this.g4Speed * this.g4Slider.dir * (dt / 1000);
            if (this.g4Slider.x > GameState.canvas.width - 20) {
                this.g4Slider.x = GameState.canvas.width - 20;
                this.g4Slider.dir = -1;
            }
            if (this.g4Slider.x < 20) {
                this.g4Slider.x = 20;
                this.g4Slider.dir = 1;
            }
        }
    }

    draw(ctx) {
        // Draw track
        ctx.save();
        ctx.fillStyle = '#4c1d95';
        ctx.fillRect(0, GameState.canvas.height - 100, GameState.canvas.width, 100);
        
        // Draw target zone
        ctx.fillStyle = 'rgba(74, 222, 128, 0.5)';
        ctx.fillRect(this.g4Zone.x, GameState.canvas.height - 100, this.g4Zone.width, 100);
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 4;
        ctx.strokeRect(this.g4Zone.x, GameState.canvas.height - 100, this.g4Zone.width, 100);
        ctx.restore();

        // Draw clown face
        ctx.save();
        ctx.font = '100px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let faceY = GameState.canvas.height / 2 - 50;
        
        if (this.g4State === 'RUNNING') {
            faceY += Math.sin(performance.now() / 200) * 10;
        }

        if (this.g4State === 'SLAPPED') {
            ctx.translate(GameState.canvas.width / 2 + 20, faceY);
            ctx.rotate(0.5);
            ctx.fillText(this.g4Face, 0, 0);
        } else {
            ctx.fillText(this.g4Face, GameState.canvas.width / 2, faceY);
        }
        ctx.restore();

        // Draw hand slider
        ctx.save();
        ctx.font = '50px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🖐️', this.g4Slider.x, GameState.canvas.height - 50);
        ctx.restore();
    }

    handleInput(type, details) {
        if (type === 'keydown') {
            if (details.key === ' ' || details.key === 'Enter') {
                this.attemptSlap();
            }
        }
        if (type === 'mousedown') {
            this.attemptSlap();
        }
    }
}
