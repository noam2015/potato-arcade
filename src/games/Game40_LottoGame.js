import { MiniGame } from './MiniGame.js';
import { GameState } from '../core/GameState.js';
import { UI } from '../core/UI.js';

export class Game40_LottoGame extends MiniGame {
    init(difficulty) {
        UI.screens.container.className = 'relative w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-3xl sm:shadow-2xl overflow-hidden bg-purple-950';

        this.score = 0; // Represents cash earned ($)
        this.lives = 3; // Represents tickets (🎟️)
        this.difficulty = difficulty;

        // Game states: 'SELECTION', 'DRAWING', 'SUMMARY'
        this.state = 'SELECTION';

        this.selectedNumbers = []; // Numbers picked by player (max 6)
        this.winningNumbers = [];  // The 6 drawn numbers for the current round
        this.drawnBalls = [];      // Balls already popped out of the machine
        
        this.drawTimer = 0;
        this.isWin = false;

        // Payout calculations
        this.roundMatches = 0;
        this.roundPositionMatches = 0;
        this.roundCashWon = 0;
        this.roundTicketsEarned = 0;

        // Cumulative ticket match accumulator
        this.totalMatchesAccumulated = 0;

        // Setup spinning machine balls
        this.machineBalls = [];
        for (let i = 0; i < 20; i++) {
            let colors = ['#f43f5e', '#3b82f6', '#10b981', '#eab308', '#a855f7', '#f97316'];
            this.machineBalls.push({
                x: 0, y: 0,
                vx: Math.random() * 10 - 5,
                vy: Math.random() * 10 - 5,
                r: 11,
                color: colors[i % colors.length]
            });
        }

        // Draw intervals based on difficulty
        if (difficulty === 'easy') {
            this.drawInterval = 2.4;
        } else if (difficulty === 'medium') {
            this.drawInterval = 1.8;
        } else {
            this.drawInterval = 1.1; // rapid draws
        }

        // 1 to 40 numbers grid setup
        this.gridNumbers = [];
        for (let i = 1; i <= 40; i++) {
            this.gridNumbers.push(i);
        }

        this.updateUI();
    }

    resize(w, h) {
    }

    updateUI() {
        const scoreEl = document.getElementById('g40-score');
        const livesEl = document.getElementById('g40-lives');
        if (scoreEl) scoreEl.innerText = this.score;
        if (livesEl) livesEl.innerText = '🎟️'.repeat(Math.max(0, this.lives));
    }

    quickPick() {
        // Automatically choose 6 random unique numbers
        let numbers = [...this.gridNumbers];
        numbers.sort(() => Math.random() - 0.5);
        this.selectedNumbers = numbers.slice(0, 6);
        // Sort selections ascending
        this.selectedNumbers.sort((a, b) => a - b);
    }

    submitTicket() {
        if (this.selectedNumbers.length < 6) return;

        // Play costs 1 ticket
        this.lives--;
        this.updateUI();

        // Generate 6 winning numbers
        let pool = [...this.gridNumbers];
        pool.sort(() => Math.random() - 0.5);
        this.winningNumbers = pool.slice(0, 6);

        // Reset round stats
        this.drawnBalls = [];
        this.roundMatches = 0;
        this.roundPositionMatches = 0;
        this.roundCashWon = 0;
        this.roundTicketsEarned = 0;

        // Transition to drawing state
        this.state = 'DRAWING';
        this.drawTimer = 1.2; // Delay before first ball is drawn
    }

    checkMatches() {
        // Calculate winnings
        let matches = 0;
        let positionMatches = 0;

        this.winningNumbers.forEach((winNum, winIdx) => {
            // Check if winNum is anywhere in selectedNumbers
            if (this.selectedNumbers.includes(winNum)) {
                matches++;
            }
            // Check if player selected number at the same index
            if (this.selectedNumbers[winIdx] === winNum) {
                positionMatches++;
            }
        });

        // Winnings scale
        let payoutTable = [0, 10, 35, 90, 250, 600, 3000];
        let cash = payoutTable[matches];
        let posBonus = positionMatches * 120; // $120 bonus for same-position matches
        
        this.roundMatches = matches;
        this.roundPositionMatches = positionMatches;
        this.roundCashWon = cash + posBonus;
        
        // Earning tickets cumulatively: 1 ticket for every 2 total matches accumulated (across rounds)
        let oldTicketsEarned = Math.floor(this.totalMatchesAccumulated / 2);
        this.totalMatchesAccumulated += matches;
        let newTicketsEarned = Math.floor(this.totalMatchesAccumulated / 2);
        this.roundTicketsEarned = newTicketsEarned - oldTicketsEarned;

        // Apply to totals
        this.score += this.roundCashWon;
        this.lives += this.roundTicketsEarned;

        this.updateUI();
    }

