import { AuthToken } from './types.js';
export declare class ApiKeyManager {
    private readonly jwtSecret;
    constructor(jwtSecret: string);
    generateApiKey(agentId: string, permissions: string[]): string;
    validateApiKey(apiKey: string): Promise<AuthToken | null>;
}
//# sourceMappingURL=api-keys.d.ts.map