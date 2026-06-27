import bcrypt from 'bcryptjs';
import { SecurityLogger } from './security.js';
export class AuthUtils {
    static async hashPassword(password, saltRounds = 10) {
        return bcrypt.hash(password, saltRounds);
    }
    static async verifyPassword(password, hash) {
        return bcrypt.compare(password, hash);
    }
    static validatePassword(password) {
        const errors = [];
        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (!/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
    static logAuthError(action, error, agentId) {
        SecurityLogger.log({
            type: 'authorization',
            severity: 'medium',
            agentId,
            action,
            details: { error: error instanceof Error ? error.message : 'Unknown error' },
        });
    }
}
//# sourceMappingURL=auth-utils.js.map