import { MiniGame } from './MiniGame.js';
import { GameState } from '../core/GameState.js';
import { UI } from '../core/UI.js';

export class Game35_ClinicGame extends MiniGame {
    init(difficulty) {
        UI.screens.container.className = 'relative w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-3xl sm:shadow-2xl overflow-hidden bg-emerald-950';

        this.score = 0;
        this.lives = 3;
        this.time = 45;
        this.difficulty = difficulty;

        this.entities = [];
        this.spawnTimer = 0.5; // Spawn first guest soon
        this.shakeTimer = 0;

        // Difficulty balancing (Harder configuration)
        if (difficulty === 'easy') {
            this.spawnRate = 1.6;
            this.speedMult = 1.25;
            this.trickChance = 0.0;
        } else if (difficulty === 'medium') {
            this.spawnRate = 1.0;
            this.speedMult = 1.65;
            this.trickChance = 0.28;
        } else {
            this.spawnRate = 0.65;
            this.speedMult = 2.15;
            this.trickChance = 0.42;
        }

        this.updateUI();
    }

    resize(w, h) {
    }

    updateUI() {
        const scoreEl = document.getElementById('g35-score');
        const livesEl = document.getElementById('g35-lives');
        if (scoreEl) scoreEl.innerText = this.score;
        if (livesEl) livesEl.innerText = '❤️'.repeat(Math.max(0, this.lives));
    }

    spawnEntity() {
        const canvasW = GameState.canvas ? GameState.canvas.width : 800;
        const canvasH = GameState.canvas ? GameState.canvas.height : 600;

        let isTrick = Math.random() < this.trickChance;
        let entity = {};

        if (isTrick) {
            // Authorized person to NOT block
            let rand = Math.random();
            let emoji = '🧑‍⚕️'; // default nurse
            let name = 'nurse';
            if (rand < 0.33) {
                emoji = '🥼'; // doctor
                name = 'doctor';
            } else if (rand < 0.66) {
                emoji = '🍠'; // patient with turn
                name = 'patient';
            }
            
            entity = {
                x: -50,
                y: canvasH / 2 + 50 + (Math.random() * 40 - 20),
                // Walk at similar speed to cutters to make it tricky!
                vx: (Math.random() * 90 + 90) * this.speedMult,
                emoji: emoji,
                size: 50,
                isCutter: false,
                name: name,
                clicksRequired: 1,
                state: 'WALKING'
            };
        } else {
            // Line cutter to BLOCK
            let rand = Math.random();
            let emoji = '🧅'; // Onion
            let vx = (Math.random() * 120 + 100) * this.speedMult;
            let clicks = 1;
            let size = 48;

            if (rand < 0.33) {
                emoji = '🍆'; // Eggplant (tanky, 2 or 3 clicks)
                vx = (Math.random() * 60 + 50) * this.speedMult;
                clicks = this.difficulty === 'easy' ? 1 : (this.difficulty === 'medium' ? 2 : 3);
                size = 55;
            } else if (rand < 0.66) {
                emoji = '🍅'; // Tomato (normal)
                vx = (Math.random() * 90 + 80) * this.speedMult;
                size = 46;
            }

            entity = {
                x: -50,
                y: canvasH / 2 + 50 + (Math.random() * 40 - 20),
                vx: vx,
                emoji: emoji,
                size: size,
                isCutter: true,
                clicksRequired: clicks,
                clicksReceived: 0,
                state: 'WALKING',
                angryTimer: 0
            };
        }

        this.entities.push(entity);
    }

    update(dt) {
        this.time -= dt / 1000;
        this.updateUI();

        if (this.time <= 0) {
            UI.endGame("התור הסתיים!", `הצלחת לחסום ${this.score} עוקפי תור קשוחים!`);
            return;
        }

        if (this.shakeTimer > 0) {
            this.shakeTimer -= dt / 1000;
        }

        const canvasW = GameState.canvas ? GameState.canvas.width : 800;

        // Spawn logic
        this.spawnTimer -= dt / 1000;
        if (this.spawnTimer <= 0) {
            this.spawnEntity();
            this.spawnTimer = this.spawnRate + Math.random() * 0.8;
        }

        // Update entities
        for (let i = this.entities.length - 1; i >= 0; i--) {
            let ent = this.entities[i];

            if (ent.angryTimer > 0) {
                ent.angryTimer -= dt / 1000;
            }

            if (ent.state === 'WALKING') {
                ent.x += ent.vx * (dt / 1000);

                // Reached the Doctor's door (Door is around x = canvasW - 130)
                if (ent.x >= canvasW - 140) {
                    if (ent.isCutter) {
                        // Slipped in! Lose a life
                        this.lives--;
                        this.updateUI();
                        this.shakeTimer = 0.2;
                        UI.screens.container.classList.add('shake');
                        setTimeout(() => UI.screens.container.classList.remove('shake'), 200);

                        UI.createPopEffect(canvasW - 120, ent.y - 20, '🚪💥 עקף!');
                        
                        if (this.lives <= 0) {
                            UI.endGame("התור קרס! 🚪", "עוקפי התור השתלטו על המרפאה.");
                            return;
                        }
                    } else {
                        // Authorized entered safely!
                        UI.createPopEffect(canvasW - 120, ent.y - 20, '🩺 כנס', '#22c55e');
                    }
                    this.entities.splice(i, 1);
                    continue;
                }
            } else if (ent.state === 'BLOCKED') {
                // Walk backwards to the left offscreen
                ent.x -= (ent.vx * 1.5) * (dt / 1000);
                if (ent.x < -80) {
                    this.entities.splice(i, 1);
                }
            }
        }
    }

