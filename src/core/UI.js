import { GameState } from './GameState.js';
import { SoundService } from '../services/SoundService.js';

export const UI = {
    screens: {},
    onStartGameWithDiff: null, // Set by Engine

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

        // Start lobby music setup
        SoundService.startLobbyBgm();

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
    },

    delegateToGame(methodName, ...args) {
        if (GameState.currentGameInstance && typeof GameState.currentGameInstance[methodName] === 'function') {
            GameState.currentGameInstance[methodName](...args);
        }
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
        this.screens.container.className = 'relative w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-3xl sm:shadow-2xl overflow-hidden bg-gray-100 transition-colors duration-1000';
        this.screens.start.style.display = 'flex';
        
        if (GameState.ctx && GameState.canvas) {
            GameState.ctx.clearRect(0, 0, GameState.canvas.width, GameState.canvas.height);
        }
    },

    showDifficultyScreen(gameNum) {
        GameState.pendingGame = gameNum;
        this.screens.start.style.display = 'none';
        this.hideAllHUDs();
        this.screens.difficulty.classList.remove('hidden');
        this.screens.container.className = 'relative w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-3xl sm:shadow-2xl overflow-hidden bg-blue-900';
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

        // Play end-game audio
        SoundService.stopBgm();
        const isVictory = title.includes('🏆') || title.includes('🎉') || title.includes('ניצחון') || title.includes('כל הכבוד') || title.includes('עברת') || title.includes('איזה שרירים') || title.includes('מגיע לך');
        if (isVictory) {
            SoundService.playWinMusic();
        } else {
            SoundService.playLoseMusic();
        }

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
            this.screens.gameOver.style.opacity = '0';
            setTimeout(() => {
                this.screens.gameOver.classList.add('hidden');
                this.screens.gameOver.classList.remove('flex');
                if (GameState.restartCurrentGame) GameState.restartCurrentGame();
            }, 300);
        };
    },

    createPopEffect(x, y, emoji, color = 'rgba(255,255,255,1)') {
        GameState.visualEffects.push({ x, y, emoji, life: 1.0, vy: -30, color });
        SoundService.playEmojiSFX(emoji);
    }
};
