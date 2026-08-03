/**
 * Leaderboard service for Potato Arcade.
 * Connects directly to a global key-value cloud store to sync scores,
 * with LocalStorage fallback.
 */
export const Leaderboard = {
    // כתובת מסד הנתונים הציבורי הישיר (לשימוש מקומי)
    _dbUrl: "https://kvstore.dev/api/potato_arcade_leaderboard_v1",

    // בדיקה האם מדובר בהרצה מקומית
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

        // 1. שמירה מקומית כגיבוי
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
            console.error("Local save fallback failed:", e);
        }

        // 2. שמירה ישירה במסד הנתונים
        try {
            if (this._isLocal()) {
                // קריאת המצב הנוכחי מהענן (שימוש בפרמטר זמן למניעת מטמון/Cache)
                let allData = {};
                const getRes = await fetch(`${this._dbUrl}?t=${Date.now()}`);
                if (getRes.ok) {
                    allData = await getRes.json();
                }

                const key = `scores_${gameId}_${difficulty}`;
                const currentScores = allData[key] || [];

                // עדכון התוצאה
                const existingUserIdx = currentScores.findIndex(s => s.userId === cleanUserId);
                if (existingUserIdx !== -1) {
                    if (currentScores[existingUserIdx].score >= score) {
                        return true; 
                    }
                    currentScores.splice(existingUserIdx, 1);
                }

                currentScores.push({ userId: cleanUserId, score, timestamp: Date.now() });
                currentScores.sort((a, b) => b.score - a.score);
                allData[key] = currentScores.slice(0, 10);

                // שמירה חזרה לענן
                const postRes = await fetch(this._dbUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(allData)
                });
                
                return postRes.ok;
            } else {
                // פנייה לפונקציה של Netlify
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
                return postRes.ok;
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
            if (this._isLocal()) {
                // הוספת מזהה זמן ייחודי למניעת שימוש בתוצאות ישנות מהמטמון
                const response = await fetch(`${this._dbUrl}?t=${Date.now()}`);
                if (response.ok) {
                    const allData = await response.json();
                    const key = `scores_${gameId}_${difficulty}`;
                    const serverScores = allData[key] || [];
                    return serverScores.slice(0, limit);
                }
            } else {
                // פנייה לפונקציה של Netlify
                const response = await fetch(`/.netlify/functions/leaderboard?gameId=${gameId}&difficulty=${difficulty}&t=${Date.now()}`);
                if (response.ok) {
                    const serverScores = await response.json();
                    return serverScores.slice(0, limit);
                }
            }
        } catch (e) {
            console.warn("Failed to fetch global scores, using local scores instead.", e);
        }

        // במקרה של שגיאה, נחזור לתוצאות המקומיות
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
