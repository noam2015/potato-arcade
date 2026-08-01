import { MiniGame } from './MiniGame.js';
import { GameState } from '../core/GameState.js';
import { UI } from '../core/UI.js';

export class Game40_LottoGame extends MiniGame {
    init(difficulty) {
        UI.screens.container.className = 'relative w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-3xl sm:shadow-2xl overflow-hidden bg-purple-950';

        this.score = 0;
        this.lives = 3;
        this.time = 30; // 30 seconds time limit
        this.difficulty = difficulty;

        // Player Ticket Configuration
        this.ticketNumbers = [];
        this.targetCount = difficulty === 'easy' ? 4 : 6;

        // Generate unique random numbers for ticket (between 1 and 40)
        let possibleNumbers = [];
        for (let i = 1; i <= 40; i++) possibleNumbers.push(i);
        
        // Shuffle to get unique numbers
        possibleNumbers.sort(() => Math.random() - 0.5);
        
        // Specific trick numbers for Hard difficulty (visually similar)
        if (difficulty === 'hard') {
            let trickSets = [
                [3, 8], [17, 71], [18, 81], [6, 9], [12, 21], [25, 52]
            ];
            let chosenSet = trickSets[Math.floor(Math.random() * trickSets.length)];
            this.ticketNumbers.push({ val: chosenSet[0], marked: false });
            this.ticketNumbers.push({ val: chosenSet[1], marked: false });
            for (let i = 0; i < 4; i++) {
                // Ensure no duplicates
                let num = possibleNumbers[i];
                if (num !== chosenSet[0] && num !== chosenSet[1]) {
                    this.ticketNumbers.push({ val: num, marked: false });
                }
            }
        } else {
            for (let i = 0; i < this.targetCount; i++) {
                this.ticketNumbers.push({ val: possibleNumbers[i], marked: false });
            }
        }

        // Sort numbers so they look like a real lotto ticket
        this.ticketNumbers.sort((a, b) => a.val - b.val);

        // Lotto machine balls (decorations spinning inside)
        this.machineBalls = [];
        for (let i = 0; i < 18; i++) {
            let colors = ['#f43f5e', '#3b82f6', '#10b981', '#eab308', '#a855f7', '#f97316'];
            this.machineBalls.push({
                x: 0, y: 0,
                vx: Math.random() * 8 - 4,
                vy: Math.random() * 8 - 4,
                r: 12,
                color: colors[i % colors.length]
            });
        }

        // Drawn rack (holds currently valid drawn numbers)
        this.drawnRack = [];
        this.drawTimer = 0.8; // Draw first ball soon

        // Balancing
        if (difficulty === 'easy') {
            this.drawInterval = 3.6;
            this.rackLimit = 7;
        } else if (difficulty === 'medium') {
            this.drawInterval = 2.4;
            this.rackLimit = 5; // Old numbers fall off quicker
        } else {
            this.drawInterval = 1.6; // super fast draws
            this.rackLimit = 4; // high urgency
        }

        this.updateUI();
    }

    resize(w, h) {
    }

    updateUI() {
        const scoreEl = document.getElementById('g40-score');
        const livesEl = document.getElementById('g40-lives');
        let markedCount = this.ticketNumbers.filter(n => n.marked).length;

        if (scoreEl) scoreEl.innerText = `${markedCount} / ${this.targetCount}`;
        if (livesEl) livesEl.innerText = '❤️'.repeat(Math.max(0, this.lives));
    }

