/**
 * JWT Token Serializers
 * Functions for serializing and deserializing JWT tokens
 */
import crypto from 'crypto';
// Error factories for functional approach
export const createMockTokenExpiredError = (message) => {
    const error = new Error(message);
    error.name = 'TokenExpiredError';
    return error;
};
export const createMockJsonWebTokenError = (message) => {
    const error = new Error(message);
    error.name = 'JsonWebTokenError';
    return error;
};
// JWT serialization functions
export const serializeJWTPayload = (payload, secret, options) => {
    const algorithm = options?.algorithm || 'HS256';
    const header = { alg: algorithm, typ: 'JWT' };
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
        .createHmac('sha256', secret)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest('base64url');
    return `${encodedHeader}.${encodedPayload}.${signature}`;
};
export const deserializeJWTPayload = (token, secret, options) => {
    const [headerB64, payloadB64, signature] = token.split('.');
    if (!headerB64 || !payloadB64 || !signature) {
        throw createMockJsonWebTokenError('Invalid token format');
    }
    // Verify signature
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${headerB64}.${payloadB64}`)
        .digest('base64url');
    if (signature !== expectedSignature) {
        throw createMockJsonWebTokenError('Invalid signature');
    }
    // Decode payload
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    // Check expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
        throw createMockTokenExpiredError('Token expired');
    }
    // Verify issuer
    if (options?.issuer && payload.iss !== options.issuer) {
        throw createMockJsonWebTokenError('Invalid issuer');
    }
    // Verify audience
    if (options?.audience && payload.aud !== options.audience) {
        throw createMockJsonWebTokenError('Invalid audience');
    }
    return payload;
};
export const decodeJWTPayload = (token) => {
    const [, payloadB64] = token.split('.');
    if (!payloadB64) {
        throw createMockJsonWebTokenError('Invalid token format');
    }
    return JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
};
//# sourceMappingURL=jwt-tokens.js.map