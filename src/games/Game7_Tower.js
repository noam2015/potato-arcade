import { MiniGame } from './MiniGame.js';
import { GameState } from '../core/GameState.js';
import { UI } from '../core/UI.js';

export class Game7_Tower extends MiniGame {
    init(difficulty) {
        UI.screens.container.className = 'relative w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-3xl sm:shadow-2xl overflow-hidden bg-orange-100';

        this.g7Score = 0;
        this.g7CameraY = 0;
        this.g7Dir = 1;
        this.g7Current = null;
        
        this.g7Speed = (difficulty === 'easy') ? 150 : 400;

        this.initBase();
        this.spawnPiece();

        const scoreEl = document.getElementById('g7-score');
        if (scoreEl) scoreEl.innerText = this.g7Score;
    }

    initBase() {
        this.g7Tower = [{
            x: GameState.canvas.width / 2 - 100,
            y: GameState.canvas.height - 40,
            w: 200,
            h: 40,
            c: '#b45309'
        }];
        this.g7CameraY = 0;
    }

    resize(w, h) {
        // Adjust the base coordinate if canvas sizes change
        if (this.g7Tower.length > 0) {
            const shiftY = (h - 40) - this.g7Tower[0].y;
            this.g7Tower.forEach(p => p.y += shiftY);
            if (this.g7Current) this.g7Current.y += shiftY;
        }
    }

    spawnPiece() {
        let lastPiece = this.g7Tower[this.g7Tower.length - 1];
        this.g7Current = {
            x: 0,
            y: lastPiece.y - 40,
            w: lastPiece.w,
            h: 40,
            c: Math.random() > 0.5 ? '#78350f' : '#fcd34d'
        };
        this.g7Dir = 1;
    }

    dropPiece() {
        if (!this.g7Current) return;

        let lastPiece = this.g7Tower[this.g7Tower.length - 1];

        // Missed completely check
        if (this.g7Current.x + this.g7Current.w < lastPiece.x || this.g7Current.x > lastPiece.x + lastPiece.w) {
            UI.createPopEffect(this.g7Current.x + this.g7Current.w / 2, this.g7Current.y, '❌');
            this.g7Current.y += 100;
            UI.endGame("המגדל קרס!", `הגעת ל-${this.g7Score} קומות.`);
            return;
        }

        // Cut overlapping piece
        let newX = Math.max(this.g7Current.x, lastPiece.x);
        let newW = Math.min(this.g7Current.x + this.g7Current.w, lastPiece.x + lastPiece.w) - newX;

        this.g7Current.x = newX;
        this.g7Current.w = newW;
        this.g7Tower.push({ ...this.g7Current });
        
        this.g7Score++;
        const scoreEl = document.getElementById('g7-score');
        if (scoreEl) scoreEl.innerText = this.g7Score;

        // Camera scroll
        let targetCameraY = this.g7Tower[this.g7Tower.length - 1].y - GameState.canvas.height / 2;
        if (targetCameraY < this.g7CameraY) {
            this.g7CameraY = targetCameraY;
        }

        this.g7Speed += 10;

        if (newW < 10) {
            UI.endGame("המגדל קרס!", `החתיכה קטנה מדי. הגעת ל-${this.g7Score} קומות.`);
            return;
        }

        this.spawnPiece();
    }

    update(dt) {
        if (this.g7Current) {
            this.g7Current.x += this.g7Speed * this.g7Dir * (dt / 1000);
            if (this.g7Current.x <= 0) {
                this.g7Current.x = 0;
                this.g7Dir = 1;
            }
            if (this.g7Current.x + this.g7Current.w >= GameState.canvas.width) {
                this.g7Current.x = GameState.canvas.width - this.g7Current.w;
                this.g7Dir = -1;
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(0, -this.g7CameraY);
        
        this.g7Tower.forEach(p => {
            ctx.fillStyle = p.c;
            ctx.fillRect(p.x, p.y, p.w, p.h);
            ctx.strokeStyle = '#000';
            ctx.strokeRect(p.x, p.y, p.w, p.h);
        });

        if (this.g7Current) {
            ctx.fillStyle = this.g7Current.c;
            ctx.fillRect(this.g7Current.x, this.g7Current.y, this.g7Current.w, this.g7Current.h);
            ctx.strokeStyle = '#000';
            ctx.strokeRect(this.g7Current.x, this.g7Current.y, this.g7Current.w, this.g7Current.h);
        }
        
        ctx.restore();
    }

    handleInput(type, details) {
        if (type === 'keydown') {
            if (details.key === ' ' || details.key === 'Enter') {
                this.dropPiece();
            }
        }
        if (type === 'mousedown') {
            this.dropPiece();
        }
    }
}