    update(dt) {
        // Bouncing balls in machine
        let radius = 68;
        this.machineBalls.forEach(b => {
            let speedFactor = this.state === 'DRAWING' ? 1.6 : 0.8;
            b.x += b.vx * speedFactor;
            b.y += b.vy * speedFactor;

            let dist = Math.sqrt(b.x * b.x + b.y * b.y);
            if (dist > radius - b.r) {
                let nx = b.x / dist;
                let ny = b.y / dist;
                let dot = b.vx * nx + b.vy * ny;
                b.vx -= 2 * dot * nx;
                b.vy -= 2 * dot * ny;
                
                b.x = nx * (radius - b.r);
                b.y = ny * (radius - b.r);
            }
        });

        if (this.state === 'DRAWING') {
            this.drawTimer -= dt / 1000;
            if (this.drawTimer <= 0) {
                // Draw next ball
                let nextIdx = this.drawnBalls.length;
                if (nextIdx < 6) {
                    let ballNum = this.winningNumbers[nextIdx];
                    let colors = ['#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];
                    
                    this.drawnRackPush(ballNum, colors[ballNum % colors.length]);

                    this.drawTimer = this.drawInterval;
                } else {
                    // Drawing phase complete! Calculate matches and show summary
                    this.checkMatches();
                    this.state = 'SUMMARY';
                }
            }
        }
    }

    drawnRackPush(val, color) {
        this.drawnBalls.push({
            val: val,
            color: color,
            timer: 1.0
        });

        // Trigger visual pop feedback if it's a match
        let isMatch = this.selectedNumbers.includes(val);
        let matchIdx = this.selectedNumbers.indexOf(val);
        let isPosMatch = matchIdx === (this.drawnBalls.length - 1);

        const canvasW = GameState.canvas.width;
        const centerX = canvasW / 2;

        if (isPosMatch) {
            UI.createPopEffect(centerX + 80, 160, '🌟 בונוס מיקום! 🌟', '#facc15');
        } else if (isMatch) {
            UI.createPopEffect(centerX + 80, 160, '🎯 פגיעה!', '#4ade80');
        }
    }

    draw(ctx) {
        const canvasW = GameState.canvas.width;
        const canvasH = GameState.canvas.height;
        const centerX = canvasW / 2;

        ctx.save();

        // 1. Draw Casino background
        let bgGrad = ctx.createLinearGradient(0, 0, 0, canvasH);
        bgGrad.addColorStop(0, '#1e1b4b'); // deep indigo
        bgGrad.addColorStop(1, '#311042'); // deep purple
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, canvasW, canvasH);

        // Draw casino canopy frame / lights
        ctx.fillStyle = 'rgba(253, 224, 71, 0.08)';
        for (let i = 0; i < canvasW; i += 70) {
            ctx.beginPath();
            ctx.arc(i, 20, 15, 0, Math.PI * 2);
            ctx.fill();
        }

        // 2. Draw Lotto Machine Sphere (Middle-Left)
        let machineX = centerX - 180;
        let machineY = 160;

        // Stand
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(machineX - 35, machineY + 80);
        ctx.lineTo(machineX, machineY);
        ctx.lineTo(machineX + 35, machineY + 80);
        ctx.stroke();

        // Tube outlet
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.moveTo(machineX + 15, machineY + 50);
        ctx.quadraticCurveTo(machineX + 70, machineY + 70, machineX + 90, machineY + 20);
        ctx.stroke();

        // Glass sphere
        ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(machineX, machineY, 75, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Machine balls bouncing
        ctx.save();
        ctx.translate(machineX, machineY);
        this.machineBalls.forEach(b => {
            ctx.fillStyle = b.color;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();

        // 3. Draw Drawn Balls Rack (Middle-Right)
        let rackX = centerX - 40;
        let rackY = 120;
        let rackSpacing = 52;

        ctx.fillStyle = '#451a03'; // Wooden shelf
        ctx.roundRect(rackX - 10, rackY - 5, 335, 60, 6);
        ctx.fill();

        ctx.fillStyle = '#b45309';
        ctx.fillRect(rackX - 5, rackY + 48, 325, 4);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Draw balls currently drawn
        for (let i = 0; i < 6; i++) {
            let bx = rackX + 25 + i * rackSpacing;
            let by = rackY + 24;

            if (i < this.drawnBalls.length) {
                let ball = this.drawnBalls[i];
                let isPosMatch = this.selectedNumbers[i] === ball.val;

                ctx.fillStyle = isPosMatch ? '#d97706' : ball.color; // Gold if same-position match!
                ctx.beginPath();
                ctx.arc(bx, by, 20, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(bx, by, 13, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#1e293b';
                ctx.font = 'bold 15px Arial';
                ctx.fillText(ball.val, bx, by);

                // Same-position golden border glow
                if (isPosMatch) {
                    ctx.strokeStyle = '#fbbf24';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(bx, by, 22, 0, Math.PI * 2);
                    ctx.stroke();
                }
            } else {
                // Empty slot outline
                ctx.strokeStyle = 'rgba(255,255,255,0.15)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(bx, by, 18, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        // 4. State Dependent Drawings (SELECTION grid vs SUMMARY details)
        if (this.state === 'SELECTION') {
            // Draw 40-Number grid
            let gridX = centerX - 188;
            let gridY = 320;
            let boxSize = 38;
            let boxSpacing = 9;

            // Draw header / select count
            ctx.fillStyle = '#fef08a';
            ctx.font = 'bold 16px Arial';
            ctx.fillText(`בחר 6 מספרים לטופס שלך (${this.selectedNumbers.length} / 6)`, centerX, 220);

            // Draw selection grid
            this.gridNumbers.forEach((num, idx) => {
                let col = idx % 8;
                let row = Math.floor(idx / 8);
                let bx = gridX + col * (boxSize + boxSpacing);
                let by = gridY + row * (boxSize + boxSpacing);

                let isSelected = this.selectedNumbers.includes(num);

                ctx.fillStyle = isSelected ? '#a855f7' : 'rgba(255, 255, 255, 0.1)'; // Purple selected
                ctx.strokeStyle = isSelected ? '#c084fc' : 'rgba(255, 255, 255, 0.2)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.roundRect(bx, by, boxSize, boxSize, 6);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 15px Arial';
                ctx.fillText(num, bx + boxSize / 2, by + boxSize / 2);
            });

            // Draw Quick Pick & Submit Buttons
            let buttonY = 250;
            let buttonW = 150;
            let buttonH = 36;

            // Quick Pick ⚡
            ctx.fillStyle = '#eab308'; // Gold
            ctx.beginPath();
            ctx.roundRect(centerX - 165, buttonY, buttonW, buttonH, 18);
            ctx.fill();
            ctx.fillStyle = '#1e293b';
            ctx.font = 'bold 14px Arial';
            ctx.fillText('⚡ מילוי אוטומטי', centerX - 90, buttonY + buttonH / 2);

            // Submit 🎟️
            let canSubmit = this.selectedNumbers.length === 6;
            ctx.fillStyle = canSubmit ? '#10b981' : '#475569'; // Green if ready
            ctx.beginPath();
            ctx.roundRect(centerX + 15, buttonY, buttonW, buttonH, 18);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px Arial';
            ctx.fillText('🎟️ שלח טופס', centerX + 90, buttonY + buttonH / 2);
        } else if (this.state === 'DRAWING' || this.state === 'SUMMARY') {
            // Draw Player's chosen ticket card
            let ticketX = centerX - 188;
            let ticketY = 240;
            let ticketW = 376;
            let ticketH = 80;

            ctx.fillStyle = '#fef08a'; // yellow card background
            ctx.strokeStyle = '#ca8a04';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.roundRect(ticketX, ticketY, ticketW, ticketH, 10);
            ctx.fill();
            ctx.stroke();

            // Header line
            ctx.fillStyle = '#ca8a04';
            ctx.fillRect(ticketX + 2, ticketY + 2, ticketW - 4, 18);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px Arial';
            ctx.fillText('הכרטיס שלך (Matches in green, same position in gold!)', centerX, ticketY + 11);

            // Draw chosen numbers inside card
            let numCols = 6;
            let boxW = 44;
            let boxH = 40;
            let boxSpacing = 12;
            let startBoxX = ticketX + (ticketW - (numCols * boxW + (numCols - 1) * boxSpacing)) / 2;

            this.selectedNumbers.forEach((val, idx) => {
                let bx = startBoxX + idx * (boxW + boxSpacing);
                let by = ticketY + 30;

                // Match checking states
                let hasBeenDrawn = this.drawnBalls.some(b => b.val === val);
                let isPosMatch = this.winningNumbers[idx] === val && this.drawnBalls.length > idx;

                ctx.fillStyle = isPosMatch ? '#d97706' : (hasBeenDrawn ? '#22c55e' : '#ffffff');
                ctx.strokeStyle = isPosMatch ? '#fbbf24' : (hasBeenDrawn ? '#15803d' : '#cbd5e1');
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.roundRect(bx, by, boxW, boxH, 6);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = (hasBeenDrawn || isPosMatch) ? '#ffffff' : '#334155';
                ctx.font = 'bold 18px Arial';
                ctx.fillText(val, bx + boxW / 2, by + boxH / 2);
            });

            // SUMMARY overlay popup
            if (this.state === 'SUMMARY') {
                let popupY = 345;
                let popupW = 320;
                let popupH = 195;
                let popupX = centerX - popupW / 2;

                ctx.fillStyle = '#1e293b'; // slate-800
                ctx.strokeStyle = '#475569';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.roundRect(popupX, popupY, popupW, popupH, 12);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 20px Arial';
                ctx.fillText('🏆 תוצאות ההגרלה 🏆', centerX, popupY + 26);

                ctx.font = '14px Arial';
                ctx.textAlign = 'left';
                let tx = popupX + 30;
                ctx.fillText(`פגיעות בסיבוב זה: ${this.roundMatches} / 6`, tx, popupY + 54);
                ctx.fillText(`בונוס מיקום: ${this.roundPositionMatches} פגיעות ($${this.roundPositionMatches * 120})`, tx, popupY + 76);
                ctx.fillText(`סך זכייה: $${this.roundCashWon}`, tx, popupY + 98);
                
                // Show cumulative progress info
                let nextTicketMatchesNeeded = 2 - (this.totalMatchesAccumulated % 2);
                ctx.fillStyle = '#fbbf24';
                ctx.fillText(`כרטיסי בונוס שהרווחת: 🎟️ +${this.roundTicketsEarned}`, tx, popupY + 120);
                
                ctx.fillStyle = '#38bdf8'; // light blue sky
                ctx.fillText(`עוד ${nextTicketMatchesNeeded} פגיעות כוללות לכרטיס הבא!`, tx, popupY + 142);

                // Play Again / Next Draw Button
                ctx.textAlign = 'center';
                if (this.lives > 0) {
                    ctx.fillStyle = '#8b5cf6'; // Purple button
                    ctx.beginPath();
                    ctx.roundRect(centerX - 80, popupY + 156, 160, 30, 15);
                    ctx.fill();
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 13px Arial';
                    ctx.fillText('סבב הבא 🔄', centerX, popupY + 175);
                } else {
                    // Out of tickets - Game Over
                    ctx.fillStyle = '#ef4444';
                    ctx.beginPath();
                    ctx.roundRect(centerX - 85, popupY + 156, 170, 30, 15);
                    ctx.fill();
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 12px Arial';
                    ctx.fillText('נגמרו הכרטיסים! ❌', centerX, popupY + 175);

                    if (!this.gameOverTriggered) {
                        this.gameOverTriggered = true;
                        setTimeout(() => {
                            UI.endGame("התרוששת! 💸🎲", `סיימת את הגרלות הלוטו עם סך הכל $${this.score} בארנק!`);
                        }, 2200);
                    }
                }
            }
        }

        ctx.restore();
    }

    handleInput(type, details) {
        if (type !== 'mousedown') return;
        
        let cx = details.x;
        let cy = details.y;
        const canvasW = GameState.canvas.width;
        const centerX = canvasW / 2;

        if (this.state === 'SELECTION') {
            // 1. Check numbers grid clicks
            let gridX = centerX - 188;
            let gridY = 320;
            let boxSize = 38;
            let boxSpacing = 9;

            for (let i = 0; i < this.gridNumbers.length; i++) {
                let num = this.gridNumbers[i];
                let col = i % 8;
                let row = Math.floor(i / 8);
                let bx = gridX + col * (boxSize + boxSpacing);
                let by = gridY + row * (boxSize + boxSpacing);

                if (cx >= bx && cx <= bx + boxSize && cy >= by && cy <= by + boxSize) {
                    // Clicked a grid number!
                    if (this.selectedNumbers.includes(num)) {
                        // Deselect
                        this.selectedNumbers = this.selectedNumbers.filter(val => val !== num);
                    } else if (this.selectedNumbers.length < 6) {
                        // Select
                        this.selectedNumbers.push(num);
                        this.selectedNumbers.sort((a, b) => a - b);
                    }
                    break;
                }
            }

            // 2. Check Quick Pick button click
            // Button is at centerX - 165, Y = 250, W = 150, H = 36
            if (cx >= centerX - 165 && cx <= centerX - 15 && cy >= 250 && cy <= 286) {
                this.quickPick();
            }

            // 3. Check Submit Ticket button click
            // Button is at centerX + 15, Y = 250, W = 150, H = 36
            if (cx >= centerX + 15 && cx <= centerX + 165 && cy >= 250 && cy <= 286) {
                this.submitTicket();
            }
        } else if (this.state === 'SUMMARY') {
            // Check Play Again button click
            // Button is at centerX - 80, Y = 345 + 156 = 501, W = 160, H = 30
            if (this.lives > 0 && cx >= centerX - 80 && cx <= centerX + 80 && cy >= 501 && cy <= 531) {
                // Reset for next draw
                this.state = 'SELECTION';
                this.selectedNumbers = [];
                this.winningNumbers = [];
                this.drawnBalls = [];
                this.gameOverTriggered = false;
            }
        }
    }

    destroy() {
        this.machineBalls = [];
        this.drawnRack = [];
        this.winningNumbers = [];
    }
}
