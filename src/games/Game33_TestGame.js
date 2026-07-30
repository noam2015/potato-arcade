import { MiniGame } from './MiniGame.js';
import { GameState } from '../core/GameState.js';
import { UI } from '../core/UI.js';

export class Game33_TestGame extends MiniGame {
    init(difficulty) {
        UI.screens.container.className = 'relative w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-3xl sm:shadow-2xl overflow-hidden bg-zinc-800';

        this.score = 0;
        this.lives = 3;
        this.difficulty = difficulty;

        // Stages: 1 = Headlight, 2 = Emissions, 3 = Front Alignment
        this.stage = 1;
        this.stageTime = 15; // 15 seconds per stage
        this.stageProgress = 0; // 0 to 100%

        // Stage 1 config: Headlight
        this.s1TargetY = 200;
        this.s1TargetDir = 1;
        this.s1PlayerY = 250;
        this.s1TargetSpeed = difficulty === 'easy' ? 100 : (difficulty === 'medium' ? 180 : 250);

        // Stage 2 config: Emissions
        this.s2NeedleVal = 0; // -100 to 100
        this.s2Drift = difficulty === 'easy' ? 90 : (difficulty === 'medium' ? 140 : 200);

        // Stage 3 config: Wheel Alignment
        this.s3CarX = GameState.canvas ? GameState.canvas.width / 2 : 400;
        this.s3RoadOffset = 0;
        this.s3RoadSpeed = difficulty === 'easy' ? 2 : (difficulty === 'medium' ? 3.5 : 5);

        this.updateUI();
    }

    resize(w, h) {
        if (this.stage === 3) {
            this.s3CarX = Math.max(80, Math.min(w - 80, this.s3CarX));
        }
    }

    updateUI() {
        const statusEl = document.getElementById('g33-status');
        const timeEl = document.getElementById('g33-time');
        
        let IsraelStageName = '';
        if (this.stage === 1) IsraelStageName = `שלב 1: כיוון פנסים (${Math.floor(this.stageProgress)}%)`;
        else if (this.stage === 2) IsraelStageName = `שלב 2: בדיקת זיהום (${Math.floor(this.stageProgress)}%)`;
        else if (this.stage === 3) IsraelStageName = `שלב 3: כיוון פרונט (${Math.floor(this.stageProgress)}%)`;

        if (statusEl) statusEl.innerText = IsraelStageName;
        if (timeEl) timeEl.innerText = Math.max(0, Math.ceil(this.stageTime));
    }

    nextStage() {
        this.stageProgress = 0;
        this.stageTime = 15;
        this.stage++;
        
        // Show success flash
        UI.screens.container.classList.add('bg-green-900');
        setTimeout(() => UI.screens.container.classList.remove('bg-green-900'), 150);
        
        if (this.stage > 3) {
            UI.endGame("עברת טסט! 🚗🎉", "הבטטה-מוביל מאושרת רשמית לשנה הקרובה!");
        } else {
            this.updateUI();
        }
    }

    failTest(msg = "נכשלת בטסט!") {
        UI.endGame("נכשלת בטסט! ❌", msg);
    }

