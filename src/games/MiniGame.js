/**
 * Base class for all mini-games in the Potato Arcade.
 * Every game module must inherit from this class and implement its lifecycle methods.
 */
export class MiniGame {
    /**
     * Initializes the mini-game with a specific difficulty.
     * @param {string} difficulty - 'easy', 'medium', or 'hard'
     */
    init(difficulty) {
        // To be overridden by the sub-class
    }

    /**
     * Updates the game state and logic.
     * @param {number} dt - Delta time since last frame in milliseconds
     */
    update(dt) {
        // To be overridden by the sub-class
    }

    /**
     * Renders the game elements on the Canvas.
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
     */
    draw(ctx) {
        // To be overridden by the sub-class
    }

    /**
     * Handles keyboard or pointer/touch events directed to the game.
     * @param {string} type - Event type: 'keydown', 'keyup', 'mousedown', 'mousemove', 'mouseup'
     * @param {Object} details - Event details (key, coords, etc.)
     */
    handleInput(type, details) {
        // To be overridden by the sub-class
    }

    /**
     * Optional cleanup lifecycle method when leaving a game.
     */
    destroy() {
        // To be overridden if the subclass requires cleanup (e.g. timers, DOM additions)
    }
}
