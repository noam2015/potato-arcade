import { MiniGame } from './MiniGame.js';
import { GameState } from '../core/GameState.js';
import { UI } from '../core/UI.js';

const G34_GOOD_VEGGIES = ['🍠', '🥔'];
const G34_BAD_VEGGIES = ['🧅', '🍅', '🥕', '🥦', '🌶️'];

export class Game34_SelectorGame extends MiniGame {
    init(difficulty) {
        UI.screens.container.className = 'relative w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-3xl sm:shadow-2xl overflow-hidden bg-violet-950';

        this.score = 0;
        this.lives = 3;
        this.time = 45;
        this.difficulty = difficulty;

        this.activeGuest = null;
        this.guestQueue = [];
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragOffset = 0;
        
        // Buttons bounds for mouse clicks
        this.btnReject = { x: 0, y: 0, w: 100, h: 50 };
        this.btnApprove = { x: 0, y: 0, w: 100, h: 50 };

        // Patience speeds based on difficulty
        if (difficulty === 'easy') {
            this.patienceSpeed = 8;
        } else if (difficulty === 'medium') {
            this.patienceSpeed = 16;
        } else {
            this.patienceSpeed = 26;
        }

        // Pre-fill queue with initial guests
        for (let i = 0; i < 5; i++) {
            this.guestQueue.push(this.generateGuest());
        }

        this.pullNextGuest();
        this.updateUI();
    }

    generateGuest() {
        let isGood = Math.random() < 0.45;
        let emoji = '';
        if (isGood) {
            emoji = G34_GOOD_VEGGIES[Math.floor(Math.random() * G34_GOOD_VEGGIES.length)];
        } else {
            emoji = G34_BAD_VEGGIES[Math.floor(Math.random() * G34_BAD_VEGGIES.length)];
        }

        let hasDisguise = !isGood && Math.random() < 0.35;

        return {
            emoji: emoji,
            isGood: isGood,
            hasDisguise: hasDisguise,
            patience: 100
        };
    }

    pullNextGuest() {
        const canvasW = GameState.canvas ? GameState.canvas.width : 800;
        const canvasH = GameState.canvas ? GameState.canvas.height : 600;

        this.activeGuest = this.guestQueue.shift();
        
        this.activeGuest.x = canvasW / 2;
        this.activeGuest.y = canvasH / 2 + 10;
        this.activeGuest.scale = 0;
        this.dragOffset = 0;

        this.guestQueue.push(this.generateGuest());
    }

    makeDecision(isApproved) {
        if (!this.activeGuest) return;

        let isCorrect = (isApproved === this.activeGuest.isGood);

        if (isCorrect) {
            this.score += 10;
            this.updateUI();
            UI.createPopEffect(this.activeGuest.x + (isApproved ? 60 : -60), this.activeGuest.y - 40, '✅ +10', '#4ade80');
        } else {
            this.lives--;
            this.updateUI();
            UI.createPopEffect(this.activeGuest.x, this.activeGuest.y - 40, '❌ טעות!', '#f87171');
            UI.screens.container.classList.add('shake');
            setTimeout(() => UI.screens.container.classList.remove('shake'), 200);

            if (this.lives <= 0) {
                UI.endGame("המועדון נסגר!", `הסלקציה נכשלה. הצלחת למיין ${this.score / 10} ירקות.`);
                return;
            }
        }

        let targetExitX = isApproved ? GameState.canvas.width + 100 : -100;
        let guestToExit = this.activeGuest;
        guestToExit.targetX = targetExitX;
        
        this.pullNextGuest();
    }

    updateUI() {
        const scoreEl = document.getElementById('g34-score');
        const livesEl = document.getElementById('g34-lives');
        if (scoreEl) scoreEl.innerText = Math.floor(this.score / 10);
        if (livesEl) livesEl.innerText = '❤️'.repeat(Math.max(0, this.lives));
    }

    update(dt) {
        this.time -= dt / 1000;
        this.updateUI();

        if (this.time <= 0) {
            UI.endGame("התור התפזר!", `המסיבה התחילה! הכנסת ${this.score / 10} אורחים רצויים.`);
            return;
        }

        if (this.activeGuest) {
            if (this.activeGuest.scale < 1) {
                this.activeGuest.scale += 5 * (dt / 1000);
                if (this.activeGuest.scale > 1) this.activeGuest.scale = 1;
            }

            this.activeGuest.patience -= this.patienceSpeed * (dt / 1000);
            if (this.activeGuest.patience <= 0) {
                this.lives--;
                this.updateUI();
                UI.createPopEffect(this.activeGuest.x, this.activeGuest.y - 40, '⏳ המתנה ארוכה!', '#f87171');
                UI.screens.container.classList.add('shake');
                setTimeout(() => UI.screens.container.classList.remove('shake'), 200);

                if (this.lives <= 0) {
                    UI.endGame("המועדון נסגר!", `הסלקציה נכשלה. הצלחת למיין ${this.score / 10} ירקות.`);
                    return;
                }

                this.pullNextGuest();
            }
        }
    }

