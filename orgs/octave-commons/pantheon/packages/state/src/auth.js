import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { SecurityValidator, SecurityLogger, RateLimiter } from './security.js';
import { AuthUtils } from './auth-utils.js';
import { ApiKeyManager } from './api-keys.js';
export const makeAuthService = (deps = {}) => {
    const { jwtSecret: secret = process.env.JWT_SECRET, config = {}, id = () => uuidv4(), now: _now = () => new Date(), log: _log = () => { }, } = deps;
    if (!secret) {
        throw new Error('JWT secret is required. Set JWT_SECRET environment variable or provide config.');
    }
    const jwtSecret = secret;
    const tokenExpiry = config.tokenExpiry || '24h';
    const rateLimitWindow = config.rateLimitWindow || 60000;
    const maxAttempts = config.maxAttempts || 3;
    const revokedTokens = new Set();
    const rateLimiter = RateLimiter.getInstance('auth-service', rateLimitWindow, maxAttempts);
    const apiKeyManager = new ApiKeyManager(jwtSecret);
    const checkRateLimit = (agentId, action) => {
        if (!rateLimiter.isAllowed(`${action}:${agentId}`)) {
            SecurityLogger.log({
                type: 'rate_limit',
                severity: 'medium',
                agentId,
                action,
                details: { reason: 'Rate limit exceeded' },
            });
            throw new Error('Rate limit exceeded. Please try again later.');
        }
    };
    const calculateExpiryDate = () => {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);
        return expiresAt;
    };
    const createTokenPayload = (tokenId, agentId, permissions) => {
        return {
            tokenId,
            agentId,
            permissions,
            type: 'agent-auth',
        };
    };
    const signToken = (payload) => {
        return jwt.sign(payload, jwtSecret, {
            expiresIn: tokenExpiry,
            issuer: 'promethean-agent-os',
            audience: 'promethean-agents',
        });
    };
    const logTokenGeneration = (agentId, tokenId, permissions) => {
        SecurityLogger.log({
            type: 'authentication',
            severity: 'low',
            agentId,
            action: 'generateToken',
            details: { tokenId, permissions },
        });
    };
    const logTokenError = (agentId, action, error) => {
        SecurityLogger.log({
            type: 'authentication',
            severity: 'medium',
            agentId,
            action,
            details: { error: error instanceof Error ? error.message : 'Unknown error' },
        });
    };
    const checkRateLimitByKey = (key, action) => {
        if (!rateLimiter.isAllowed(key)) {
            SecurityLogger.log({
                type: 'rate_limit',
                severity: 'medium',
                action,
                details: { reason: 'Rate limit exceeded' },
            });
            throw new Error('Rate limit exceeded');
        }
    };
    const verifyToken = (token) => {
        return jwt.verify(token, jwtSecret, {
            issuer: 'promethean-agent-os',
            audience: 'promethean-agents',
        });
    };
    const isValidAgentToken = (decoded) => {
        return decoded.type === 'agent-auth';
    };
    const logValidationFailure = (agentId, action, reason) => {
        SecurityLogger.log({
            type: 'authentication',
            severity: 'medium',
            agentId,
            action: action || 'validateToken',
            details: { reason: reason || 'Validation failed' },
        });
    };
    const logValidationSuccess = (agentId, action) => {
        SecurityLogger.log({
            type: 'authentication',
            severity: 'low',
            agentId,
            action,
            details: { success: true },
        });
    };
    const buildAuthToken = (token, decoded) => {
        return {
            token,
            agentId: decoded.agentId,
            expiresAt: new Date(decoded.exp * 1000),
            permissions: decoded.permissions,
        };
    };
    const handleValidationError = (error, action) => {
        if (error instanceof Error && error.message === 'Rate limit exceeded') {
            throw error;
        }
        SecurityLogger.log({
            type: 'authentication',
            severity: 'medium',
            action,
            details: { error: error instanceof Error ? error.message : 'Unknown error' },
        });
        return null;
    };
    const service = {
        generateToken: async (agentId, permissions) => {
            const validatedAgentId = SecurityValidator.validateAgentId(agentId);
            const validatedPermissions = SecurityValidator.validatePermissions(permissions);
            checkRateLimit(validatedAgentId, 'generateToken');
            try {
                const tokenId = id();
                const expiresAt = calculateExpiryDate();
                const payload = createTokenPayload(tokenId, validatedAgentId, validatedPermissions);
                const token = signToken(payload);
                logTokenGeneration(validatedAgentId, tokenId, validatedPermissions);
                return {
                    token,
                    agentId: validatedAgentId,
                    expiresAt,
                    permissions: validatedPermissions,
                };
            }
            catch (error) {
                logTokenError(agentId, 'generateToken', error);
                throw error;
            }
        },
        validateToken: async (token) => {
            const validatedToken = SecurityValidator.validateToken(token);
            const key = `validate:${validatedToken.substring(0, 10)}`;
            try {
                checkRateLimitByKey(key, 'validateToken');
                if (revokedTokens.has(validatedToken)) {
                    logValidationFailure('validateToken', 'Token revoked');
                    return null;
                }
                const decoded = verifyToken(validatedToken);
                if (!isValidAgentToken(decoded)) {
                    logValidationFailure(decoded.agentId || 'unknown', 'validateToken', 'Invalid token type');
                    return null;
                }
                logValidationSuccess(decoded.agentId || 'unknown', 'validateToken');
                return buildAuthToken(validatedToken, decoded);
            }
            catch (error) {
                return handleValidationError(error, 'validateToken');
            }
        },
        revokeToken: async (token) => {
            try {
                const validatedToken = SecurityValidator.validateToken(token);
                // Add to revoked tokens set
                revokedTokens.add(validatedToken);
                SecurityLogger.log({
                    type: 'authentication',
                    severity: 'low',
                    action: 'revokeToken',
                    details: { tokenHash: validatedToken.substring(0, 10) + '...' },
                });
            }
            catch (error) {
                SecurityLogger.log({
                    type: 'authentication',
                    severity: 'medium',
                    action: 'revokeToken',
                    details: { error: error instanceof Error ? error.message : 'Unknown error' },
                });
                // Re-throw error to match interface expectation
                throw error;
            }
        },
        refreshToken: async (oldToken) => {
            try {
                const validatedToken = SecurityValidator.validateToken(oldToken);
                // Validate the old token first
                const oldAuthToken = await service.validateToken(validatedToken);
                if (!oldAuthToken) {
                    return null;
                }
                // Revoke the old token
                await service.revokeToken(validatedToken);
                // Generate new token with same permissions
                return service.generateToken(oldAuthToken.agentId, oldAuthToken.permissions);
            }
            catch (error) {
                SecurityLogger.log({
                    type: 'authentication',
                    severity: 'medium',
                    action: 'refreshToken',
                    details: { error: error instanceof Error ? error.message : 'Unknown error' },
                });
                return null;
            }
        },
        hasPermission: async (token, permission) => {
            try {
                const validatedToken = SecurityValidator.validateToken(token);
                const validatedPermissions = SecurityValidator.validatePermissions([permission]);
                if (validatedPermissions.length === 0) {
                    return false;
                }
                const validatedPermission = validatedPermissions[0];
                const authToken = await service.validateToken(validatedToken);
                if (!authToken) {
                    return false;
                }
                return authToken.permissions.includes(validatedPermission);
            }
            catch (error) {
                AuthUtils.logAuthError('hasPermission', error);
                return false;
            }
        },
        hashPassword: async (password, saltRounds = 10) => {
            return AuthUtils.hashPassword(password, saltRounds);
        },
        verifyPassword: async (password, hash) => {
            return AuthUtils.verifyPassword(password, hash);
        },
        validatePassword: (password) => {
            return AuthUtils.validatePassword(password);
        },
        generateApiKey: (agentId, permissions) => {
            return apiKeyManager.generateApiKey(agentId, permissions);
        },
        validateApiKey: async (apiKey) => {
            return apiKeyManager.validateApiKey(apiKey);
        },
    };
    return service;
};
export class JWTAuthService {
    jwtSecret;
    tokenExpiry;
    revokedTokens = new Set();
    rateLimiter;
    rateLimitWindow = 60000; // 1 minute
    maxAttempts = 3; // 3 attempts
    apiKeyManager;
    constructor(configOrSecret, tokenExpiry = '24h') {
        // Get JWT secret from config or environment variable
        let jwtSecret;
        if (typeof configOrSecret === 'string') {
            jwtSecret = configOrSecret || process.env.JWT_SECRET;
            this.tokenExpiry = tokenExpiry;
        }
        else {
            jwtSecret = configOrSecret?.jwtSecret || process.env.JWT_SECRET;
            this.tokenExpiry = configOrSecret?.tokenExpiry || tokenExpiry;
            this.rateLimitWindow = configOrSecret?.rateLimitWindow || this.rateLimitWindow;
            this.maxAttempts = configOrSecret?.maxAttempts || this.maxAttempts;
        }
        if (!jwtSecret) {
            throw new Error('JWT secret is required. Set JWT_SECRET environment variable or provide config.');
        }
        this.jwtSecret = jwtSecret;
        this.rateLimiter = RateLimiter.getInstance('auth-service', this.rateLimitWindow, this.maxAttempts);
        this.apiKeyManager = new ApiKeyManager(jwtSecret);
    }
    async generateToken(agentId, permissions) {
        const validatedAgentId = SecurityValidator.validateAgentId(agentId);
        const validatedPermissions = SecurityValidator.validatePermissions(permissions);
        this.checkRateLimit(validatedAgentId, 'generateToken');
        try {
            const tokenId = uuidv4();
            const expiresAt = this.calculateExpiryDate();
            const payload = this.createTokenPayload(tokenId, validatedAgentId, validatedPermissions);
            const token = this.signToken(payload);
            this.logTokenGeneration(validatedAgentId, tokenId, validatedPermissions);
            return {
                token,
                agentId: validatedAgentId,
                expiresAt,
                permissions: validatedPermissions,
            };
        }
        catch (error) {
            this.logTokenError(agentId, 'generateToken', error);
            throw error;
        }
    }
    checkRateLimit(agentId, action) {
        if (!this.rateLimiter.isAllowed(`${action}:${agentId}`)) {
            SecurityLogger.log({
                type: 'rate_limit',
                severity: 'medium',
                agentId,
                action,
                details: { reason: 'Rate limit exceeded' },
            });
            throw new Error('Rate limit exceeded. Please try again later.');
        }
    }
    calculateExpiryDate() {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);
        return expiresAt;
    }
    createTokenPayload(tokenId, agentId, permissions) {
        return {
            tokenId,
            agentId,
            permissions,
            type: 'agent-auth',
        };
    }
    signToken(payload) {
        return jwt.sign(payload, this.jwtSecret, {
            expiresIn: this.tokenExpiry,
            issuer: 'promethean-agent-os',
            audience: 'promethean-agents',
        });
    }
    logTokenGeneration(agentId, tokenId, permissions) {
        SecurityLogger.log({
            type: 'authentication',
            severity: 'low',
            agentId,
            action: 'generateToken',
            details: { tokenId, permissions },
        });
    }
    logTokenError(agentId, action, error) {
        SecurityLogger.log({
            type: 'authentication',
            severity: 'medium',
            agentId,
            action,
            details: { error: error instanceof Error ? error.message : 'Unknown error' },
        });
    }
    async validateToken(token) {
        const validatedToken = SecurityValidator.validateToken(token);
        const key = `validate:${validatedToken.substring(0, 10)}`;
        try {
            this.checkRateLimitByKey(key, 'validateToken');
            if (this.revokedTokens.has(validatedToken)) {
                this.logValidationFailure('validateToken', 'Token revoked');
                return null;
            }
            const decoded = this.verifyToken(validatedToken);
            if (!this.isValidAgentToken(decoded)) {
                this.logValidationFailure(decoded.agentId || 'unknown', 'validateToken', 'Invalid token type');
                return null;
            }
            this.logValidationSuccess(decoded.agentId || 'unknown', 'validateToken');
            return this.buildAuthToken(validatedToken, decoded);
        }
        catch (error) {
            return this.handleValidationError(error, 'validateToken');
        }
    }
    checkRateLimitByKey(key, action) {
        if (!this.rateLimiter.isAllowed(key)) {
            SecurityLogger.log({
                type: 'rate_limit',
                severity: 'medium',
                action,
                details: { reason: 'Rate limit exceeded' },
            });
            throw new Error('Rate limit exceeded');
        }
    }
    verifyToken(token) {
        return jwt.verify(token, this.jwtSecret, {
            issuer: 'promethean-agent-os',
            audience: 'promethean-agents',
        });
    }
    isValidAgentToken(decoded) {
        return decoded.type === 'agent-auth';
    }
    logValidationFailure(agentId, action, reason) {
        SecurityLogger.log({
            type: 'authentication',
            severity: 'medium',
            agentId,
            action: action || 'validateToken',
            details: { reason: reason || 'Validation failed' },
        });
    }
    logValidationSuccess(agentId, action) {
        SecurityLogger.log({
            type: 'authentication',
            severity: 'low',
            agentId,
            action,
            details: { success: true },
        });
    }
    buildAuthToken(token, decoded) {
        return {
            token,
            agentId: decoded.agentId,
            expiresAt: new Date(decoded.exp * 1000),
            permissions: decoded.permissions,
        };
    }
    handleValidationError(error, action) {
        if (error instanceof Error && error.message === 'Rate limit exceeded') {
            throw error;
        }
        SecurityLogger.log({
            type: 'authentication',
            severity: 'medium',
            action,
            details: { error: error instanceof Error ? error.message : 'Unknown error' },
        });
        return null;
    }
    async revokeToken(token) {
        try {
            const validatedToken = SecurityValidator.validateToken(token);
            // Add to revoked tokens set
            this.revokedTokens.add(validatedToken);
            SecurityLogger.log({
                type: 'authentication',
                severity: 'low',
                action: 'revokeToken',
                details: { tokenHash: validatedToken.substring(0, 10) + '...' },
            });
        }
        catch (error) {
            SecurityLogger.log({
                type: 'authentication',
                severity: 'medium',
                action: 'revokeToken',
                details: { error: error instanceof Error ? error.message : 'Unknown error' },
            });
            // Re-throw error to match interface expectation
            throw error;
        }
    }
    async refreshToken(oldToken) {
        try {
            const validatedToken = SecurityValidator.validateToken(oldToken);
            // Validate the old token first
            const oldAuthToken = await this.validateToken(validatedToken);
            if (!oldAuthToken) {
                return null;
            }
            // Revoke the old token
            await this.revokeToken(validatedToken);
            // Generate new token with same permissions
            return this.generateToken(oldAuthToken.agentId, oldAuthToken.permissions);
        }
        catch (error) {
            SecurityLogger.log({
                type: 'authentication',
                severity: 'medium',
                action: 'refreshToken',
                details: { error: error instanceof Error ? error.message : 'Unknown error' },
            });
            return null;
        }
    }
    async hasPermission(token, permission) {
        try {
            const validatedToken = SecurityValidator.validateToken(token);
            const validatedPermissions = SecurityValidator.validatePermissions([permission]);
            if (validatedPermissions.length === 0) {
                return false;
            }
            const validatedPermission = validatedPermissions[0];
            const authToken = await this.validateToken(validatedToken);
            if (!authToken) {
                return false;
            }
            return authToken.permissions.includes(validatedPermission);
        }
        catch (error) {
            AuthUtils.logAuthError('hasPermission', error);
            return false;
        }
    }
    async hashPassword(password, saltRounds = 10) {
        return AuthUtils.hashPassword(password, saltRounds);
    }
    async verifyPassword(password, hash) {
        return AuthUtils.verifyPassword(password, hash);
    }
    validatePassword(password) {
        return AuthUtils.validatePassword(password);
    }
    generateApiKey(agentId, permissions) {
        return this.apiKeyManager.generateApiKey(agentId, permissions);
    }
    async validateApiKey(apiKey) {
        return this.apiKeyManager.validateApiKey(apiKey);
    }
}
//# sourceMappingURL=auth.js.map