    draw(ctx) {
        const canvasW = GameState.canvas.width;
        const canvasH = GameState.canvas.height;
        const doorX = canvasW - 120;
        const doorY = canvasH / 2 + 50;

        ctx.save();

        // 1. Draw Clinic Wall Background (light teal)
        let wallGrad = ctx.createLinearGradient(0, 0, 0, canvasH);
        wallGrad.addColorStop(0, '#042f1a'); // dark emerald
        wallGrad.addColorStop(1, '#064e3b'); // emerald-900
        ctx.fillStyle = wallGrad;
        ctx.fillRect(0, 0, canvasW, canvasH);

        // Draw waiting chairs in the background
        ctx.fillStyle = '#1e293b'; // slate-800
        ctx.fillRect(50, doorY + 60, 240, 10);
        ctx.fillStyle = '#475569';
        for (let x = 65; x < 280; x += 65) {
            ctx.fillRect(x, doorY + 15, 40, 45); // chair back
        }

        // Draw wooden floor
        ctx.fillStyle = '#b45309'; // brown
        ctx.fillRect(0, doorY + 70, canvasW, canvasH - (doorY + 70));

        // 2. Draw Doctor's Room Door
        ctx.fillStyle = '#78350f'; // brown wood
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.roundRect(doorX - 35, doorY - 110, 70, 170, [8, 8, 0, 0]);
        ctx.fill();
        ctx.stroke();

        // Door knob
        ctx.fillStyle = '#fbbf24'; // brass
        ctx.beginPath();
        ctx.arc(doorX + 22, doorY - 20, 6, 0, Math.PI * 2);
        ctx.fill();

        // Doctor sign on door
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(doorX - 20, doorY - 80, 40, 20);
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('ד"ר בטטה', doorX, doorY - 67);

        // Doctor light indicator above door
        let hasCuttersNearby = this.entities.some(e => e.isCutter && e.x > doorX - 250);
        ctx.fillStyle = hasCuttersNearby ? '#ef4444' : '#22c55e'; // Red warning light if cutters close
        ctx.beginPath();
        ctx.arc(doorX, doorY - 130, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 3;
        ctx.stroke();

        // 3. Draw Guard Potato
        ctx.font = '65px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Shake guard slightly if container is shaking
        let guardShake = this.shakeTimer > 0 ? (Math.random() * 6 - 3) : 0;
        ctx.fillText('🍠', doorX - 60 + guardShake, doorY + 25);
        ctx.font = '22px Arial';
        ctx.fillText('👮', doorX - 60 + guardShake, doorY - 18); // guard hat

        // 4. Draw Characters (Walking / Running)
        this.entities.forEach(ent => {
            ctx.save();
            ctx.translate(ent.x, ent.y);

            // Flip sprite when running away
            if (ent.state === 'BLOCKED') {
                ctx.scale(-1, 1);
            }

            // Draw character
            ctx.font = `${ent.size}px Arial`;
            ctx.fillText(ent.emoji, 0, 0);

            // Draw anger bubbles for line cutters
            if (ent.isCutter && ent.angryTimer > 0) {
                ctx.font = '22px Arial';
                ctx.fillText('💢', 20, -30);
            }

            // Draw shields or hp indicators for eggplant (2-hit)
            if (ent.isCutter && ent.clicksRequired > 1 && ent.state === 'WALKING') {
                let hp = ent.clicksRequired - ent.clicksReceived;
                ctx.fillStyle = '#3b82f6'; // Blue shield indicator
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.roundRect(-20, -ent.size / 2 - 12, 40, 8, 4);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = '#ef4444';
                ctx.fillRect(-18, -ent.size / 2 - 10, 36 * (hp / ent.clicksRequired), 4);
            }

            ctx.restore();
        });

        ctx.restore();
    }

    handleInput(type, details) {
        if (type === 'mousedown') {
            // Check if player clicked on any character to block them
            let cx = details.x;
            let cy = details.y;

            for (let i = 0; i < this.entities.length; i++) {
                let ent = this.entities[i];
                if (ent.state !== 'WALKING') continue;

                // Click boundary check
                let dx = Math.abs(cx - ent.x);
                let dy = Math.abs(cy - ent.y);

                if (dx < ent.size / 2 + 15 && dy < ent.size / 2 + 15) {
                    // Clicked on entity!
                    if (ent.isCutter) {
                        ent.clicksReceived++;
                        ent.angryTimer = 0.8;
                        
                        UI.createPopEffect(ent.x, ent.y - 20, '✋ חסום!', '#fbbf24');
                        
                        if (ent.clicksReceived >= ent.clicksRequired) {
                            ent.state = 'BLOCKED';
                            this.score++;
                            this.updateUI();
                        }
                    } else {
                        // Clicked an authorized doctor/nurse/patient! Oops!
                        this.lives--;
                        this.updateUI();
                        ent.state = 'BLOCKED'; // they storm out angry
                        
                        UI.createPopEffect(ent.x, ent.y - 20, '💥 אוי! זה הדוקטור!', '#f87171');
                        UI.screens.container.classList.add('shake');
                        setTimeout(() => UI.screens.container.classList.remove('shake'), 200);

                        if (this.lives <= 0) {
                            UI.endGame("הרופא פוטר! 🥼", "חסמת את הצוות הרפואי יותר מדי פעמים.");
                            return;
                        }
                    }
                    break; // Only hit one character per click
                }
            }
        }
    }

    destroy() {
        this.entities = [];
    }
}
