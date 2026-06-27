/**
 * JWT Token Serializers
 * Functions for serializing and deserializing JWT tokens
 */
export declare const createMockTokenExpiredError: (message: string) => Error;
export declare const createMockJsonWebTokenError: (message: string) => Error;
export declare const serializeJWTPayload: (payload: Record<string, unknown>, secret: string, options?: {
    algorithm?: string;
    issuer?: string;
    audience?: string;
}) => string;
export declare const deserializeJWTPayload: (token: string, secret: string, options?: {
    algorithm?: string;
    issuer?: string;
    audience?: string;
}) => Record<string, unknown>;
export declare const decodeJWTPayload: (token: string) => Record<string, unknown>;
//# sourceMappingURL=jwt-tokens.d.ts.map