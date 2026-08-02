/**
 * Authentication service for Potato Arcade.
 * Manages users locally using LocalStorage.
 */
export const Auth = {
    currentUser: null,

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

        const users = this._getUsers();
        const key = cleanUsername.toLowerCase();

        if (!users[key]) {
            throw new Error("שם המשתמש אינו קיים");
        }

        if (users[key].password !== cleanPassword) {
            throw new Error("סיסמה שגויה");
        }

        this.currentUser = {
            username: users[key].username, // Keep original casing
            role: "player"
        };

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

        const users = this._getUsers();
        const key = cleanUsername.toLowerCase();

        if (users[key]) {
            throw new Error("שם המשתמש כבר תפוס");
        }

        // Add user
        users[key] = {
            username: cleanUsername,
            password: cleanPassword,
            registeredAt: Date.now()
        };

        this._saveUsers(users);

        return this.login(cleanUsername, cleanPassword);
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