    drawNewBall() {
        // Choose a random number (between 1 and 40)
        // 45% chance to draw a number that is actually on the player's ticket to keep game paced
        let numberToDraw;
        let ticketUnmarked = this.ticketNumbers.filter(n => !n.marked);
        
        if (ticketUnmarked.length > 0 && Math.random() < 0.45) {
            numberToDraw = ticketUnmarked[Math.floor(Math.random() * ticketUnmarked.length)].val;
        } else {
            numberToDraw = Math.floor(Math.random() * 40) + 1;
        }

        // Add to drawn rack (if not already there)
        if (!this.drawnRack.some(b => b.val === numberToDraw)) {
            let colors = ['#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];
            this.drawnRack.push({
                val: numberToDraw,
                color: colors[numberToDraw % colors.length],
                timer: 1.0 // for initial entry pop animation
            });

            // If rack exceeds limit, remove oldest ball
            if (this.drawnRack.length > this.rackLimit) {
                this.drawnRack.shift();
            }
        }
    }

    update(dt) {
        this.time -= dt / 1000;
        this.updateUI();

        if (this.time <= 0) {
            UI.endGame("הזמן נגמר!", "לא הספקת לסמן את כל מספרי הלוטו בזמן.");
            return;
        }

        // Bouncing machine balls
        let radius = 70; // machine internal radius
        this.machineBalls.forEach(b => {
            b.x += b.vx;
            b.y += b.vy;

            // Simple boundary bounce within sphere
            let dist = Math.sqrt(b.x * b.x + b.y * b.y);
            if (dist > radius - b.r) {
                // reflect vector
                let nx = b.x / dist;
                let ny = b.y / dist;
                let dot = b.vx * nx + b.vy * ny;
                b.vx -= 2 * dot * nx;
                b.vy -= 2 * dot * ny;
                
                // clamp position
                b.x = nx * (radius - b.r);
                b.y = ny * (radius - b.r);
            }
        });

        // Draw ball timer
        this.drawTimer -= dt / 1000;
        if (this.drawTimer <= 0) {
            this.drawNewBall();
            this.drawTimer = this.drawInterval;
        }

        // Update drawn balls entry anim timer
        this.drawnRack.forEach(b => {
            if (b.timer > 0) b.timer -= dt / 150; // fast decay
        });
    }

    draw(ctx) {
        const canvasW = GameState.canvas.width;
        const canvasH = GameState.canvas.height;
        const centerX = canvasW / 2;

        ctx.save();

        // 1. Draw Casino background
        let bgGrad = ctx.createLinearGradient(0, 0, 0, canvasH);
        bgGrad.addColorStop(0, '#3b0764'); // purple-950
        bgGrad.addColorStop(1, '#581c87'); // purple-900
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, canvasW, canvasH);

        // Draw shiny casino lights
        ctx.fillStyle = 'rgba(253, 224, 71, 0.08)';
        for (let i = 0; i < canvasW; i += 80) {
            ctx.beginPath();
            ctx.arc(i, 30, 20, 0, Math.PI * 2);
            ctx.fill();
        }

        // 2. Draw Lotto Machine Sphere (Middle-Left)
        let machineX = centerX - 160;
        let machineY = canvasH / 2 - 40;

        // Metallic stand
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(machineX - 40, machineY + 90);
        ctx.lineTo(machineX, machineY);
        ctx.lineTo(machineX + 40, machineY + 90);
        ctx.stroke();

        // Tube outlet
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.moveTo(machineX + 20, machineY + 60);
        ctx.quadraticCurveTo(machineX + 90, machineY + 80, machineX + 110, machineY + 20);
        ctx.stroke();

        // Glass sphere
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(machineX, machineY, 80, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Machine balls
        ctx.save();
        ctx.translate(machineX, machineY);
        this.machineBalls.forEach(b => {
            ctx.fillStyle = b.color;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();

        // Machine center cap
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(machineX, machineY, 18, 0, Math.PI * 2);
        ctx.fill();

        // 3. Draw Drawn Balls Rack (Middle-Right)
        let rackX = centerX + 40;
        let rackY = canvasH / 2 - 80;
        let rackSpacing = 65;

        // Draw rack wooden shelf background
        ctx.fillStyle = '#78350f';
        ctx.roundRect(rackX - 10, rackY - 5, 270, 75, 8);
        ctx.fill();
        ctx.fillStyle = '#451a03';
        ctx.roundRect(rackX - 5, rackY + 60, 260, 6, 2);
        ctx.fill();

        // Rack header label
        ctx.fillStyle = '#e9d5ff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('כדורים שהוגרלו (פגי תוקף משמאל!):', rackX, rackY - 15);

        // Draw balls on the rack
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        this.drawnRack.forEach((ball, idx) => {
            let bx = rackX + 30 + idx * rackSpacing;
            let by = rackY + 30;
            
            // Pop effect for new balls
            let scale = ball.timer > 0 ? 1.0 + ball.timer * 0.5 : 1.0;
            let r = 24 * scale;

            ctx.fillStyle = ball.color;
            ctx.beginPath();
            ctx.arc(bx, by, r, 0, Math.PI * 2);
            ctx.fill();

            // Inner white circle
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(bx, by, r * 0.65, 0, Math.PI * 2);
            ctx.fill();

            // Number
            ctx.fillStyle = '#1e1b4b';
            ctx.font = `bold ${Math.floor(r * 0.7)}px Arial`;
            ctx.fillText(ball.val, bx, by);
        });

        // 4. Draw Player Ticket Card (Bottom Center)
        let ticketW = 440;
        let ticketH = 110;
        let ticketX = centerX - ticketW / 2;
        let ticketY = canvasH - 145;

        // Card background
        ctx.fillStyle = '#fef08a'; // yellow-200
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(ticketX, ticketY, ticketW, ticketH, 12);
        ctx.fill();
        ctx.stroke();

        // Card header
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(ticketX + 2, ticketY + 2, ticketW - 4, 25);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('טופס לוטו הבטטה 🍠', centerX, ticketY + 14);

        // Draw ticket numbers grid
        let numCols = this.targetCount;
        let boxW = 55;
        let boxH = 45;
        let boxSpacing = Math.min(15, (ticketW - (numCols * boxW)) / (numCols + 1));
        let startBoxX = ticketX + (ticketW - (numCols * boxW + (numCols - 1) * boxSpacing)) / 2;

        this.ticketNumbers.forEach((n, idx) => {
            let bx = startBoxX + idx * (boxW + boxSpacing);
            let by = ticketY + 45;

            // Box state styling
            ctx.fillStyle = n.marked ? '#22c55e' : '#ffffff'; // green if marked
            ctx.strokeStyle = n.marked ? '#15803d' : '#e2e8f0';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.roundRect(bx, by, boxW, boxH, 8);
            ctx.fill();
            ctx.stroke();

            // Draw number
            ctx.fillStyle = n.marked ? '#ffffff' : '#1e293b';
            ctx.font = 'bold 22px Arial';
            ctx.fillText(n.val, bx + boxW / 2, by + boxH / 2);

            // Store bounding box for click checks
            n.clickBounds = {
                x1: bx,
                y1: by,
                x2: bx + boxW,
                y2: by + boxH
            };
        });

        // Time bar visual warning
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(centerX - 150, 105, 300, 12);
        
        ctx.fillStyle = this.time > 8 ? '#10b981' : '#ef4444';
        ctx.fillRect(centerX - 150, 105, 300 * (this.time / 30), 12);

        ctx.restore();
    }

    handleInput(type, details) {
        if (type === 'mousedown') {
            let cx = details.x;
            let cy = details.y;

            // Check if player clicked any number box on their ticket
            for (let i = 0; i < this.ticketNumbers.length; i++) {
                let n = this.ticketNumbers[i];
                if (!n.clickBounds || n.marked) continue;

                let b = n.clickBounds;
                if (cx >= b.x1 && cx <= b.x2 && cy >= b.y1 && cy <= b.y2) {
                    // Clicked this number! Check if it has been drawn in the rack
                    let isDrawn = this.drawnRack.some(ball => ball.val === n.val);

                    if (isDrawn) {
                        n.marked = true;
                        this.updateUI();
                        UI.createPopEffect((b.x1 + b.x2) / 2, b.y1, '✨ פגיעה!', '#4ade80');

                        // Check Win Condition
                        let allMarked = this.ticketNumbers.every(num => num.marked);
                        if (allMarked) {
                            UI.endGame("זכית בפרס הראשון! 💰🍠", `סילקת את כל המספרים בהצלחה וזכית בלוטו!`);
                            return;
                        }
                    } else {
                        // Penalty! Clicked a number not drawn
                        this.lives--;
                        this.updateUI();
                        UI.createPopEffect((b.x1 + b.x2) / 2, b.y1, '❌ לא הוגרל!', '#ef4444');
                        UI.screens.container.classList.add('shake');
                        setTimeout(() => UI.screens.container.classList.remove('shake'), 200);

                        if (this.lives <= 0) {
                            UI.endGame("הפסדת את התחתונים! 💸🎲", "הימרת על מספרים לא נכונים ואיבדת את כל כספך.");
                            return;
                        }
                    }
                    break;
                }
            }
        }
    }

    destroy() {
        this.machineBalls = [];
        this.drawnRack = [];
    }
}
