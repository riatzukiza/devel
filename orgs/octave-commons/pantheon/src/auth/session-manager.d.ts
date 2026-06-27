import { User, Session, SecurityContext } from './types.js';
import { JwtHandler } from './jwt-handler.js';
/**
 * Session Manager for Pantheon - replaces global state with secure session management
 */
export declare class SessionManager {
    private sessions;
    private userSessions;
    private jwtHandler;
    constructor(jwtHandler: JwtHandler);
    /**
     * Create a new session for a user
     */
    createSession(user: User, metadata?: {
        ipAddress?: string;
        userAgent?: string;
    }): Session;
    /**
     * Get extended session by ID (internal use)
     */
    private getExtendedSession;
    /**
     * Get session by ID
     */
    getSession(sessionId: string): Session | null;
    /**
     * Get session by token
     */
    getSessionByToken(token: string): Session | null;
    /**
     * Validate session and return security context
     */
    validateSession(token: string): SecurityContext | null;
    /**
     * Destroy a session
     */
    destroySession(sessionId: string): boolean;
    /**
     * Destroy all sessions for a user
     */
    destroyUserSessions(userId: string): number;
    /**
     * Refresh session token
     */
    refreshSession(token: string, user: User): Session | null;
    /**
     * Clean up expired sessions
     */
    cleanupExpiredSessions(): number;
    /**
     * Get all active sessions for a user
     */
    getUserSessions(userId: string): Session[];
    /**
     * Get session statistics
     */
    getSessionStats(): {
        totalSessions: number;
        activeUsers: number;
        expiredSessions: number;
    };
}
export declare const getDefaultSessionManager: () => SessionManager;
/**
 * Initialize session manager with custom JWT handler
 */
export declare const initializeSessionManager: (jwtHandler: JwtHandler) => SessionManager;
//# sourceMappingURL=session-manager.d.ts.map