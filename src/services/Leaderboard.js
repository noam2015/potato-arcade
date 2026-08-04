/**
 * Leaderboard service for Potato Arcade.
 * Connects to Netlify Functions in production, with LocalStorage fallback.
 */
export const Leaderboard = {
    _isLocal() {
        const hostname = window.location.hostname;
        return hostname === 'localhost' || 
               hostname === '127.0.0.1' || 
               hostname.startsWith('192.168.') || 
               hostname.startsWith('10.') || 
               hostname.startsWith('172.');
    },

    _key(gameId, difficulty = 'medium') {
        return `potato_arcade_scores_game_${gameId}_${difficulty}`;
    },

    /**
     * Submits a score for a given game, difficulty and user.
     */
    async submitScore(gameId, score, userId, difficulty = 'medium') {
        // הפיכת משתמשי אורח לייחודיים כדי שלא ידרסו אחד את השני בענן
        let cleanUserId = userId || 'אורח';
        if (cleanUserId === 'אורח' || cleanUserId === 'guest') {
            // נבדוק אם כבר יצרנו מזהה אורח ייחודי בדפדפן זה
            let guestId = localStorage.getItem('potato_arcade_guest_id');
            if (!guestId) {
                guestId = `אורח ${Math.floor(100 + Math.random() * 900)}`;
                localStorage.setItem('potato_arcade_guest_id', guestId);
            }
            cleanUserId = guestId;
        }

        // 1. שמירה מקומית כגיבוי (או באופן בלעדי בריצה מקומית)
        try {
            const key = this._key(gameId, difficulty);
            const localScores = JSON.parse(localStorage.getItem(key) || '[]');
            const existingIdx = localScores.findIndex(s => s.userId === cleanUserId);
            if (existingIdx === -1 || localScores[existingIdx].score < score) {
                if (existingIdx !== -1) localScores.splice(existingIdx, 1);
                localScores.push({ userId: cleanUserId, score, timestamp: Date.now() });
                localScores.sort((a, b) => b.score - a.score);
                localStorage.setItem(key, JSON.stringify(localScores.slice(0, 10)));
            }
        } catch (e) {
            console.error("Local save failed:", e);
        }

        // 2. שמירה בשרת מקומי (ריצה מקומית) או בענן (בייצור)
        if (this._isLocal()) {
            try {
                const postRes = await fetch('http://localhost:3000/api/scores/submit', {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        gameId,
                        score,
                        username: cleanUserId,
                        difficulty
                    })
                });
                return postRes.ok;
            } catch (e) {
                console.warn("Dashboard local server unreachable for submitScore, fell back to LocalStorage:", e);
            }
        } else {
            try {
                const postRes = await fetch('/.netlify/functions/leaderboard', {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        gameId,
                        score,
                        username: cleanUserId,
                        difficulty
                    })
                });
                if (!postRes.ok) {
                    const errText = await postRes.text().catch(() => "Unknown error text");
                    console.error("Netlify leaderboard submitScore returned non-ok status:", postRes.status, errText);
                }
                return postRes.ok;
            } catch (e) {
                console.error("Fetch exception during Netlify leaderboard submitScore:", e);
            }
        }
        return true;
    },

    /**
     * Retrieves the top scores for a specific game and difficulty.
     */
    async getTopScores(gameId, difficulty = 'medium', limit = 3) {
        if (!this._isLocal()) {
            try {
                // פנייה לפונקציה של Netlify
                const response = await fetch(`/.netlify/functions/leaderboard?gameId=${gameId}&difficulty=${difficulty}&t=${Date.now()}`);
                if (response.ok) {
                    const serverScores = await response.json();
                    return serverScores.slice(0, limit);
                } else {
                    const errText = await response.text().catch(() => "Unknown error text");
                    console.error("Netlify leaderboard getTopScores returned non-ok status:", response.status, errText);
                }
            } catch (e) {
                console.error("Fetch exception during Netlify leaderboard getTopScores:", e);
            }
        } else {
            try {
                // פנייה לשרת הדשבורד המקומי
                const response = await fetch(`http://localhost:3000/api/scores/${gameId}/${difficulty}`);
                if (response.ok) {
                    const serverScores = await response.json();
                    return serverScores.slice(0, limit);
                }
            } catch (e) {
                console.warn("Dashboard local server unreachable for getTopScores, falling back to LocalStorage:", e);
            }
        }

        // במקרה של שגיאה או ריצה מקומית שבה השרת המקומי אינו זמין, נחזור לתוצאות המקומיות מה-LocalStorage
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
