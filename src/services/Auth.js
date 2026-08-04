/**
 * Authentication service for Potato Arcade.
 * Manages users locally using LocalStorage or via Netlify Functions in production.
 */
export const Auth = {
    currentUser: null,

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
            try {
                // Try fetching users list from local dashboard server
                const response = await fetch('http://localhost:3000/api/users');
                if (response.ok) {
                    const users = await response.json();
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
                    throw new Error("Server error");
                }
            } catch (err) {
                if (err.message === "שם המשתמש אינו קיים" || err.message === "סיסמה שגויה") {
                    throw err;
                }
                console.warn("Dashboard local server unreachable, falling back to LocalStorage:", err);
                
                // Fallback to local storage
                const users = this._getUsersLocal();
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
            }
        } else {
            try {
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
                    const errText = await response.text().catch(() => "Unknown error text");
                    console.error("Netlify auth login returned non-ok status:", response.status, errText);
                    let errJSON = {};
                    try { errJSON = JSON.parse(errText); } catch(e) {}
                    throw new Error(errJSON.error || `התחברות נכשלה (קוד: ${response.status})`);
                }
                userObj = await response.json();
            } catch (e) {
                console.error("Fetch exception during Netlify auth login:", e);
                throw e;
            }
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
     * @param {string} email - unused but kept for compatibility
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
            try {
                // Try registering at local dashboard server
                const response = await fetch('http://localhost:3000/api/users/add', {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username: cleanUsername, password: cleanPassword })
                });

                if (response.ok) {
                    userObj = await response.json();
                } else {
                    const errData = await response.json().catch(() => ({}));
                    if (errData.error === "missing_fields") throw new Error("נא למלא את כל השדות");
                    if (errData.error === "username_too_short") throw new Error("שם המשתמש חייב להיות לפחות 3 תווים");
                    if (errData.error === "username_taken") throw new Error("שם המשתמש כבר תפוס");
                    throw new Error(errData.error || "הרשמה בשרת נכשלה");
                }
            } catch (err) {
                // Propagate validation errors
                if (err.message === "שם המשתמש כבר תפוס" || err.message === "שם המשתמש חייב להיות לפחות 3 תווים" || err.message === "נא למלא את כל השדות") {
                    throw err;
                }
                console.warn("Dashboard local server unreachable, falling back to LocalStorage:", err);

                // Fallback to local storage
                const users = this._getUsersLocal();
                const key = cleanUsername.toLowerCase();

                if (users[key]) {
                    throw new Error("שם המשתמש כבר תפוס");
                }

                users[key] = {
                    username: cleanUsername,
                    password: cleanPassword,
                    registeredAt: Date.now()
                };

                this._saveUsersLocal(users);

                userObj = {
                    username: cleanUsername,
                    role: "player"
                };
            }
        } else {
            try {
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
                    const errText = await response.text().catch(() => "Unknown error text");
                    console.error("Netlify auth register returned non-ok status:", response.status, errText);
                    let errJSON = {};
                    try { errJSON = JSON.parse(errText); } catch(e) {}
                    throw new Error(errJSON.error || `הרשמה נכשלה (קוד: ${response.status})`);
                }
                userObj = await response.json();
            } catch (e) {
                console.error("Fetch exception during Netlify auth register:", e);
                throw e;
            }
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

    _getUsersLocal() {
        try {
            return JSON.parse(localStorage.getItem('potato_arcade_users') || '{}');
        } catch (e) {
            console.error("Failed to read local users:", e);
            return {};
        }
    },

    _saveUsersLocal(users) {
        try {
            localStorage.setItem('potato_arcade_users', JSON.stringify(users));
        } catch (e) {
            console.error("Failed to write local users:", e);
        }
    }
};
