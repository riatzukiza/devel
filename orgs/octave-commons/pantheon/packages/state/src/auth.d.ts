import { AuthToken, AuthService } from './types.js';
export type AuthServiceConfig = {
    jwtSecret?: string;
    tokenExpiry?: string;
    rateLimitWindow?: number;
    maxAttempts?: number;
};
export type AuthServiceDeps = {
    jwtSecret?: string;
    config?: AuthServiceConfig;
    id?: () => string;
    now?: () => Date;
    log?: (level: 'info' | 'warn' | 'error', message: string, data?: any) => void;
};
export declare const makeAuthService: (deps?: AuthServiceDeps) => {
    generateToken: (agentId: string, permissions: string[]) => Promise<AuthToken>;
    validateToken: (token: string) => Promise<AuthToken | null>;
    revokeToken: (token: string) => Promise<void>;
    refreshToken: (oldToken: string) => Promise<AuthToken | null>;
    hasPermission: (token: string, permission: string) => Promise<boolean>;
    hashPassword: (password: string, saltRounds?: number) => Promise<string>;
    verifyPassword: (password: string, hash: string) => Promise<boolean>;
    validatePassword: (password: string) => {
        isValid: boolean;
        errors: string[];
    };
    generateApiKey: (agentId: string, permissions: string[]) => string;
    validateApiKey: (apiKey: string) => Promise<AuthToken | null>;
};
export declare class JWTAuthService implements AuthService {
    private readonly jwtSecret;
    private readonly tokenExpiry;
    private revokedTokens;
    private rateLimiter;
    private readonly rateLimitWindow;
    private readonly maxAttempts;
    private readonly apiKeyManager;
    constructor(configOrSecret?: string | {
        jwtSecret?: string;
        tokenExpiry?: string;
        rateLimitWindow?: number;
        maxAttempts?: number;
    }, tokenExpiry?: string);
    generateToken(agentId: string, permissions: string[]): Promise<AuthToken>;
    private checkRateLimit;
    private calculateExpiryDate;
    private createTokenPayload;
    private signToken;
    private logTokenGeneration;
    private logTokenError;
    validateToken(token: string): Promise<AuthToken | null>;
    private checkRateLimitByKey;
    private verifyToken;
    private isValidAgentToken;
    private logValidationFailure;
    private logValidationSuccess;
    private buildAuthToken;
    private handleValidationError;
    revokeToken(token: string): Promise<void>;
    refreshToken(oldToken: string): Promise<AuthToken | null>;
    hasPermission(token: string, permission: string): Promise<boolean>;
    hashPassword(password: string, saltRounds?: number): Promise<string>;
    verifyPassword(password: string, hash: string): Promise<boolean>;
    validatePassword(password: string): {
        isValid: boolean;
        errors: string[];
    };
    generateApiKey(agentId: string, permissions: string[]): string;
    validateApiKey(apiKey: string): Promise<AuthToken | null>;
}
//# sourceMappingURL=auth.d.ts.map