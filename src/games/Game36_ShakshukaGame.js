import { MiniGame } from './MiniGame.js';
import { GameState } from '../core/GameState.js';
import { UI } from '../core/UI.js';

export class Game36_ShakshukaGame extends MiniGame {
    init(difficulty) {
        UI.screens.container.className = 'relative w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-3xl sm:shadow-2xl overflow-hidden bg-rose-950';

        this.score = 0;
        this.lives = 1; // Only 1 chance to season correctly!
        this.time = 15; // 15 seconds per seasoning step
        this.difficulty = difficulty;

        // Stage: 1 = Paprika, 2 = Salt, 3 = Eggs
        this.stage = 1;
        this.shakshukasCooked = 0; // 0 = first, 1 = second (harder)
        this.needleTime = 0;
        this.isStopped = false;
        this.stopTimer = 0;
        this.isWin = false;
        this.isFail = false;
        this.failReason = '';

        // Ingredient visual flags
        this.hasPaprika = false;
        this.hasSalt = false;
        this.hasEggs = false;

        // Animation states
        this.bubbles = [];
        for (let i = 0; i < 8; i++) {
            this.bubbles.push({
                x: 0, y: 0,
                baseX: 0, baseY: 0,
                r: Math.random() * 8 + 6,
                speed: Math.random() * 2 + 1,
                offset: Math.random() * Math.PI * 2
            });
        }

        // Flame and salt height for fail animations
        this.flameHeight = 0;
        this.saltPileHeight = 0;
        this.eggDropY = 0;

        // Needle configuration based on difficulty
        if (difficulty === 'easy') {
            this.needleSpeed = 3.2; // Rad/sec
            this.greenZoneWidth = 65; // Pixels
        } else if (difficulty === 'medium') {
            this.needleSpeed = 4.8;
            this.greenZoneWidth = 42;
        } else {
            this.needleSpeed = 6.5;
            this.greenZoneWidth = 26;
        }

        this.baseNeedleSpeed = this.needleSpeed;
        this.baseGreenZoneWidth = this.greenZoneWidth;

        this.updateUI();
    }

    resize(w, h) {
        // Handle coordinate changes if needed
    }

    updateUI() {
        const statusEl = document.getElementById('g36-status');
        const livesEl = document.getElementById('g36-lives');
        
        let prefix = this.shakshukasCooked === 1 ? '🔥 חריף אש - ' : '';
        let labelText = '';
        if (this.stage === 1) labelText = prefix + '🌶️ שלב 1: הוספת פפריקה';
        else if (this.stage === 2) labelText = prefix + '🧂 שלב 2: הוספת מלח';
        else if (this.stage === 3) labelText = prefix + '🥚 שלב 3: הוספת ביצים';

        if (statusEl) statusEl.innerText = labelText;
        if (livesEl) livesEl.innerText = '❤️'.repeat(Math.max(0, this.lives));
    }

    checkResult() {
        const canvasW = GameState.canvas.width;
        const centerX = canvasW / 2;
        
        // Needle position relative to center
        let needleOffset = Math.sin(this.needleTime * this.needleSpeed) * 150;
        let isSuccess = Math.abs(needleOffset) < this.greenZoneWidth / 2;

        this.isStopped = true;
        this.stopTimer = 1.2; // Show result for 1.2 seconds before advancing/failing

        if (isSuccess) {
            UI.createPopEffect(centerX + needleOffset, 120, '✨ מעולה!', '#4ade80');
            
            // Set ingredient visibility
            if (this.stage === 1) this.hasPaprika = true;
            else if (this.stage === 2) this.hasSalt = true;
            else if (this.stage === 3) this.hasEggs = true;
        } else {
            this.isFail = true;
            this.lives = 0;
            this.updateUI();

            // Set specific fail animations
            if (needleOffset > this.greenZoneWidth / 2) {
                // Too much seasoning!
                if (this.stage === 1) {
                    this.failReason = 'paprika_over';
                } else if (this.stage === 2) {
                    this.failReason = 'salt_over';
                } else {
                    this.failReason = 'egg_miss';
                }
            } else {
                // Too little / missed
                this.failReason = 'under';
            }
        }
    }

