/**
 * Leaderboard service for Potato Arcade.
 * Stores scores per game + difficulty level in localStorage.
 * Ready to integrate with Firestore, Supabase, or a custom REST API.
 */
export const Leaderboard = {
    /**
     * Returns the localStorage key for a game+difficulty combo.
     * @param {number} gameId
     * @param {string} difficulty - 'easy' | 'medium' | 'hard'
     */
    _key(gameId, difficulty = 'medium') {
        return `potato_arcade_scores_game_${gameId}_${difficulty}`;
    },

    /**
     * Submits a score for a given game, difficulty and user.
     * @param {number} gameId - The ID of the mini-game
     * @param {number} score - The score achieved
     * @param {string} userId - The unique identifier of the user
     * @param {string} difficulty - 'easy' | 'medium' | 'hard'
     * @returns {Promise<boolean>}
     */
    async submitScore(gameId, score, userId, difficulty = 'medium') {
        try {
            const key = this._key(gameId, difficulty);
            const localScores = JSON.parse(localStorage.getItem(key) || '[]');
            // Remove old entry for this user, keep only best
            const existingIdx = localScores.findIndex(s => s.userId === userId);
            if (existingIdx !== -1) {
                if (localScores[existingIdx].score >= score) {
                    // Existing score is better, don't update
                    return false;
                }
                localScores.splice(existingIdx, 1);
            }
            localScores.push({ userId, score, timestamp: Date.now() });
            localScores.sort((a, b) => b.score - a.score);
            localStorage.setItem(key, JSON.stringify(localScores.slice(0, 10)));
            return true;
        } catch (e) {
            console.error("Failed to save score locally:", e);
            return false;
        }
    },

    /**
     * Retrieves the top scores for a specific game and difficulty.
     * @param {number} gameId - The ID of the mini-game
     * @param {string} difficulty - 'easy' | 'medium' | 'hard'
     * @param {number} limit - Maximum number of scores to retrieve
     * @returns {Array<Object>}
     */
    getTopScoresSync(gameId, difficulty = 'medium', limit = 3) {
        try {
            const key = this._key(gameId, difficulty);
            const localScores = JSON.parse(localStorage.getItem(key) || '[]');
            return localScores.slice(0, limit);
        } catch (e) {
            console.error("Failed to load scores locally:", e);
            return [];
        }
    },

    /**
     * Legacy async method kept for backward compatibility.
     */
    async getTopScores(gameId, limit = 10) {
        return this.getTopScoresSync(gameId, 'medium', limit);
    }
};
