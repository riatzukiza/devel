export declare class AuthUtils {
    static hashPassword(password: string, saltRounds?: number): Promise<string>;
    static verifyPassword(password: string, hash: string): Promise<boolean>;
    static validatePassword(password: string): {
        isValid: boolean;
        errors: string[];
    };
    static logAuthError(action: string, error: unknown, agentId?: string): void;
}
//# sourceMappingURL=auth-utils.d.ts.map