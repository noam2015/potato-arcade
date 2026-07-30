/**
 * Authentication service stub for Potato Arcade.
 * Ready to integrate with Firebase, Supabase, Auth0, or a custom API server.
 */
export const Auth = {
    currentUser: null,

    /**
     * Stub for logging in a user.
     * @param {string} username 
     * @param {string} password 
     * @returns {Promise<Object>} The authenticated user object
     */
    async login(username, password) {
        console.warn("Auth.login is not implemented yet. Guest mode activated for:", username);
        this.currentUser = {
            id: "guest_" + Math.random().toString(36).substr(2, 9),
            username: username,
            role: "player"
        };
        return this.currentUser;
    },

    /**
     * Stub for registering a new user.
     */
    async register(username, email, password) {
        console.warn("Auth.register is not implemented yet.");
        return this.login(username, password);
    },

    /**
     * Stub for logging out the current user.
     */
    async logout() {
        console.log("Logged out user:", this.currentUser?.username);
        this.currentUser = null;
    },

    /**
     * Check if a user is currently logged in.
     * @returns {boolean}
     */
    isLoggedIn() {
        return this.currentUser !== null;
    }
};
