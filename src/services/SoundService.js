export const SoundService = {
    ctx: null,
    isMuted: localStorage.getItem('potato_arcade_muted') === 'true',
    schedulerInterval: null,
    
    // Sequencer state
    currentBpm: 120,
    nextNoteTime: 0.0,
    currentStep: 0,
    bgmType: null, // 'lobby' or 'game'
    isPlayingBgm: false,
    
    // Volume nodes
    masterGain: null,
    sfxGain: null,
    musicGain: null,

    init() {
        if (this.ctx) return;
        
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        
        this.ctx = new AudioContextClass();
        
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.6, this.ctx.currentTime);
        
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.connect(this.masterGain);
        this.sfxGain.gain.value = 1.0;
        
        this.musicGain = this.ctx.createGain();
        this.musicGain.connect(this.masterGain);
        this.musicGain.gain.value = 0.35;
        
        this.nextNoteTime = this.ctx.currentTime;
        this.startScheduler();
        
        // Listeners for autoplay/gestures to resume context
        const resumeAudio = () => {
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        };
        window.addEventListener('click', resumeAudio, { once: true });
        window.addEventListener('keydown', resumeAudio, { once: true });
    },

    toggleMute() {
        this.isMuted = !this.isMuted;
        localStorage.setItem('potato_arcade_muted', this.isMuted ? 'true' : 'false');
        
        if (this.ctx) {
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.6, this.ctx.currentTime);
        }
        return this.isMuted;
    },

    // SFX Synthesizers
    playClick() {
        this.init();
        if (this.isMuted || !this.ctx) return;
        
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(this.sfxGain);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(500, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.05);
        
        gainNode.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
        
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.05);
    },

    playCoin() {
        this.init();
        if (this.isMuted || !this.ctx) return;
        
        const playNote = (freq, startTime, duration) => {
            const osc = this.ctx.createOscillator();
            const gainNode = this.ctx.createGain();
            
            osc.connect(gainNode);
            gainNode.connect(this.sfxGain);
            
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, startTime);
            
            gainNode.gain.setValueAtTime(0.08, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
            
            osc.start(startTime);
            osc.stop(startTime + duration);
        };
        
        const now = this.ctx.currentTime;
        playNote(987.77, now, 0.08); // B5
        playNote(1318.51, now + 0.08, 0.15); // E6
    },

    playExplosion() {
        this.init();
        if (this.isMuted || !this.ctx) return;
        
        // Generate white noise buffer
        const bufferSize = this.ctx.sampleRate * 0.15; // 150ms
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.15);
        
        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
        
        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.sfxGain);
        
        noise.start(this.ctx.currentTime);
        noise.stop(this.ctx.currentTime + 0.15);
    },

    playFail() {
        this.init();
        if (this.isMuted || !this.ctx) return;
        
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(this.sfxGain);
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, this.ctx.currentTime + 0.25);
        
        gainNode.gain.setValueAtTime(0.18, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
        
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.25);
    },

    playJump() {
        this.init();
        if (this.isMuted || !this.ctx) return;
        
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(this.sfxGain);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.15);
        
        gainNode.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
        
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.15);
    },

    playBubble() {
        this.init();
        if (this.isMuted || !this.ctx) return;
        
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(this.sfxGain);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(900, this.ctx.currentTime + 0.08);
        
        gainNode.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
        
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.08);
    },

    playMove() {
        this.init();
        if (this.isMuted || !this.ctx) return;
        
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(this.sfxGain);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, this.ctx.currentTime + 0.05);
        
        gainNode.gain.setValueAtTime(0.05, this.ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
        
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.05);
    },

    playDrum() {
        this.init();
        if (this.isMuted || !this.ctx) return;
        
        const now = this.ctx.currentTime;
        
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(this.sfxGain);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        
        const bufferSize = this.ctx.sampleRate * 0.08;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1000, now);
        
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.12, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        
        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.sfxGain);
        
        osc.start(now);
        osc.stop(now + 0.15);
        noise.start(now);
        noise.stop(now + 0.08);
    },

    playGuitar() {
        this.init();
        if (this.isMuted || !this.ctx) return;
        
        const now = this.ctx.currentTime;
        
        const playPluck = (freq, detune) => {
            const osc = this.ctx.createOscillator();
            const filter = this.ctx.createBiquadFilter();
            const gainNode = this.ctx.createGain();
            
            osc.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.sfxGain);
            
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now);
            osc.detune.setValueAtTime(detune, now);
            
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(2000, now);
            filter.frequency.exponentialRampToValueAtTime(300, now + 0.2);
            filter.Q.setValueAtTime(4, now);
            
            gainNode.gain.setValueAtTime(0.12, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
            
            osc.start(now);
            osc.stop(now + 0.25);
        };
        
        playPluck(220.00, -10);
        playPluck(329.63, 10);
    },

    playMusicNote() {
        this.init();
        if (this.isMuted || !this.ctx) return;
        
        const now = this.ctx.currentTime;
        
        const playTone = (freq, delay, vol) => {
            const osc = this.ctx.createOscillator();
            const gainNode = this.ctx.createGain();
            
            osc.connect(gainNode);
            gainNode.connect(this.sfxGain);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + delay);
            
            gainNode.gain.setValueAtTime(vol, now + delay);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.2);
            
            osc.start(now + delay);
            osc.stop(now + delay + 0.22);
        };
        
        playTone(523.25, 0, 0.08);    // C5
        playTone(783.99, 0.03, 0.06); // G5
        playTone(1046.50, 0.06, 0.05); // C6
    },

    playEmojiSFX(emoji) {
        this.init();
        if (this.isMuted) return;
        
        if (emoji === '🥁') {
            this.playDrum();
            return;
        }
        if (emoji === '🎸') {
            this.playGuitar();
            return;
        }
        if (emoji === '🎵') {
            this.playMusicNote();
            return;
        }
        
        const successEmojis = ['✨', '🌟', '🎯', '🔥', '🍰', '🥩', '🏆', '🎉', '🛡️', '🔥'];
        const explosionEmojis = ['💥', '😵', '🚨'];
        const failEmojis = ['❌', '🤮', '🗑️', '⏳'];
        
        if (successEmojis.includes(emoji) || (typeof emoji === 'string' && emoji.startsWith('+'))) {
            this.playCoin();
        } else if (explosionEmojis.includes(emoji)) {
            this.playExplosion();
        } else if (failEmojis.includes(emoji)) {
            this.playFail();
        } else if (emoji === '💨') {
            this.playJump();
        } else if (emoji === '💦') {
            this.playBubble();
        } else {
            // Default soft pop for ingredients or general interactions
            this.playBubble();
        }
    },

    // BGM Sequencer Music Loop
    startLobbyBgm() {
        this.init();
        this.bgmType = 'lobby';
        this.currentBpm = 95;
        this.isPlayingBgm = true;
    },

    startGameBgm() {
        this.init();
        this.bgmType = 'game';
        this.currentBpm = 135;
        this.isPlayingBgm = true;
    },

    stopBgm() {
        this.isPlayingBgm = false;
    },

    startScheduler() {
        if (this.schedulerInterval) return;
        
        // Every 25ms, check if we need to schedule a note
        this.schedulerInterval = setInterval(() => {
            if (!this.ctx) return;
            
            const scheduleAheadTime = 0.15; // Schedule 150ms in advance
            while (this.nextNoteTime < this.ctx.currentTime + scheduleAheadTime) {
                this.scheduleNote(this.currentStep, this.nextNoteTime);
                this.advanceNote();
            }
        }, 25);
    },

    advanceNote() {
        const secondsPerBeat = 60.0 / this.currentBpm;
        const secondsPerStep = secondsPerBeat / 2; // Eighth notes
        this.nextNoteTime += secondsPerStep;
        this.currentStep = (this.currentStep + 1) % 16;
    },

    scheduleNote(step, time) {
        if (!this.isPlayingBgm || this.isMuted || !this.ctx) return;
        
        let bassFreq = 0;
        let melodyFreq = 0;
        let playHat = false;
        let playKick = false;
        
        if (this.bgmType === 'lobby') {
            // Lounge minor chord progression: Am7, D7, Gmaj7, Cmaj7
            const bassPattern = [
                55.0, 0, 55.0, 0,       // A2
                73.42, 0, 73.42, 73.42, // D3
                49.0, 0, 49.0, 0,       // G2
                65.41, 0, 65.41, 0      // C3
            ];
            bassFreq = bassPattern[step];
            
            // Catchy retro pop lobby melody hook
            const melodyPattern = [
                659.25, 0, 523.25, 587.33,  // E5, 0, C5, D5
                659.25, 0, 783.99, 0,       // E5, 0, G5, 0
                880.00, 0, 783.99, 659.25,  // A5, 0, G5, E5
                587.33, 0, 523.25, 0        // D5, 0, C5, 0
            ];
            melodyFreq = melodyPattern[step];
            
            if (step % 2 === 0) playHat = true;
            if (step === 0 || step === 8) playKick = true;
        } else if (this.bgmType === 'game') {
            // High tension driving game beat: Am, F, C, G
            const bassPattern = [
                55.0, 55.0, 55.0, 55.0,     // A2
                87.31, 87.31, 87.31, 87.31, // F3
                65.41, 65.41, 65.41, 65.41, // C3
                98.00, 98.00, 98.00, 98.00  // G3
            ];
            bassFreq = bassPattern[step];
            
            // Catchy Tetris/MegaMan-style chiptune game melody
            const melodyPattern = [
                440.00, 493.88, 523.25, 440.00, // A4, B4, C5, A4
                659.25, 0,      587.33, 523.25, // E5, 0, D5, C5
                698.46, 0,      659.25, 523.25, // F5, 0, E5, C5
                587.33, 0,      493.88, 392.00  // D5, 0, B4, G4
            ];
            melodyFreq = melodyPattern[step];
            
            if (step % 2 === 1) playHat = true;
            if (step % 4 === 0) playKick = true;
        }
        
        if (bassFreq > 0) this.synthBass(bassFreq, time);
        if (melodyFreq > 0) this.synthMelody(melodyFreq, time);
        if (playHat) this.synthHat(time);
        if (playKick) this.synthKick(time);
    },

    // Synth elements
    synthBass(freq, time) {
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        
        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.musicGain);
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(250, time);
        filter.frequency.linearRampToValueAtTime(100, time + 0.15);
        
        gainNode.gain.setValueAtTime(this.bgmType === 'game' ? 0.08 : 0.05, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
        
        osc.start(time);
        osc.stop(time + 0.2);
    },

    synthMelody(freq, time) {
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(this.musicGain);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);
        
        gainNode.gain.setValueAtTime(this.bgmType === 'game' ? 0.04 : 0.02, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
        
        osc.start(time);
        osc.stop(time + 0.12);
    },

    synthHat(time) {
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(this.musicGain);
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(10000, time);
        
        gainNode.gain.setValueAtTime(0.015, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
        
        osc.start(time);
        osc.stop(time + 0.04);
    },

    synthKick(time) {
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(this.musicGain);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, time);
        osc.frequency.exponentialRampToValueAtTime(40, time + 0.08);
        
        gainNode.gain.setValueAtTime(0.18, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
        
        osc.start(time);
        osc.stop(time + 0.11);
    },



    // Final game-over sequences
    playWinMusic() {
        this.init();
        if (this.isMuted || !this.ctx) return;
        
        const now = this.ctx.currentTime;
        const playSynthNote = (freq, startTime, duration, type = 'triangle') => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.type = type;
            osc.frequency.setValueAtTime(freq, startTime);
            gain.gain.setValueAtTime(0.08, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
            osc.start(startTime);
            osc.stop(startTime + duration);
        };
        
        // Upbeat triumphant major notes
        playSynthNote(523.25, now, 0.1);        // C5
        playSynthNote(659.25, now + 0.1, 0.1);  // E5
        playSynthNote(783.99, now + 0.2, 0.1);  // G5
        playSynthNote(1046.50, now + 0.3, 0.15); // C6
        playSynthNote(783.99, now + 0.45, 0.1);  // G5
        playSynthNote(1046.50, now + 0.55, 0.4, 'square'); // C6 (long)
    },

    playLoseMusic() {
        this.init();
        if (this.isMuted || !this.ctx) return;
        
        const now = this.ctx.currentTime;
        const playSynthNote = (freq, startTime, duration) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, startTime);
            osc.frequency.linearRampToValueAtTime(freq - 20, startTime + duration);
            gain.gain.setValueAtTime(0.08, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
            osc.start(startTime);
            osc.stop(startTime + duration);
        };
        
        // Sad descending minor notes
        playSynthNote(392.00, now, 0.18);      // G4
        playSynthNote(349.23, now + 0.18, 0.18); // F4
        playSynthNote(311.13, now + 0.36, 0.18); // Eb4
        playSynthNote(261.63, now + 0.54, 0.55); // C4 (long fade)
    }
};
