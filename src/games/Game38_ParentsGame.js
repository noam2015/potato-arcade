import { MiniGame } from './MiniGame.js';
import { GameState } from '../core/GameState.js';
import { UI } from '../core/UI.js';

const G38_BAD_PHRASES = [
    "לא מקשיב בשיעור! 🤬",
    "נכשל במבחן! 📝❌",
    "זרק מחק על המורה! 🧼",
    "מאחר כרוני! ⏰",
    "ישן בשיעור! 💤",
    "מציק לחברים! 🧅"
];

const G38_GOOD_PHRASES = [
    "תלמיד מצטיין! 🏆",
    "עוזר לחברים! 🤝",
    "משתפר מאוד! 📈",
    "מכין שיעורים! 📚",
    "הקשיב יפה! 👂",
    "בטטה למופת! 🍠"
];

export class Game38_ParentsGame extends MiniGame {
    init(difficulty) {
        UI.screens.container.className = 'relative w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-3xl sm:shadow-2xl overflow-hidden bg-teal-950';

        this.score = 0;
        this.lives = 3;
        this.time = 40; // Survive for 40 seconds
        this.difficulty = difficulty;

        this.bubbles = [];
        this.spawnTimer = 0.5;

        // Difficulty variables (Increased difficulty)
        if (difficulty === 'easy') {
            this.spawnRate = 1.3;
            this.bubbleSpeed = 155;
            this.goodChance = 0.22;
        } else if (difficulty === 'medium') {
            this.spawnRate = 0.9;
            this.bubbleSpeed = 235;
            this.goodChance = 0.3;
        } else {
            this.spawnRate = 0.52;
            this.bubbleSpeed = 330;
            this.goodChance = 0.42;
        }

        this.parentExpression = '🥔'; // neutral
        this.expressionTimer = 0;

        this.updateUI();
    }

    resize(w, h) {
    }

    updateUI() {
        const timeEl = document.getElementById('g38-time');
        const livesEl = document.getElementById('g38-lives');
        if (timeEl) timeEl.innerText = Math.max(0, Math.ceil(this.time));
        if (livesEl) livesEl.innerText = '❤️'.repeat(Math.max(0, this.lives));
    }

    spawnBubble() {
        const canvasH = GameState.canvas ? GameState.canvas.height : 600;
        let isGood = Math.random() < this.goodChance;
        let text = isGood 
            ? G38_GOOD_PHRASES[Math.floor(Math.random() * G38_GOOD_PHRASES.length)]
            : G38_BAD_PHRASES[Math.floor(Math.random() * G38_BAD_PHRASES.length)];

        this.bubbles.push({
            x: 150,
            y: canvasH / 2 - 30 + (Math.random() * 80 - 40),
            vx: this.bubbleSpeed,
            text: text,
            isGood: isGood,
            w: 160,
            h: 40,
            waveOffset: Math.random() * Math.PI * 2
        });
    }