    update(dt) {
        this.stageTime -= dt / 1000;
        this.updateUI();

        if (this.stageTime <= 0) {
            this.failTest("נגמר הזמן ולא סיימת את הבדיקה.");
            return;
        }

        const canvasW = GameState.canvas ? GameState.canvas.width : 800;
        const canvasH = GameState.canvas ? GameState.canvas.height : 600;

        // Stage 1: Headlight Alignment
        if (this.stage === 1) {
            this.s1TargetY += this.s1TargetDir * this.s1TargetSpeed * (dt / 1000);
            if (this.s1TargetY > canvasH - 120) {
                this.s1TargetY = canvasH - 120;
                this.s1TargetDir = -1;
            } else if (this.s1TargetY < 120) {
                this.s1TargetY = 120;
                this.s1TargetDir = 1;
            }

            let diff = Math.abs(this.s1PlayerY - this.s1TargetY);
            if (diff < 40) {
                this.stageProgress += 45 * (dt / 1000);
                if (this.stageProgress >= 100) {
                    this.nextStage();
                }
            } else {
                this.stageProgress = Math.max(0, this.stageProgress - 15 * (dt / 1000));
            }
        }

        // Stage 2: Emissions Test
        else if (this.stage === 2) {
            this.s2NeedleVal -= this.s2Drift * (dt / 1000);
            this.s2NeedleVal = Math.max(-100, Math.min(100, this.s2NeedleVal));

            if (this.s2NeedleVal >= -22 && this.s2NeedleVal <= 22) {
                this.stageProgress += 30 * (dt / 1000);
                if (this.stageProgress >= 100) {
                    this.nextStage();
                }
            } else {
                this.stageProgress = Math.max(0, this.stageProgress - 10 * (dt / 1000));
            }
        }

        // Stage 3: Wheel Alignment
        else if (this.stage === 3) {
            this.s3RoadOffset += this.s3RoadSpeed * (dt / 1000);

            let carY = canvasH - 120;
            let roadCenter = canvasW / 2 + Math.sin(this.s3RoadOffset) * (canvasW * 0.22);
            
            let roadWidth = 140;
            let distance = Math.abs(this.s3CarX - roadCenter);

            if (distance < roadWidth / 2) {
                this.stageProgress += 25 * (dt / 1000);
                if (this.stageProgress >= 100) {
                    this.nextStage();
                }
            } else {
                this.stageProgress = Math.max(0, this.stageProgress - 25 * (dt / 1000));
                UI.screens.container.classList.add('shake');
                setTimeout(() => UI.screens.container.classList.remove('shake'), 100);
            }
        }
    }

    draw(ctx) {
        const canvasW = GameState.canvas.width;
        const canvasH = GameState.canvas.height;

        ctx.save();
        ctx.fillStyle = '#27272a';
        ctx.fillRect(0, 0, canvasW, canvasH);

        ctx.fillStyle = '#18181b';
        ctx.roundRect(40, canvasH - 45, canvasW - 80, 20, 10);
        ctx.fill();

        ctx.fillStyle = '#eab308';
        ctx.roundRect(42, canvasH - 43, (canvasW - 84) * (this.stageProgress / 100), 16, 8);
        ctx.fill();

        if (this.stage === 1) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('כוון את אלומת האור אל מרכז העיגול!', canvasW / 2, 110);

            ctx.font = '70px Arial';
            ctx.fillText('🚙', 120, this.s1PlayerY + 10);
            
            let beamColor = Math.abs(this.s1PlayerY - this.s1TargetY) < 40 ? 'rgba(234, 179, 8, 0.4)' : 'rgba(250, 204, 21, 0.15)';
            ctx.fillStyle = beamColor;
            ctx.beginPath();
            ctx.moveTo(170, this.s1PlayerY - 10);
            ctx.lineTo(canvasW - 150, this.s1TargetY - 20);
            ctx.lineTo(canvasW - 150, this.s1TargetY + 20);
            ctx.lineTo(170, this.s1PlayerY + 15);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = '#3f3f46';
            ctx.lineWidth = 12;
            ctx.beginPath();
            ctx.moveTo(canvasW - 150, 80);
            ctx.lineTo(canvasW - 150, canvasH - 100);
            ctx.stroke();

            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(canvasW - 150, this.s1TargetY, 30, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(canvasW - 150, this.s1TargetY, 8, 0, Math.PI * 2);
            ctx.fill();
        }

        else if (this.stage === 2) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('לחץ שוב ושוב כדי להשאיר את המחוג באזור הירוק!', canvasW / 2, 110);

            let gaugeX = canvasW / 2;
            let gaugeY = canvasH / 2 + 30;
            let radius = 120;

            ctx.fillStyle = '#18181b';
            ctx.beginPath();
            ctx.arc(gaugeX, gaugeY, radius, Math.PI, 0);
            ctx.fill();

            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 15;
            ctx.beginPath();
            ctx.arc(gaugeX, gaugeY, radius - 15, Math.PI, Math.PI * 1.35);
            ctx.stroke();

            ctx.strokeStyle = '#22c55e';
            ctx.beginPath();
            ctx.arc(gaugeX, gaugeY, radius - 15, Math.PI * 1.38, Math.PI * 1.62);
            ctx.stroke();

            ctx.strokeStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(gaugeX, gaugeY, radius - 15, Math.PI * 1.65, Math.PI * 2.0);
            ctx.stroke();

            let smokeSize = 30 + (this.s2NeedleVal + 100) * 0.35;
            ctx.font = `${smokeSize}px Arial`;
            ctx.fillText('💨', gaugeX - 180, gaugeY + 40);

            ctx.font = '55px Arial';
            ctx.fillText('🚙', gaugeX - 250, gaugeY + 40);

            let needleAngle = Math.PI * 1.5 + (this.s2NeedleVal / 100) * (Math.PI * 0.45);
            
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(gaugeX, gaugeY);
            ctx.lineTo(gaugeX + Math.cos(needleAngle) * (radius - 20), gaugeY + Math.sin(needleAngle) * (radius - 20));
            ctx.stroke();

            ctx.fillStyle = '#e4e4e7';
            ctx.beginPath();
            ctx.arc(gaugeX, gaugeY, 10, 0, Math.PI * 2);
            ctx.fill();
        }

