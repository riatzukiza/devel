import { User, AuthResult, SecurityContext } from './types.js';
/**
 * JWT Handler for Pantheon authentication
 */
export declare class JwtHandler {
    private readonly jwtSecret;
    private readonly tokenExpiry;
    private readonly refreshTokenExpiry;
    constructor(config: {
        jwtSecret: string;
        tokenExpiry?: number;
        refreshTokenExpiry?: number;
    });
    /**
     * Generate JWT token for user
     */
    generateToken(user: User, sessionId: string): string;
    /**
     * Generate refresh token
     */
    generateRefreshToken(user: User): string;
    /**
     * Validate JWT token
     */
    validateToken(token: string): AuthResult;
    /**
     * Extract security context from token
     */
    extractSecurityContext(token: string): SecurityContext | null;
    /**
     * Refresh access token using refresh token
     */
    refreshToken(refreshToken: string, user: User): AuthResult;
    /**
     * Get user permissions based on roles
     */
    private getUserPermissions;
    /**
     * Generate secure session ID
     */
    generateSessionId(): string;
    /**
     * Check if user has specific permission
     */
    hasPermission(user: User, permission: string): boolean;
    /**
     * Check if user has any of the specified permissions
     */
    hasAnyPermission(user: User, permissions: string[]): boolean;
    /**
     * Check if user has all of the specified permissions
     */
    hasAllPermissions(user: User, permissions: string[]): boolean;
    /**
     * Check if user has specific role
     */
    hasRole(user: User, role: string): boolean;
    /**
     * Check if user is admin
     */
    isAdmin(user: User): boolean;
}
export declare const getDefaultJwtHandler: () => JwtHandler;
/**
 * Initialize JWT handler with custom configuration
 */
export declare const initializeJwtHandler: (config: {
    jwtSecret: string;
    tokenExpiry?: number;
    refreshTokenExpiry?: number;
}) => JwtHandler;
//# sourceMappingURL=jwt-handler.d.ts.map