    update(dt) {
        // Bubbles bobbing in shakshuka
        this.bubbles.forEach(b => {
            b.offset += b.speed * (dt / 1000) * 4;
        });

        if (this.isFail) {
            // Animate failures
            if (this.failReason === 'paprika_over') {
                this.flameHeight = Math.min(220, this.flameHeight + 300 * (dt / 1000));
                this.stopTimer -= dt / 1000;
                if (this.stopTimer <= 0) {
                    UI.endGame("הגזמת עם הפפריקה! 🔥🌶️", "השקשוקה חריפה מדי ועולה באש!");
                    return;
                }
            } else if (this.failReason === 'salt_over') {
                this.saltPileHeight = Math.min(70, this.saltPileHeight + 100 * (dt / 1000));
                this.stopTimer -= dt / 1000;
                if (this.stopTimer <= 0) {
                    UI.endGame("מלוח מדי! 🧂🤢", "שפכת חצי קילו מלח לתוך המחבת.");
                    return;
                }
            } else if (this.failReason === 'egg_miss') {
                this.eggDropY += 400 * (dt / 1000);
                this.stopTimer -= dt / 1000;
                if (this.stopTimer <= 0) {
                    UI.endGame("הביצה התרסקה! 🥚💥", "פספסת את המחבת והביצה נשברה על הרצפה.");
                    return;
                }
            } else {
                // Under seasoned
                this.stopTimer -= dt / 1000;
                if (this.stopTimer <= 0) {
                    UI.endGame("תפל לחלוטין! 🍲🤢", "השקשוקה יצאה ללא תבלינים ובטעם מים.");
                    return;
                }
            }
            return;
        }

        if (this.isStopped) {
            this.stopTimer -= dt / 1000;
            if (this.stopTimer <= 0) {
                this.isStopped = false;
                this.stage++;
                this.time = 15; // Reset timer for next stage
                
                if (this.stage > 3) {
                    if (this.shakshukasCooked === 0) {
                        // First shakshuka done! Move to second, harder shakshuka
                        this.shakshukasCooked = 1;
                        this.stage = 1;
                        this.time = 15;
                        this.isStopped = false;

                        // Clear visual ingredients for new pan
                        this.hasPaprika = false;
                        this.hasSalt = false;
                        this.hasEggs = false;

                        // Upgrade difficulty metrics
                        this.needleSpeed = this.baseNeedleSpeed * 1.45; // 45% faster needle
                        this.greenZoneWidth = this.baseGreenZoneWidth * 0.68; // ~30% narrower safe zone

                        // Visual transition cues
                        UI.screens.container.classList.add('bg-green-100');
                        setTimeout(() => UI.screens.container.classList.remove('bg-green-100'), 150);
                        
                        const canvasW = GameState.canvas.width;
                        UI.createPopEffect(canvasW / 2, 120, 'שקשוקה קלאסית מוכנה! עכשיו חריף אש... 🍳🔥', '#fbbf24');
                        this.updateUI();
                    } else {
                        // Both shakshukas completed
                        UI.endGame("מאסטר שקשוקה! 🍳🏆", "תיבלת את שתי השקשוקות בהצלחה מוחצת, כולל הגרסה החריפה!");
                    }
                } else {
                    this.updateUI();
                }
            }
            return;
        }

        // Active game update
        this.time -= dt / 1000;
        const timeEl = document.getElementById('g36-time');
        if (timeEl) timeEl.innerText = Math.max(0, Math.ceil(this.time));

        if (this.time <= 0) {
            UI.endGame("שרפת את השקשוקה!", "השקשוקה רתחה על האש יותר מדי זמן ונשרפה.");
            return;
        }

        // Update needle oscillation
        this.needleTime += dt / 1000;
    }

