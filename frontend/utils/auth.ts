/**
 * Authentication utilities for JWT token management
 */

const TOKEN_KEY = 'testmate_token';
const USER_KEY = 'testmate_user';
const REMEMBERED_USER_KEY = 'testmate_remembered_user';

export const authUtils = {
    // Save token to localStorage
    setToken(token: string) {
        if (typeof window !== 'undefined') {
            localStorage.setItem(TOKEN_KEY, token);
        }
    },

    // Get token from localStorage
    getToken(): string | null {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(TOKEN_KEY);
        }
        return null;
    },

    // Remove token from localStorage
    removeToken() {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
        }
    },

    // Save user data to localStorage
    setUser(user: any) {
        if (typeof window !== 'undefined') {
            localStorage.setItem(USER_KEY, JSON.stringify(user));
        }
    },

    // Get user data from localStorage
    getUser(): any | null {
        if (typeof window !== 'undefined') {
            const userStr = localStorage.getItem(USER_KEY);
            return userStr ? JSON.parse(userStr) : null;
        }
        return null;
    },

    // Check if user is authenticated
    isAuthenticated(): boolean {
        return this.getToken() !== null;
    },

    // Save remembered user display info (persists across token expiry)
    setRememberedUser(user: { username: string; email?: string; avatar_url?: string }) {
        if (typeof window !== 'undefined') {
            localStorage.setItem(REMEMBERED_USER_KEY, JSON.stringify(user));
        }
    },

    // Get remembered user display info
    getRememberedUser(): { username: string; email?: string; avatar_url?: string } | null {
        if (typeof window !== 'undefined') {
            const str = localStorage.getItem(REMEMBERED_USER_KEY);
            return str ? JSON.parse(str) : null;
        }
        return null;
    },

    // Clear remembered user (called when switching accounts)
    clearRememberedUser() {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(REMEMBERED_USER_KEY);
        }
    },
};