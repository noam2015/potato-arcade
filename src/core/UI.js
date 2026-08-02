import { GameState } from './GameState.js';
import { SoundService } from '../services/SoundService.js';
import { Leaderboard } from '../services/Leaderboard.js';

const GAMES_METADATA = [
    { id: 2, name: 'אמסטרדם', emoji: '🚲', category: 'israel' },
    { id: 4, name: 'כאפה בזמן', emoji: '🖐️', category: 'action' },
    { id: 5, name: 'יונה עצבנית', emoji: '🐦', category: 'action' },
    { id: 6, name: 'צלף כפכפים', emoji: '👟', category: 'action' },
    { id: 7, name: 'מגדל שווארמה', emoji: '🥙', category: 'food' },
    { id: 8, name: 'מלצר מבולבל', emoji: '💁‍♂️', category: 'food' },
    { id: 9, name: 'השגת מימון', emoji: '💼', category: 'brain' },
    { id: 10, name: 'זיכרון מתוק', emoji: '🍬', category: 'brain' },
    { id: 11, name: 'מרדף הכפות', emoji: '🏃‍♂️', category: 'action' },
    { id: 12, name: 'חיתוך פירות', emoji: '🍉', category: 'action' },
    { id: 13, name: 'טייס חמקן', emoji: '✈️', category: 'action' },
    { id: 14, name: 'שייק בטטה', emoji: '🥤', category: 'food' },
    { id: 15, name: 'קליעת פלאפל', emoji: '🧆', category: 'food' },
    { id: 16, name: 'הקפה של הבוס', emoji: '☕', category: 'israel' },
    { id: 17, name: 'הליכה למקרר', emoji: '🍰', category: 'israel' },
    { id: 18, name: 'דיג\'יי בטטה', emoji: '🎸', category: 'action' },
    { id: 19, name: 'מרוץ הממ"ד', emoji: '🏃', category: 'israel' },
    { id: 20, name: 'פיצריה בעומס', emoji: '🍕', category: 'food' },
    { id: 21, name: 'קליעות מרפסת', emoji: '🏀', category: 'action' },
    { id: 22, name: 'דיג בטטות', emoji: '🎣', category: 'israel' },
    { id: 23, name: 'עגלת סופר', emoji: '🛒', category: 'israel' },
    { id: 24, name: 'אליפות המטקות', emoji: '🏖️', category: 'action' },
    { id: 25, name: 'לעבוד על הבוס', emoji: '🧑‍💻', category: 'israel' },
    { id: 26, name: 'מנגל עצמאות', emoji: '🥩', category: 'food' },
    { id: 27, name: 'פקק באיילון', emoji: '🚗', category: 'israel' },
    { id: 28, name: 'קטשופ עקשן', emoji: '🍅', category: 'food' },
    { id: 29, name: 'מתקפת עורבים', emoji: '🦅', category: 'action' },
    { id: 30, name: 'שירות לקוחות', emoji: '📱', category: 'brain' },
    { id: 31, name: 'בטטות מן השמיים', emoji: '☁️', category: 'action' },
    { id: 32, name: 'להספיק לאוטובוס', emoji: '🚌', category: 'israel' },
    { id: 33, name: 'טסט שנתי', emoji: '🚗', category: 'israel' },
    { id: 34, name: 'הסלקטורית', emoji: '🚪', category: 'brain' },
    { id: 35, name: 'אני רק שאלה!', emoji: '🏥', category: 'israel' },
    { id: 36, name: 'הגזמת עם הפפריקה!', emoji: '🍳', category: 'food' },
    { id: 37, name: 'סנדוויץ\' של אמא', emoji: '🥪', category: 'food' },
    { id: 38, name: 'יום הורים', emoji: '🏫', category: 'israel' },
    { id: 39, name: 'המזגן מטפטף!', emoji: '💧', category: 'israel' },
    { id: 40, name: 'לוטו הבטטה', emoji: '🎟️', category: 'brain' }
];

