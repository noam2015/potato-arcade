/**
 * Authentication service for Potato Arcade.
 * Manages users locally using LocalStorage.
 */
export const Auth = {
    currentUser: null,
    _dbUrl: "https://kvstore.dev/api/potato_arcade_users_v1",

    _isLocal() {
        const hostname = window.location.hostname;
        return hostname === 'localhost' || 
               hostname === '127.0.0.1' || 
               hostname.startsWith('192.168.') || 
               hostname.startsWith('10.') || 
               hostname.startsWith('172.');
    },

    /**
     * Initializes the auth session by checking localStorage.
     */
    init() {
        try {
            const session = localStorage.getItem('potato_arcade_session');
            if (session) {
                this.currentUser = {
                    username: session,
                    role: "player"
                };
            }
        } catch (e) {
            console.error("Failed to initialize auth session:", e);
        }
    },

    /**
     * Logs in a user.
     * @param {string} username 
     * @param {string} password 
     * @returns {Promise<Object>} The authenticated user object
     */
    async login(username, password) {
        const cleanUsername = (username || '').trim();
        const cleanPassword = (password || '').trim();

        if (!cleanUsername || !cleanPassword) {
            throw new Error("נא למלא את כל השדות");
        }

        let userObj = null;

        if (this._isLocal()) {
            // התחברות ישירה מול מסד הנתונים בענן בריצה מקומית
            let users = {};
            try {
                const getRes = await fetch(`${this._dbUrl}?t=${Date.now()}`);
                if (getRes.ok) {
                    users = await getRes.json();
                }
            } catch (e) {
                console.error("Failed to fetch cloud users:", e);
            }

            const key = cleanUsername.toLowerCase();
            if (!users[key]) {
                throw new Error("שם המשתמש אינו קיים");
            }
            if (users[key].password !== cleanPassword) {
                throw new Error("סיסמה שגויה");
            }
            userObj = {
                username: users[key].username,
                role: "player"
            };
        } else {
            // התחברות דרך פונקציית Netlify
            const response = await fetch('/.netlify/functions/auth', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "login",
                    username: cleanUsername,
                    password: cleanPassword
                })
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || "התחברות נכשלה");
            }
            userObj = await response.json();
        }

        this.currentUser = userObj;
        try {
            localStorage.setItem('potato_arcade_session', this.currentUser.username);
        } catch (e) {
            console.error("Failed to save auth session:", e);
        }

        return this.currentUser;
    },

    /**
     * Registers a new user.
     * @param {string} username 
     * @param {string} email - unused for local storage but kept for API compatibility
     * @param {string} password 
     * @returns {Promise<Object>}
     */
    async register(username, email, password) {
        const cleanUsername = (username || '').trim();
        const cleanPassword = (password || '').trim();

        if (!cleanUsername || !cleanPassword) {
            throw new Error("נא למלא את כל השדות");
        }

        if (cleanUsername.length < 3) {
            throw new Error("שם המשתמש חייב להיות לפחות 3 תווים");
        }

        let userObj = null;

        if (this._isLocal()) {
            // הרשמה ישירה מול מסד הנתונים בענן בריצה מקומית
            let users = {};
            try {
                const getRes = await fetch(`${this._dbUrl}?t=${Date.now()}`);
                if (getRes.ok) {
                    users = await getRes.json();
                }
            } catch (e) {
                console.error("Failed to fetch cloud users:", e);
            }

            const key = cleanUsername.toLowerCase();
            if (users[key]) {
                throw new Error("שם המשתמש כבר תפוס");
            }

            users[key] = {
                username: cleanUsername,
                password: cleanPassword,
                registeredAt: Date.now()
            };

            const postRes = await fetch(this._dbUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(users)
            });

            if (!postRes.ok) {
                throw new Error("הרשמה נכשלה בשמירה לענן");
            }

            userObj = {
                username: cleanUsername,
                role: "player"
            };
        } else {
            // הרשמה דרך פונקציית Netlify
            const response = await fetch('/.netlify/functions/auth', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "register",
                    username: cleanUsername,
                    password: cleanPassword
                })
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || "הרשמה נכשלה");
            }
            userObj = await response.json();
        }

        this.currentUser = userObj;
        try {
            localStorage.setItem('potato_arcade_session', this.currentUser.username);
        } catch (e) {
            console.error("Failed to save auth session:", e);
        }

        return this.currentUser;
    },

    /**
     * Logs out the current user.
     */
    async logout() {
        this.currentUser = null;
        try {
            localStorage.removeItem('potato_arcade_session');
        } catch (e) {
            console.error("Failed to remove auth session:", e);
        }
    },

    /**
     * Check if a user is currently logged in.
     * @returns {boolean}
     */
    isLoggedIn() {
        return this.currentUser !== null;
    },

    // --- Private Helper Methods ---

    _getUsers() {
        try {
            return JSON.parse(localStorage.getItem('potato_arcade_users') || '{}');
        } catch (e) {
            console.error("Failed to read local users:", e);
            return {};
        }
    },

    _saveUsers(users) {
        try {
            localStorage.setItem('potato_arcade_users', JSON.stringify(users));
        } catch (e) {
            console.error("Failed to write local users:", e);
        }
    }
};