    draw(ctx) {
        const canvasW = GameState.canvas.width;
        const canvasH = GameState.canvas.height;
        const centerX = canvasW / 2;
        const centerY = canvasH / 2;

        ctx.save();

        let bgGrad = ctx.createRadialGradient(centerX, centerY - 100, 50, centerX, centerY, canvasW * 0.6);
        bgGrad.addColorStop(0, '#2e1065');
        bgGrad.addColorStop(1, '#0f052d');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, canvasW, canvasH);

        ctx.shadowColor = '#d946ef';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#fdf4ff';
        ctx.font = 'bold 32px Arial';
        ctx.fillText('מועדון הבטטה 🍠', centerX, 60);
        ctx.shadowBlur = 0;

        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.roundRect(centerX - 100, 95, 200, 8, 4);
        ctx.fill();
        ctx.fillStyle = '#d946ef';
        ctx.roundRect(centerX - 100, 95, 200 * (this.time / 45), 8, 4);
        ctx.fill();

        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 12;
        
        ctx.beginPath();
        ctx.moveTo(centerX - 120, centerY - 40);
        ctx.lineTo(centerX - 120, centerY + 140);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(centerX + 120, centerY - 40);
        ctx.lineTo(centerX + 120, centerY + 140);
        ctx.stroke();

        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(centerX - 120, centerY + 20);
        ctx.quadraticCurveTo(centerX, centerY + 80, centerX + 120, centerY + 20);
        ctx.stroke();

        if (this.activeGuest) {
            ctx.save();
            let gx = this.activeGuest.x + this.dragOffset;
            let gy = this.activeGuest.y;

            ctx.translate(gx, gy);
            ctx.scale(this.activeGuest.scale, this.activeGuest.scale);

            ctx.font = '75px Arial';
            ctx.fillText(this.activeGuest.emoji, 0, 0);

            if (this.activeGuest.hasDisguise) {
                ctx.font = '40px Arial';
                ctx.fillText('🕶️', 0, -25);
            }

            let patienceWidth = 60;
            let px = -patienceWidth / 2;
            let py = -70;
            
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(px, py, patienceWidth, 6);

            let color = this.activeGuest.patience > 50 ? '#22c55e' : (this.activeGuest.patience > 25 ? '#eab308' : '#ef4444');
            ctx.fillStyle = color;
            ctx.fillRect(px, py, patienceWidth * (this.activeGuest.patience / 100), 6);

            ctx.restore();
        }

        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.roundRect(20, centerY - 40, 80, 200, 10);
        ctx.fill();

        ctx.font = '28px Arial';
        ctx.fillText('בתור:', 60, centerY - 15);
        for (let i = 0; i < Math.min(3, this.guestQueue.length); i++) {
            ctx.fillText(this.guestQueue[i].emoji, 60, centerY + 30 + i * 45);
        }

        this.btnReject.w = 110;
        this.btnReject.h = 45;
        this.btnReject.x = centerX - 180;
        this.btnReject.y = canvasH - 120;

        this.btnApprove.w = 110;
        this.btnApprove.h = 45;
        this.btnApprove.x = centerX + 70;
        this.btnApprove.y = canvasH - 120;

        ctx.fillStyle = '#dc2626';
        ctx.roundRect(this.btnReject.x, this.btnReject.y, this.btnReject.w, this.btnReject.h, 8);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('❌ דחה (⬅️)', this.btnReject.x + this.btnReject.w / 2, this.btnReject.y + this.btnReject.h / 2);

        ctx.fillStyle = '#16a34a';
        ctx.roundRect(this.btnApprove.x, this.btnApprove.y, this.btnApprove.w, this.btnApprove.h, 8);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillText('✅ הכנס (➡️)', this.btnApprove.x + this.btnApprove.w / 2, this.btnApprove.y + this.btnApprove.h / 2);

        ctx.restore();
    }

    handleInput(type, details) {
        if (type === 'keydown') {
            if (details.key === 'ArrowLeft' || details.key === 'a' || details.key === 'A') {
                this.makeDecision(false);
            }
            if (details.key === 'ArrowRight' || details.key === 'd' || details.key === 'D') {
                this.makeDecision(true);
            }
        }

        if (type === 'mousedown') {
            let cx = details.x;
            let cy = details.y;

            if (cx > this.btnReject.x && cx < this.btnReject.x + this.btnReject.w &&
                cy > this.btnReject.y && cy < this.btnReject.y + this.btnReject.h) {
                this.makeDecision(false);
                return;
            }

            if (cx > this.btnApprove.x && cx < this.btnApprove.x + this.btnApprove.w &&
                cy > this.btnApprove.y && cy < this.btnApprove.y + this.btnApprove.h) {
                this.makeDecision(true);
                return;
            }

            this.isDragging = true;
            this.dragStartX = details.x;
        }

        if (type === 'mousemove' && this.isDragging) {
            this.dragOffset = details.x - this.dragStartX;
        }

        if (type === 'mouseup') {
            if (this.isDragging) {
                this.isDragging = false;
                if (this.dragOffset > 70) {
                    this.makeDecision(true);
                } else if (this.dragOffset < -70) {
                    this.makeDecision(false);
                } else {
                    this.dragOffset = 0;
                }
            }
        }
    }

    destroy() {
        this.guestQueue = [];
        this.activeGuest = null;
    }
}