        else if (this.stage === 3) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('שמור על הבטטה-מוביל בתוך הנתיב!', canvasW / 2, 110);

            ctx.strokeStyle = '#4b5563';
            ctx.lineWidth = 140;
            ctx.beginPath();
            
            let roadPoints = [];
            for (let y = 100; y < canvasH; y += 10) {
                let factor = this.s3RoadOffset + (canvasH - y) * 0.006;
                let rx = canvasW / 2 + Math.sin(factor) * (canvasW * 0.22);
                roadPoints.push({ x: rx, y: y });
            }

            ctx.moveTo(roadPoints[0].x, roadPoints[0].y);
            for (let i = 1; i < roadPoints.length; i++) {
                ctx.lineTo(roadPoints[i].x, roadPoints[i].y);
            }
            ctx.stroke();

            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 4;
            ctx.setLineDash([15, 15]);
            ctx.beginPath();
            ctx.moveTo(roadPoints[0].x, roadPoints[0].y);
            for (let i = 1; i < roadPoints.length; i++) {
                ctx.lineTo(roadPoints[i].x, roadPoints[i].y);
            }
            ctx.stroke();
            ctx.setLineDash([]);

            let carY = canvasH - 120;
            ctx.font = '65px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🚙', this.s3CarX, carY);
        }

        ctx.restore();
    }

    handleInput(type, details) {
        if (this.stage === 1) {
            if (type === 'mousedown' || type === 'mousemove') {
                this.s1PlayerY = Math.max(80, Math.min(GameState.canvas.height - 120, details.y));
            }
            if (type === 'keydown') {
                if (details.key === 'ArrowUp') this.s1PlayerY = Math.max(80, this.s1PlayerY - 20);
                if (details.key === 'ArrowDown') this.s1PlayerY = Math.min(GameState.canvas.height - 120, this.s1PlayerY + 20);
            }
        }

        else if (this.stage === 2) {
            if (type === 'keydown') {
                if (details.key === 'ArrowUp' || details.key === ' ' || details.key === 'Enter') {
                    this.s2NeedleVal = Math.min(100, this.s2NeedleVal + 16);
                }
            }
            if (type === 'mousedown') {
                this.s2NeedleVal = Math.min(100, this.s2NeedleVal + 16);
            }
        }

        else if (this.stage === 3) {
            if (type === 'mousedown' || type === 'mousemove') {
                this.s3CarX = Math.max(80, Math.min(GameState.canvas.width - 80, details.x));
            }
            if (type === 'keydown') {
                if (details.key === 'ArrowLeft' || details.key === 'a' || details.key === 'A') {
                    this.s3CarX = Math.max(80, this.s3CarX - 25);
                }
                if (details.key === 'ArrowRight' || details.key === 'd' || details.key === 'D') {
                    this.s3CarX = Math.min(GameState.canvas.width - 80, this.s3CarX + 25);
                }
            }
        }
    }

    destroy() {
    }
}