    draw(ctx) {
        const canvasW = GameState.canvas.width;
        const canvasH = GameState.canvas.height;
        const centerX = canvasW / 2;

        ctx.save();

        // 1. Draw Kitchen Table Background (Tiled kitchen walls / counter)
        ctx.fillStyle = '#4c0519'; // rose-950
        ctx.fillRect(0, 0, canvasW, canvasH);

        // Draw counter wood
        ctx.fillStyle = '#b45309';
        ctx.fillRect(0, canvasH - 180, canvasW, 180);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(0, canvasH - 180, canvasW, 8); // edge

        // 2. Draw Frying Pan
        let panX = centerX;
        let panY = canvasH - 130;
        let panRadius = 110;

        // Pan Handle (wood and metal)
        ctx.strokeStyle = '#27272a';
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.moveTo(panX, panY);
        ctx.lineTo(panX - 190, panY + 70);
        ctx.stroke();

        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(panX - 100, panY + 36);
        ctx.lineTo(panX - 185, panY + 68);
        ctx.stroke();

        // Outer pan rim
        ctx.fillStyle = '#1c1917'; // dark stone
        ctx.beginPath();
        ctx.arc(panX, panY, panRadius + 8, 0, Math.PI * 2);
        ctx.fill();

        // Inner pan surface (bubbling shakshuka sauce)
        ctx.fillStyle = '#991b1b'; // Red tomato sauce
        ctx.beginPath();
        ctx.arc(panX, panY, panRadius, 0, Math.PI * 2);
        ctx.fill();

        // Bubbling circles
        ctx.fillStyle = '#b91c1c';
        this.bubbles.forEach((b, i) => {
            let angle = b.offset;
            let dist = (panRadius - 20) * (0.1 + 0.08 * (i % 5));
            let bx = panX + Math.cos(angle) * dist;
            let by = panY + Math.sin(angle) * dist;
            ctx.beginPath();
            ctx.arc(bx, by, b.r, 0, Math.PI * 2);
            ctx.fill();
        });

        // 3. Draw added ingredients based on completed stages
        // Draw Paprika (red dots)
        if (this.hasPaprika) {
            ctx.fillStyle = '#ef4444';
            for (let i = 0; i < 40; i++) {
                let rx = panX + (Math.sin(i * 3) * 60);
                let ry = panY + (Math.cos(i * 5) * 60);
                ctx.fillRect(rx, ry, 3, 3);
            }
        }

        // Draw Salt (white dots)
        if (this.hasSalt) {
            ctx.fillStyle = '#ffffff';
            for (let i = 0; i < 40; i++) {
                let rx = panX + (Math.sin(i * 7) * 70);
                let ry = panY + (Math.cos(i * 11) * 70);
                ctx.fillRect(rx, ry, 3, 3);
            }
        }

        // Draw Eggs
        if (this.hasEggs) {
            let eggPos = [{ x: -30, y: -20 }, { x: 30, y: 15 }];
            eggPos.forEach(pos => {
                // Egg white
                ctx.fillStyle = 'rgba(255,255,255,0.85)';
                ctx.beginPath();
                ctx.arc(panX + pos.x, panY + pos.y, 20, 0, Math.PI * 2);
                ctx.fill();

                // Egg yolk
                ctx.fillStyle = '#fbbf24';
                ctx.beginPath();
                ctx.arc(panX + pos.x - 2, panY + pos.y - 2, 8, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        // 4. Draw Fail Animations
        if (this.isFail) {
            if (this.failReason === 'paprika_over') {
                // Draw flames rising from the pan
                ctx.fillStyle = '#f97316'; // orange
                for (let i = 0; i < 8; i++) {
                    let fx = panX + (Math.sin(i * 4) * 60);
                    ctx.beginPath();
                    ctx.moveTo(fx, panY);
                    ctx.quadraticCurveTo(fx - 20, panY - this.flameHeight / 2, fx, panY - this.flameHeight);
                    ctx.quadraticCurveTo(fx + 20, panY - this.flameHeight / 2, fx + 15, panY);
                    ctx.closePath();
                    ctx.fill();
                }
            } else if (this.failReason === 'salt_over') {
                // Draw mountain of salt
                ctx.fillStyle = '#e2e8f0';
                ctx.beginPath();
                ctx.moveTo(panX - 60, panY + 20);
                ctx.lineTo(panX, panY - this.saltPileHeight);
                ctx.lineTo(panX + 60, panY + 20);
                ctx.closePath();
                ctx.fill();
            } else if (this.failReason === 'egg_miss') {
                // Draw egg falling/dripping on the floor
                ctx.fillStyle = 'rgba(255,255,255,0.85)';
                ctx.beginPath();
                ctx.arc(panX - 130, panY + this.eggDropY, 15, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fbbf24';
                ctx.beginPath();
                ctx.arc(panX - 130, panY + this.eggDropY, 6, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // 5. Draw Precision Gauge (needle moving)
        let gaugeY = 160;
        let gaugeW = 300;
        let startX = centerX - gaugeW / 2;

        // Gauge background bar
        ctx.fillStyle = '#1e293b';
        ctx.roundRect(startX, gaugeY - 15, gaugeW, 30, 8);
        ctx.fill();

        // Target Zone (Green) in the center
        ctx.fillStyle = '#22c55e'; // Green
        ctx.fillRect(centerX - this.greenZoneWidth / 2, gaugeY - 15, this.greenZoneWidth, 30);

        // Highlight center line
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(centerX, gaugeY - 15);
        ctx.lineTo(centerX, gaugeY + 15);
        ctx.stroke();

        // Draw scale indicator icons (🌶️ / 🧂 / 🥚) based on current stage
        let activeEmoji = this.stage === 1 ? '🌶️' : (this.stage === 2 ? '🧂' : '🥚');
        ctx.font = '28px Arial';
        ctx.fillText(activeEmoji, startX - 35, gaugeY);

        // Needle position
        let needleX = centerX + Math.sin(this.needleTime * this.needleSpeed) * 140;

        // Draw needle indicator
        ctx.strokeStyle = '#ef4444'; // Red pointer line
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(needleX, gaugeY - 22);
        ctx.lineTo(needleX, gaugeY + 22);
        ctx.stroke();

        // Draw top pointing triangle for needle
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(needleX - 6, gaugeY - 22);
        ctx.lineTo(needleX + 6, gaugeY - 22);
        ctx.lineTo(needleX, gaugeY - 14);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    handleInput(type, details) {
        if (type === 'mousedown' || (type === 'keydown' && (details.key === ' ' || details.key === 'Enter'))) {
            if (!this.isStopped && !this.isFail) {
                this.checkResult();
            }
        }
    }

    destroy() {
        this.bubbles = [];
    }
}
