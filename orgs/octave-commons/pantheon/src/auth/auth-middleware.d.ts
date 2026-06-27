import { SecurityContext } from './types.js';
import { SessionManager } from './session-manager.js';
/**
 * Authentication request interface
 */
export interface AuthenticatedRequest {
    headers: Record<string, string>;
    query?: Record<string, string | string[] | undefined>;
    cookies?: Record<string, string>;
    user?: SecurityContext;
}
/**
 * Authentication response
 */
export interface AuthResponse {
    success: boolean;
    user?: SecurityContext;
    error?: string;
    errorCode?: string;
}
/**
 * Create authentication middleware for CLI operations
 */
export declare const createCliAuthMiddleware: (sessionManager: SessionManager) => {
    /**
     * Authenticate request using token
     */
    authenticate: (req: AuthenticatedRequest) => AuthResponse;
    /**
     * Check if request has specific permission
     */
    hasPermission: (req: AuthenticatedRequest, permission: string) => boolean;
    /**
     * Check if request has specific role
     */
    hasRole: (req: AuthenticatedRequest, role: string) => boolean;
    /**
     * Require authentication for CLI operations
     */
    requireAuth: (req: AuthenticatedRequest) => SecurityContext;
    /**
     * Require specific permission for CLI operations
     */
    requirePermission: (req: AuthenticatedRequest, permission: string) => SecurityContext;
    /**
     * Require specific role for CLI operations
     */
    requireRole: (req: AuthenticatedRequest, role: string) => SecurityContext;
};
/**
 * CLI authentication helper
 */
export declare class CliAuthManager {
    private sessionManager;
    private currentSession;
    private middleware;
    constructor(sessionManager: SessionManager);
    /**
     * Authenticate CLI session using token
     */
    authenticate(token: string): AuthResponse;
    /**
     * Get current security context
     */
    getCurrentContext(): SecurityContext | null;
    /**
     * Check if current user has permission
     */
    hasPermission(permission: string): boolean;
    /**
     * Check if current user has role
     */
    hasRole(role: string): boolean;
    /**
     * Logout current session
     */
    logout(): boolean;
    /**
     * Require authentication for CLI operations
     */
    requireAuth(): SecurityContext;
    /**
     * Require specific permission for CLI operations
     */
    requirePermission(permission: string): SecurityContext;
    /**
     * Require specific role for CLI operations
     */
    requireRole(role: string): SecurityContext;
    /**
     * Get middleware instance
     */
    getMiddleware(): {
        /**
         * Authenticate request using token
         */
        authenticate: (req: AuthenticatedRequest) => AuthResponse;
        /**
         * Check if request has specific permission
         */
        hasPermission: (req: AuthenticatedRequest, permission: string) => boolean;
        /**
         * Check if request has specific role
         */
        hasRole: (req: AuthenticatedRequest, role: string) => boolean;
        /**
         * Require authentication for CLI operations
         */
        requireAuth: (req: AuthenticatedRequest) => SecurityContext;
        /**
         * Require specific permission for CLI operations
         */
        requirePermission: (req: AuthenticatedRequest, permission: string) => SecurityContext;
        /**
         * Require specific role for CLI operations
         */
        requireRole: (req: AuthenticatedRequest, role: string) => SecurityContext;
    };
}
export declare const getDefaultCliAuthManager: () => CliAuthManager;
/**
 * Initialize CLI auth manager with custom session manager
 */
export declare const initializeCliAuthManager: (sessionManager: SessionManager) => CliAuthManager;
//# sourceMappingURL=auth-middleware.d.ts.map