export const UI = {
    screens: {},
    onStartGameWithDiff: null, // Set by Engine
    selectedCategory: 'all',
    stopConfetti: null,

    init() {
        this.screens = {
            start: document.getElementById('start-screen'),
            difficulty: document.getElementById('difficulty-screen'),
            gameOver: document.getElementById('game-over'),
            goTitle: document.getElementById('go-title'),
            goDesc: document.getElementById('go-desc'),
            globalExitBtn: document.getElementById('global-exit-btn'),
            container: document.getElementById('game-container'),
            huds: [null]
        };

        for (let i = 1; i <= 40; i++) {
            this.screens.huds.push(document.getElementById(`hud-game${i}`));
        }

        // Bind global functions to window so inline HTML event handlers continue to work
        window.goToLobby = () => this.goToLobby();
        window.showDifficultyScreen = (gameNum) => this.showDifficultyScreen(gameNum);
        window.startGameWithDiff = (diff) => {
            if (this.onStartGameWithDiff) {
                this.onStartGameWithDiff(diff);
            }
        };

        // Initialize mute button state
        const muteBtn = document.getElementById('global-mute-btn');
        if (muteBtn) {
            muteBtn.innerHTML = SoundService.isMuted ? '🔇' : '🔊';
        }
        window.toggleMute = () => {
            const muted = SoundService.toggleMute();
            if (muteBtn) {
                muteBtn.innerHTML = muted ? '🔇' : '🔊';
            }
        };

        // Forward active game button controls to active game instance
        window.selectTool = (t) => this.delegateToGame('selectTool', t);
        window.g8Input = (item) => this.delegateToGame('g8Input', item);
        window.g9Answer = (idx) => this.delegateToGame('g9Answer', idx);
        window.addG14 = (item) => this.delegateToGame('addG14', item);
        window.clearG14 = () => this.delegateToGame('clearG14');
        window.blendG14 = () => this.delegateToGame('blendG14');
        window.addG20 = (item) => this.delegateToGame('addG20', item);
        window.clearG20 = () => this.delegateToGame('clearG20');
        window.serveG20 = () => this.delegateToGame('serveG20');
        window.g30Press = (num) => this.delegateToGame('g30Press', num);

        // --- NEW GAME OVERHAUL CONTROLS IN LOBBY ---
        
        // Render lobby grid on init
        this.renderLobby();

        // Search Input listener
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.renderLobby());
        }

        // Category Tabs listeners
        const tabs = document.querySelectorAll('.cat-tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Clear active states on all tabs
                tabs.forEach(t => {
                    t.className = 'cat-tab-btn bg-slate-950/85 text-white/70 hover:text-white hover:bg-slate-950 border border-white/10 py-2 px-5 rounded-full font-bold text-sm transition transform hover:scale-105';
                });
                
                const cat = tab.getAttribute('data-cat');
                this.selectedCategory = cat;
                
                // Set custom active style per category
                if (cat === 'all' || cat === 'action') {
                    tab.className = 'cat-tab-btn active bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-400 py-2 px-5 rounded-full font-bold text-sm transition transform hover:scale-105';
                } else if (cat === 'food') {
                    tab.className = 'cat-tab-btn active bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)] border border-amber-400 py-2 px-5 rounded-full font-bold text-sm transition transform hover:scale-105';
                } else if (cat === 'brain') {
                    tab.className = 'cat-tab-btn active bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)] border border-blue-400 py-2 px-5 rounded-full font-bold text-sm transition transform hover:scale-105';
                } else if (cat === 'israel') {
                    tab.className = 'cat-tab-btn active bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] border border-emerald-400 py-2 px-5 rounded-full font-bold text-sm transition transform hover:scale-105';
                }
                
                this.renderLobby();
            });
        });

        // CRT Toggle handling
        const crtBtn = document.getElementById('crt-toggle-btn');
        const crtStatusText = document.getElementById('crt-status-text');
        let crtActive = localStorage.getItem('potato_arcade_crt') === 'true';
        const updateCrtUI = () => {
            if (crtActive) {
                document.body.classList.add('crt-active');
                if (crtStatusText) {
                    crtStatusText.innerText = 'פעיל';
                    crtStatusText.className = 'text-green-400';
                }
            } else {
                document.body.classList.remove('crt-active');
                if (crtStatusText) {
                    crtStatusText.innerText = 'כבוי';
                    crtStatusText.className = 'text-red-400';
                }
            }
        };

        updateCrtUI();

        if (crtBtn) {
            crtBtn.addEventListener('click', () => {
                crtActive = !crtActive;
                localStorage.setItem('potato_arcade_crt', crtActive);
                updateCrtUI();
            });
        }

        // Start lobby music setup
        SoundService.startLobbyBgm();
    },

    delegateToGame(methodName, ...args) {
        if (GameState.currentGameInstance && typeof GameState.currentGameInstance[methodName] === 'function') {
            GameState.currentGameInstance[methodName](...args);
        }
    },

    getHighScoreSync(gameId) {
        try {
            const scoresKey = `potato_arcade_scores_game_${gameId}`;
            const localScores = JSON.parse(localStorage.getItem(scoresKey) || '[]');
            if (localScores.length > 0) {
                return localScores[0].score;
            }
        } catch (e) {}
        return null;
    },

    renderLobby() {
        const grid = document.getElementById('games-grid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        const searchInput = document.getElementById('search-input');
        const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
        const catFilter = this.selectedCategory;
        
        const filtered = GAMES_METADATA.filter(g => {
            const matchesCat = (catFilter === 'all' || g.category === catFilter);
            const matchesSearch = (g.name.toLowerCase().includes(query) || String(g.id) === query);
            return matchesCat && matchesSearch;
        });
        
        filtered.forEach(g => {
            const score = this.getHighScoreSync(g.id);
            const scoreText = score !== null ? `🏆 שיא: ${score}` : '—';
            
            let colorClasses = 'bg-slate-950/80 border-white/10 text-white hover:bg-slate-950/95';
            if (g.category === 'action') {
                colorClasses += ' glow-action border-pink-500/35 hover:border-pink-500/75';
            } else if (g.category === 'food') {
                colorClasses += ' glow-food border-amber-500/35 hover:border-amber-500/75';
            } else if (g.category === 'brain') {
                colorClasses += ' glow-brain border-blue-500/35 hover:border-blue-500/75';
            } else if (g.category === 'israel') {
                colorClasses += ' glow-israel border-emerald-500/35 hover:border-emerald-500/75';
            }
            
            const card = document.createElement('div');
            card.className = `game-card relative group flex flex-col justify-center items-center p-6 rounded-3xl border-2 hover:scale-105 active:scale-95 transition transform duration-200 cursor-pointer shadow-lg backdrop-blur-md min-h-[120px] ${colorClasses}`;
            card.onclick = () => this.showDifficultyScreen(g.id);
            
            card.innerHTML = `
                <div class="text-4xl mb-2 group-hover:animate-bounce select-none">${g.emoji}</div>
                <h2 class="text-sm font-black text-white leading-tight text-center">${g.name}</h2>
            `;
            
            grid.appendChild(card);
        });
    },

    hideAllHUDs() {
        for (let i = 1; i <= 40; i++) {
            if (this.screens.huds[i]) {
                this.screens.huds[i].classList.add('hidden');
            }
        }
        this.screens.globalExitBtn.classList.add('hidden');
    },

    goToLobby() {
        if (this.stopConfetti) {
            this.stopConfetti();
            this.stopConfetti = null;
        }

        if (GameState.currentGameInstance) {
            GameState.currentGameInstance.destroy();
            GameState.currentGameInstance = null;
        }

        GameState.state = 'START';

        // Start lobby BGM
        SoundService.startLobbyBgm();
        this.screens.gameOver.classList.add('hidden');
        this.screens.difficulty.classList.add('hidden');
        this.screens.gameOver.style.opacity = '0';

        // Hide specific overlays and translate-y transitions
        const overlays = [
            'g8-controls', 'g9-controls', 'g14-controls', 
            'g17-instruction', 'g20-controls', 'g30-controls'
        ];
        overlays.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.add('translate-y-full');
                if (id === 'g14-controls' || id === 'g20-controls' || id === 'g17-instruction') {
                    el.classList.add('hidden');
                }
            }
        });

        this.hideAllHUDs();
        
        // Set synthwave/crt container styles
        this.screens.container.className = 'relative w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-3xl sm:shadow-2xl overflow-hidden bg-[#0b1f28] transition-colors duration-1000 crt-container';
        this.screens.start.style.display = 'flex';
        
        if (GameState.ctx && GameState.canvas) {
            GameState.ctx.clearRect(0, 0, GameState.canvas.width, GameState.canvas.height);
        }

        // Refresh scores in cards
        this.renderLobby();
    },

    showDifficultyScreen(gameNum) {
        if (this.stopConfetti) {
            this.stopConfetti();
            this.stopConfetti = null;
        }

        GameState.pendingGame = gameNum;
        this.screens.start.style.display = 'none';
        this.hideAllHUDs();
        this.screens.difficulty.classList.remove('hidden');
        this.screens.container.className = 'relative w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-3xl sm:shadow-2xl overflow-hidden bg-[#052028] crt-container';
        GameState.state = 'DIFFICULTY';
    },

    showHUD(gameNum) {
        this.hideAllHUDs();
        if (this.screens.huds[gameNum]) {
            this.screens.huds[gameNum].classList.remove('hidden');
        }
        this.screens.globalExitBtn.classList.remove('hidden');
    },

    endGame(title, desc) {
        GameState.state = 'GAMEOVER';
        this.screens.goTitle.innerText = title;
        this.screens.goDesc.innerText = desc;
        this.hideAllHUDs();

        // 1. Play end-game audio
        SoundService.stopBgm();
        const isVictory = title.includes('🏆') || title.includes('🎉') || title.includes('ניצחון') || title.includes('כל הכבוד') || title.includes('עברת') || title.includes('איזה שרירים') || title.includes('מגיע לך');
        if (isVictory) {
            SoundService.playWinMusic();
        } else {
            SoundService.playLoseMusic();
        }

        // 2. Failure Shake effect
        if (!isVictory) {
            const container = this.screens.container;
            container.classList.add('camera-shake');
            setTimeout(() => {
                container.classList.remove('camera-shake');
            }, 500);
        }

        // 3. Extract Score and Save High Score
        const gameNum = GameState.pendingGame;
        let score = 0;
        const inst = GameState.currentGameInstance;
        
        if (inst) {
            // Find score property on game instance
            const scoreKeys = [
                'score', 'g' + gameNum + 'Score', 'g' + gameNum + 'Tickets', 
                'g' + gameNum + 'Time', 'g' + gameNum + 'Level', 'busesCaught',
                'g10Mistakes', 'g11Score', 'g12Score', 'g13Score', 'g14Score', 
                'g15Score', 'g16Time', 'g17Level', 'g18Score', 'g19Dist', 
                'g20Score', 'g21Score', 'g22Score', 'g23Score', 'g24Score',
                'g25Score', 'g26Score', 'g27Score', 'g28Score', 'g29Score', 'g30Score'
            ];
            for (const key of scoreKeys) {
                if (inst[key] !== undefined && typeof inst[key] === 'number') {
                    score = inst[key];
                    break;
                }
            }
            if (score === 0) {
                // Fallback: parse numbers from the description text
                const numMatch = desc.match(/\d+/);
                if (numMatch) {
                    score = parseInt(numMatch[0], 10);
                }
            }
        }

        // Mistakes in game 10 CandyMemory (lower is better, but 0 mistakes is best record)
        const oldRecord = this.getHighScoreSync(gameNum);
        let isNewRecord = false;
        
        if (score > 0 || (gameNum === 10 && score >= 0) || (gameNum === 8 && score > 0)) {
            if (oldRecord === null) {
                isNewRecord = true;
            } else {
                if (gameNum === 10) {
                    // CandyMemory: fewer mistakes is better
                    isNewRecord = score < oldRecord;
                } else {
                    isNewRecord = score > oldRecord;
                }
            }
        }
        
        if (isNewRecord) {
            Leaderboard.submitScore(gameNum, score, 'שחקן 1');
        }

        // Update record banner
        const existingBanner = document.getElementById('highscore-banner');
        if (existingBanner) existingBanner.remove();

        const banner = document.createElement('div');
        banner.id = 'highscore-banner';
        
        if (isNewRecord) {
            banner.className = 'text-yellow-400 font-black text-2xl mb-4 animate-pulse retro-text';
            banner.innerText = '🏆 שיא חדש! 🏆';
            this.triggerConfetti();
        } else {
            banner.className = 'text-white/60 font-bold text-sm mb-4';
            const recordVal = oldRecord !== null ? oldRecord : 0;
            banner.innerText = `הניקוד: ${score} | שיא אישי: ${recordVal}`;
        }
        
        this.screens.goDesc.parentNode.insertBefore(banner, this.screens.goDesc.nextSibling);

        // Slide down controls
        const overlays = ['g8-controls', 'g9-controls', 'g14-controls', 'g17-instruction', 'g20-controls', 'g30-controls'];
        overlays.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.add('translate-y-full');
                if (id === 'g14-controls' || id === 'g20-controls' || id === 'g17-instruction') {
                    el.classList.add('hidden');
                }
            }
        });

        this.screens.gameOver.classList.add('flex');
        this.screens.gameOver.classList.remove('hidden');
        setTimeout(() => this.screens.gameOver.style.opacity = '1', 50);

        document.getElementById('restart-btn').onclick = () => {
            if (this.stopConfetti) {
                this.stopConfetti();
                this.stopConfetti = null;
            }
            this.screens.gameOver.style.opacity = '0';
            setTimeout(() => {
                this.screens.gameOver.classList.add('hidden');
                this.screens.gameOver.classList.remove('flex');
                if (GameState.restartCurrentGame) GameState.restartCurrentGame();
            }, 300);
        };
    },

    triggerConfetti() {
        if (this.stopConfetti) this.stopConfetti();

        const gameOverScreen = this.screens.gameOver;
        const canvas = document.createElement('canvas');
        canvas.id = 'confetti-canvas';
        canvas.className = 'absolute inset-0 w-full h-full pointer-events-none z-20';
        gameOverScreen.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        canvas.width = gameOverScreen.clientWidth;
        canvas.height = gameOverScreen.clientHeight;
        
        const colors = ['#f43f5e', '#eab308', '#3b82f6', '#10b981', '#a855f7', '#ff7849'];
        const particles = [];
        for (let i = 0; i < 100; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                r: Math.random() * 6 + 4,
                d: Math.random() * canvas.height,
                color: colors[Math.floor(Math.random() * colors.length)],
                tilt: Math.random() * 10 - 5,
                tiltAngleIncremental: Math.random() * 0.07 + 0.02,
                tiltAngle: 0,
                vy: Math.random() * 3 + 2
            });
        }
        
        let active = true;
        const animate = () => {
            if (!active) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            let remaining = false;
            particles.forEach(p => {
                p.tiltAngle += p.tiltAngleIncremental;
                p.y += p.vy;
                p.x += Math.sin(p.tiltAngle) * 0.5;
                p.tilt = Math.sin(p.tiltAngle - p.r/2) * 4;
                
                if (p.y < canvas.height) {
                    remaining = true;
                }
                
                ctx.beginPath();
                ctx.lineWidth = p.r;
                ctx.strokeStyle = p.color;
                ctx.moveTo(p.x + p.tilt + p.r/2, p.y);
                ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r/2);
                ctx.stroke();
            });
            
            if (remaining) {
                requestAnimationFrame(animate);
            } else {
                canvas.remove();
            }
        };
        
        this.stopConfetti = () => {
            active = false;
            canvas.remove();
        };
        
        animate();
    },

    createPopEffect(x, y, emoji, color = 'rgba(255,255,255,1)') {
        GameState.visualEffects.push({ x, y, emoji, life: 1.0, vy: -30, color });
        SoundService.playEmojiSFX(emoji);
    }
};
