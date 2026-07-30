import { MiniGame } from './MiniGame.js';
import { GameState } from '../core/GameState.js';
import { UI } from '../core/UI.js';

const G22_TYPES = [
    { e: '🍠', s: 10 }, 
    { e: '👑', s: 30 }, 
    { e: '💰', s: 20 }, 
    { e: '🥾', s: -10 }, 
    { e: '🗑️', s: -5 }, 
    { e: '🐟', s: -15 }
];

export class Game22_FishingGame extends MiniGame {
    init(difficulty) {
        UI.screens.container.className = 'relative w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-3xl sm:shadow-2xl overflow-hidden bg-teal-900';

        this.g22Score = 0;
        this.g22Time = 60;
        
        this.g22Hook = {
            y: 50,
            state: 'IDLE', // 'IDLE', 'DROPPING', 'RETURNING'
            speed: 600,
            caught: null
        };

        this.g22Fishes = [];
        this.g22SpawnTimer = 0;
        this.difficulty = difficulty;

        this.updateUI();
    }

    updateUI() {
        const scoreEl = document.getElementById('g22-score');
        const timeEl = document.getElementById('g22-time');
        if (scoreEl) scoreEl.innerText = this.g22Score;
        if (timeEl) timeEl.innerText = Math.max(0, Math.ceil(this.g22Time));
    }

    dropHook() {
        if (this.g22Hook.state === 'IDLE') {
            this.g22Hook.state = 'DROPPING';
        }
    }

    update(dt) {
        this.g22Time -= dt / 1000;
        this.updateUI();

        if (this.g22Time <= 0) {
            UI.endGame("נגמר הזמן!", `השגת ${this.g22Score} נקודות שלל.`);
            return;
        }

        // Spawn fishes/trash
        this.g22SpawnTimer -= dt / 1000;
        if (this.g22SpawnTimer <= 0) {
            let t = G22_TYPES[Math.floor(Math.random() * G22_TYPES.length)];
            let dir = Math.random() > 0.5 ? 1 : -1;
            
            this.g22Fishes.push({
                x: dir === 1 ? -50 : GameState.canvas.width + 50,
                y: Math.random() * (GameState.canvas.height - 200) + 150,
                vx: (Math.random() * 150 + 100) * dir,
                emoji: t.e,
                score: t.s,
                size: 40
            });
            this.g22SpawnTimer = (this.difficulty === 'easy' ? 1.0 : (this.difficulty === 'medium' ? 0.6 : 0.3));
        }

        // Move fishes
        for (let i = this.g22Fishes.length - 1; i >= 0; i--) {
            let f = this.g22Fishes[i];
            f.x += f.vx * (dt / 1000);
            if (f.x < -100 || f.x > GameState.canvas.width + 100) {
                this.g22Fishes.splice(i, 1);
            }
        }

        // Update Hook state
        if (this.g22Hook.state === 'DROPPING') {
            this.g22Hook.y += this.g22Hook.speed * (dt / 1000);
            
            // Check collision with any fish
            for (let i = this.g22Fishes.length - 1; i >= 0; i--) {
                let f = this.g22Fishes[i];
                if (Math.abs(GameState.canvas.width / 2 - f.x) < 30 && Math.abs(this.g22Hook.y - f.y) < 30) {
                    this.g22Hook.caught = f;
                    this.g22Fishes.splice(i, 1);
                    this.g22Hook.state = 'RETURNING';
                    break;
                }
            }

            // Bottom of canvas reached
            if (this.g22Hook.y > GameState.canvas.height) {
                this.g22Hook.state = 'RETURNING';
            }
        } else if (this.g22Hook.state === 'RETURNING') {
            this.g22Hook.y -= (this.g22Hook.speed * 0.8) * (dt / 1000);
            
            if (this.g22Hook.y <= 50) {
                this.g22Hook.y = 50;
                this.g22Hook.state = 'IDLE';
                
                if (this.g22Hook.caught) {
                    this.g22Score += this.g22Hook.caught.score;
                    this.updateUI();
                    
                    let sign = this.g22Hook.caught.score > 0 ? '+' : '';
                    let color = this.g22Hook.caught.score > 0 ? '#4ade80' : '#f87171';
                    
                    UI.createPopEffect(GameState.canvas.width / 2, 80, sign + this.g22Hook.caught.score, color);
                    this.g22Hook.caught = null;
                }
            }
        }
    }

    draw(ctx) {
        // Sea background
        ctx.save();
        ctx.fillStyle = '#115e59';
        ctx.fillRect(0, 0, GameState.canvas.width, GameState.canvas.height);

        // Deck floor top
        ctx.fillStyle = '#0f766e';
        ctx.fillRect(0, 0, GameState.canvas.width, 40);

        // Fishes
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '40px Arial';
        this.g22Fishes.forEach(f => {
            ctx.fillText(f.emoji, f.x, f.y);
        });

        // Fishing string line
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(GameState.canvas.width / 2, 0);
        ctx.lineTo(GameState.canvas.width / 2, this.g22Hook.y);
        ctx.stroke();

        // Hook & Caught fish
        ctx.font = '30px Arial';
        ctx.fillText('🪝', GameState.canvas.width / 2, this.g22Hook.y);
        
        if (this.g22Hook.state === 'RETURNING' && this.g22Hook.caught) {
            ctx.fillText(this.g22Hook.caught.emoji, GameState.canvas.width / 2, this.g22Hook.y + 20);
        }
        ctx.restore();
    }

    handleInput(type, details) {
        if (type === 'keydown') {
            if (details.key === ' ' || details.key === 'Enter') {
                this.dropHook();
            }
        }
        if (type === 'mousedown') {
            this.dropHook();
        }
    }
}