    update(dt) {
        this.time -= dt / 1000;
        this.updateUI();

        if (this.time <= 0) {
            UI.endGame("שרדת את יום ההורים! 🎓🥳", `הצלחת להשאיר את אמא מרוצה ולחסום את התלונות של המורה!`);
            return;
        }

        // Spawn timer
        this.spawnTimer -= dt / 1000;
        if (this.spawnTimer <= 0) {
            this.spawnBubble();
            this.spawnTimer = this.spawnRate + Math.random() * 0.4;
        }

        // Update expression timer
        if (this.expressionTimer > 0) {
            this.expressionTimer -= dt / 1000;
            if (this.expressionTimer <= 0) {
                this.parentExpression = '🥔';
            }
        }

        const canvasW = GameState.canvas ? GameState.canvas.width : 800;

        // Update bubbles
        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            let b = this.bubbles[i];
            b.x += b.vx * (dt / 1000);
            b.y += Math.sin(performance.now() / 150 + b.waveOffset) * 0.8; // wave motion

            // Reached the parent (around x = canvasW - 160)
            if (b.x >= canvasW - 180) {
                if (b.isGood) {
                    // Good phrase reached parent! Nice!
                    this.score += 15;
                    this.parentExpression = '😊'; // Happy
                    this.expressionTimer = 1.0;
                    UI.createPopEffect(canvasW - 140, b.y - 30, '💖 נחת!', '#4ade80');
                } else {
                    // Bad phrase reached parent! Anger!
                    this.lives--;
                    this.updateUI();
                    this.parentExpression = '🤬'; // Angry
                    this.expressionTimer = 1.0;
                    UI.createPopEffect(canvasW - 140, b.y - 30, '💨 כעס!', '#ef4444');
                    UI.screens.container.classList.add('shake');
                    setTimeout(() => UI.screens.container.classList.remove('shake'), 200);

                    if (this.lives <= 0) {
                        UI.endGame("הושעית מבית הספר! 🚷🎒", "אמא גילתה את כל האמת והתעצבנה לחלוטין!");
                        return;
                    }
                }
                this.bubbles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        const canvasW = GameState.canvas.width;
        const canvasH = GameState.canvas.height;

        ctx.save();

        // 1. Draw Classroom wall
        ctx.fillStyle = '#064e3b'; // Green chalkboard color / wall
        ctx.fillRect(0, 0, canvasW, canvasH);

        // Draw blackboard
        ctx.fillStyle = '#022c22';
        ctx.strokeStyle = '#78350f'; // wood frame
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.roundRect(100, 40, canvasW - 200, 160, 8);
        ctx.fill();
        ctx.stroke();

        // Chalk text on board
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('יום הורים תשפ"ו 🏫', canvasW / 2, 90);
        ctx.font = '16px Arial';
        ctx.fillText('נא לשמור על השקט!', canvasW / 2, 130);

        // Wooden table desk in front
        ctx.fillStyle = '#78350f';
        ctx.fillRect(0, canvasH - 120, canvasW, 120);

        // 2. Draw Characters
        ctx.font = '80px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Teacher on the left
        let teacherX = 90;
        let teacherY = canvasH - 160;
        ctx.fillText('🧑‍🏫', teacherX, teacherY);

        // Student and Parent on the right
        let parentX = canvasW - 100;
        let parentY = canvasH - 160;
        let studentX = canvasW - 170;
        let studentY = canvasH - 145;

        // Draw Parent Potato with active expression
        ctx.fillText(this.parentExpression, parentX, parentY);
        // Draw nervous Student Potato
        ctx.font = '55px Arial';
        ctx.fillText('🍠', studentX, studentY);
        // Sweat drop on student
        ctx.font = '20px Arial';
        ctx.fillText('💦', studentX + 20, studentY - 25);

        // 3. Draw Speech Bubbles
        this.bubbles.forEach(b => {
            ctx.save();
            ctx.translate(b.x, b.y);

            // Draw bubble rectangle
            ctx.fillStyle = b.isGood ? '#065f46' : '#991b1b'; // Green/Red background
            ctx.strokeStyle = b.isGood ? '#10b981' : '#f43f5e';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.roundRect(-b.w / 2, -b.h / 2, b.w, b.h, 15);
            ctx.fill();
            ctx.stroke();

            // Speech pointer/tail back to teacher
            ctx.fillStyle = b.isGood ? '#065f46' : '#991b1b';
            ctx.strokeStyle = b.isGood ? '#10b981' : '#f43f5e';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-b.w / 2 + 20, b.h / 2);
            ctx.lineTo(-b.w / 2 + 5, b.h / 2 + 10);
            ctx.lineTo(-b.w / 2 + 10, b.h / 2 - 2);
            ctx.fill();
            ctx.stroke();

            // Bubble text
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 13px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(b.text, 0, 0);

            ctx.restore();
        });

        ctx.restore();
    }

    handleInput(type, details) {
        if (type === 'mousedown') {
            let cx = details.x;
            let cy = details.y;

            for (let i = 0; i < this.bubbles.length; i++) {
                let b = this.bubbles[i];

                // Check click bounds
                let dx = Math.abs(cx - b.x);
                let dy = Math.abs(cy - b.y);

                if (dx < b.w / 2 + 10 && dy < b.h / 2 + 10) {
                    // Clicked bubble!
                    if (!b.isGood) {
                        // Popped bad bubble successfully!
                        this.score += 10;
                        UI.createPopEffect(b.x, b.y, '💥 נחסם!', '#4ade80');
                        this.bubbles.splice(i, 1);
                    } else {
                        // Oops! Popped a good compliment bubble!
                        this.lives--;
                        this.updateUI();
                        UI.createPopEffect(b.x, b.y, '😭 פוצצת מחמאה!', '#ef4444');
                        UI.screens.container.classList.add('shake');
                        setTimeout(() => UI.screens.container.classList.remove('shake'), 200);
                        this.bubbles.splice(i, 1);

                        if (this.lives <= 0) {
                            UI.endGame("הושעית מבית הספר! 🚷🎒", "אמא גילתה את כל האמת והתעצבנה לחלוטין!");
                            return;
                        }
                    }
                    break;
                }
            }
        }
    }

    destroy() {
        this.bubbles = [];
    }
}
