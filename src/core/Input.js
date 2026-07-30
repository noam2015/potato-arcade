import { GameState } from './GameState.js';

export const Input = {
    canvas: null,

    init(canvas) {
        this.canvas = canvas;

        // Key down / key up listeners
        window.addEventListener('keydown', (e) => this.dispatch('keydown', { key: e.key, rawEvent: e }));
        window.addEventListener('keyup', (e) => this.dispatch('keyup', { key: e.key, rawEvent: e }));

        // Canvas mouse down / touch start listeners
        canvas.addEventListener('mousedown', (e) => {
            const coords = this.getCoords(e.clientX, e.clientY);
            this.dispatch('mousedown', { ...coords, clientX: e.clientX, clientY: e.clientY, rawEvent: e });
        });

        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (e.touches.length > 0) {
                const touch = e.touches[0];
                const coords = this.getCoords(touch.clientX, touch.clientY);
                this.dispatch('mousedown', { ...coords, clientX: touch.clientX, clientY: touch.clientY, rawEvent: e });
            }
        }, { passive: false });

        // Canvas mouse move / touch move listeners
        canvas.addEventListener('mousemove', (e) => {
            const coords = this.getCoords(e.clientX, e.clientY);
            this.dispatch('mousemove', { ...coords, clientX: e.clientX, clientY: e.clientY, rawEvent: e });
        });

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (e.touches.length > 0) {
                const touch = e.touches[0];
                const coords = this.getCoords(touch.clientX, touch.clientY);
                this.dispatch('mousemove', { ...coords, clientX: touch.clientX, clientY: touch.clientY, rawEvent: e });
            }
        }, { passive: false });

        // Global mouse up / touch end listeners
        window.addEventListener('mouseup', (e) => {
            this.dispatch('mouseup', { clientX: e.clientX, clientY: e.clientY, rawEvent: e });
        });

        window.addEventListener('touchend', (e) => {
            if (e.changedTouches.length > 0) {
                const touch = e.changedTouches[0];
                this.dispatch('mouseup', { clientX: touch.clientX, clientY: touch.clientY, rawEvent: e });
            }
        }, { passive: false });
    },

    getCoords(clientX, clientY) {
        if (!this.canvas) return { x: 0, y: 0 };
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    },

    dispatch(type, details) {
        if (GameState.currentGameInstance && typeof GameState.currentGameInstance.handleInput === 'function') {
            GameState.currentGameInstance.handleInput(type, details);
        }
    }
};
