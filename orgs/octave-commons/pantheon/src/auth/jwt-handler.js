import crypto from 'crypto';
import { ROLE_PERMISSIONS } from './types.js';
class MockTokenExpiredError extends Error {
    name = 'TokenExpiredError';
    constructor(message) {
        super(message);
    }
}
class MockJsonWebTokenError extends Error {
    name = 'JsonWebTokenError';
    constructor(message) {
        super(message);
    }
}
const mockJwt = {
    sign: (payload, secret, options) => {
        const header = { alg: options?.algorithm || 'HS256', typ: 'JWT' };
        const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
        const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
        const signature = crypto
            .createHmac('sha256', secret)
            .update(`${encodedHeader}.${encodedPayload}`)
            .digest('base64url');
        return `${encodedHeader}.${encodedPayload}.${signature}`;
    },
    verify: (token, secret, options) => {
        const [headerB64, payloadB64, signature] = token.split('.');
        if (!headerB64 || !payloadB64 || !signature) {
            throw new MockJsonWebTokenError('Invalid token format');
        }
        // Verify signature
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(`${headerB64}.${payloadB64}`)
            .digest('base64url');
        if (signature !== expectedSignature) {
            throw new MockJsonWebTokenError('Invalid signature');
        }
        const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
        // Check expiration
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
            throw new MockTokenExpiredError('Token expired');
        }
        // Check issuer and audience
        if (options?.issuer && payload.iss !== options.issuer) {
            throw new MockJsonWebTokenError('Invalid issuer');
        }
        if (options?.audience && payload.aud !== options.audience) {
            throw new MockJsonWebTokenError('Invalid audience');
        }
        return payload;
    },
    decode: (token) => {
        const [, payloadB64] = token.split('.');
        if (!payloadB64) {
            throw new MockJsonWebTokenError('Invalid token format');
        }
        return JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    },
    TokenExpiredError: MockTokenExpiredError,
    JsonWebTokenError: MockJsonWebTokenError,
};
/**
 * JWT Handler for Pantheon authentication
 */
export class JwtHandler {
    jwtSecret;
    tokenExpiry;
    refreshTokenExpiry;
    constructor(config) {
        this.jwtSecret = config.jwtSecret;
        this.tokenExpiry = config.tokenExpiry || 3600; // 1 hour default
        this.refreshTokenExpiry = config.refreshTokenExpiry || 86400; // 24 hours default
    }
    /**
     * Generate JWT token for user
     */
    generateToken(user, sessionId) {
        const now = Math.floor(Date.now() / 1000);
        const payload = {
            userId: user.id,
            username: user.username,
            roles: user.roles,
            permissions: this.getUserPermissions(user),
            sessionId,
            iat: now,
            exp: now + this.tokenExpiry,
        };
        return mockJwt.sign(payload, this.jwtSecret, {
            algorithm: 'HS256',
            issuer: 'pantheon',
            audience: 'pantheon-users',
        });
    }
    /**
     * Generate refresh token
     */
    generateRefreshToken(user) {
        const payload = {
            userId: user.id,
            type: 'refresh',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + this.refreshTokenExpiry,
        };
        return mockJwt.sign(payload, this.jwtSecret, {
            algorithm: 'HS256',
        });
    }
    /**
     * Validate JWT token
     */
    validateToken(token) {
        try {
            const decoded = mockJwt.verify(token, this.jwtSecret, {
                algorithm: 'HS256',
                issuer: 'pantheon',
                audience: 'pantheon-users',
            });
            // Check if token is expired
            if (decoded.exp < Math.floor(Date.now() / 1000)) {
                return {
                    success: false,
                    error: 'Token has expired',
                    errorCode: 'SESSION_EXPIRED',
                };
            }
            return {
                success: true,
                token,
            };
        }
        catch (error) {
            if (error instanceof mockJwt.TokenExpiredError) {
                return {
                    success: false,
                    error: 'Token has expired',
                    errorCode: 'SESSION_EXPIRED',
                };
            }
            if (error instanceof mockJwt.JsonWebTokenError) {
                return {
                    success: false,
                    error: 'Invalid token',
                    errorCode: 'INVALID_TOKEN',
                };
            }
            return {
                success: false,
                error: 'Token validation failed',
                errorCode: 'INVALID_TOKEN',
            };
        }
    }
    /**
     * Extract security context from token
     */
    extractSecurityContext(token) {
        const validation = this.validateToken(token);
        if (!validation.success) {
            return null;
        }
        try {
            const decoded = mockJwt.decode(token);
            return {
                userId: decoded.userId,
                username: decoded.username,
                roles: decoded.roles,
                permissions: decoded.permissions,
                sessionId: decoded.sessionId,
                authenticated: true,
                timestamp: new Date(),
            };
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Refresh access token using refresh token
     */
    refreshToken(refreshToken, user) {
        try {
            const decoded = mockJwt.verify(refreshToken, this.jwtSecret);
            if (decoded.type !== 'refresh' || decoded.userId !== user.id) {
                return {
                    success: false,
                    error: 'Invalid refresh token',
                    errorCode: 'INVALID_TOKEN',
                };
            }
            const newSessionId = this.generateSessionId();
            const newToken = this.generateToken(user, newSessionId);
            return {
                success: true,
                token: newToken,
            };
        }
        catch (error) {
            return {
                success: false,
                error: 'Invalid refresh token',
                errorCode: 'INVALID_TOKEN',
            };
        }
    }
    /**
     * Get user permissions based on roles
     */
    getUserPermissions(user) {
        const permissions = new Set();
        for (const role of user.roles) {
            const rolePermissions = ROLE_PERMISSIONS[role] || [];
            for (const permission of rolePermissions) {
                permissions.add(permission);
            }
        }
        return Array.from(permissions);
    }
    /**
     * Generate secure session ID
     */
    generateSessionId() {
        return crypto.randomBytes(32).toString('hex');
    }
    /**
     * Check if user has specific permission
     */
    hasPermission(user, permission) {
        const userPermissions = this.getUserPermissions(user);
        return userPermissions.includes(permission);
    }
    /**
     * Check if user has any of the specified permissions
     */
    hasAnyPermission(user, permissions) {
        const userPermissions = this.getUserPermissions(user);
        return permissions.some((permission) => userPermissions.includes(permission));
    }
    /**
     * Check if user has all of the specified permissions
     */
    hasAllPermissions(user, permissions) {
        const userPermissions = this.getUserPermissions(user);
        return permissions.every((permission) => userPermissions.includes(permission));
    }
    /**
     * Check if user has specific role
     */
    hasRole(user, role) {
        return user.roles.includes(role);
    }
    /**
     * Check if user is admin
     */
    isAdmin(user) {
        return this.hasRole(user, 'admin');
    }
}
/**
 * Default JWT handler instance
 */
let defaultJwtHandler = null;
export const getDefaultJwtHandler = () => {
    if (!defaultJwtHandler) {
        const jwtSecret = process.env.PANTHEON_JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('PANTHEON_JWT_SECRET environment variable is required');
        }
        defaultJwtHandler = new JwtHandler({
            jwtSecret,
            tokenExpiry: parseInt(process.env.PANTHEON_TOKEN_EXPIRY || '3600'),
            refreshTokenExpiry: parseInt(process.env.PANTHEON_REFRESH_TOKEN_EXPIRY || '86400'),
        });
    }
    return defaultJwtHandler;
};
/**
 * Initialize JWT handler with custom configuration
 */
export const initializeJwtHandler = (config) => {
    defaultJwtHandler = new JwtHandler(config);
    return defaultJwtHandler;
};
//# sourceMappingURL=jwt-handler.js.map