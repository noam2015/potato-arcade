/**
 * Leaderboard service for Potato Arcade.
 * Connects to Netlify Functions / Netlify Blobs for global sync,
 * with LocalStorage fallback for local development.
 */
export const Leaderboard = {
    // הכתובת לפונקציית השרת בנטליפיי
    _apiUrl: "/.netlify/functions/leaderboard",

    _key(gameId, difficulty = 'medium') {
        return `potato_arcade_scores_game_${gameId}_${difficulty}`;
    },

    /**
     * Submits a score for a given game, difficulty and user.
     */
    async submitScore(gameId, score, userId, difficulty = 'medium') {
        // שמירה מקומית כגיבוי
        try {
            const key = this._key(gameId, difficulty);
            const localScores = JSON.parse(localStorage.getItem(key) || '[]');
            const existingIdx = localScores.findIndex(s => s.userId === userId);
            if (existingIdx === -1 || localScores[existingIdx].score < score) {
                if (existingIdx !== -1) localScores.splice(existingIdx, 1);
                localScores.push({ userId, score, timestamp: Date.now() });
                localScores.sort((a, b) => b.score - a.score);
                localStorage.setItem(key, JSON.stringify(localScores.slice(0, 10)));
            }
        } catch (e) {
            console.error("Local save fallback failed:", e);
        }

        // שליחה לשרת הגלובלי בנטליפיי
        try {
            const response = await fetch(this._apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ gameId, score, username: userId, difficulty })
            });
            if (response.ok) {
                return true;
            }
        } catch (e) {
            console.warn("Failed to sync score with server. Saved locally.", e);
        }
        return false;
    },

    /**
     * Retrieves the top scores for a specific game and difficulty.
     */
    async getTopScores(gameId, difficulty = 'medium', limit = 3) {
        try {
            const response = await fetch(`${this._apiUrl}?gameId=${gameId}&difficulty=${difficulty}`);
            if (response.ok) {
                const serverScores = await response.json();
                return serverScores.slice(0, limit);
            }
        } catch (e) {
            console.warn("Failed to fetch global scores, using local scores instead.", e);
        }

        // במקרה של שגיאה או אי-זמינות, נחזור לתוצאות המקומיות
        return this.getTopScoresSync(gameId, difficulty, limit);
    },

    /**
     * Synchronous local-only fallback.
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
    }
};
