import jwt from 'jsonwebtoken';
import { SecurityValidator } from './security.js';
export class ApiKeyManager {
    jwtSecret;
    constructor(jwtSecret) {
        this.jwtSecret = jwtSecret;
    }
    generateApiKey(agentId, permissions) {
        const validatedAgentId = SecurityValidator.validateAgentId(agentId);
        const validatedPermissions = SecurityValidator.validatePermissions(permissions);
        const payload = {
            agentId: validatedAgentId,
            permissions: validatedPermissions,
            type: 'api-key',
        };
        return jwt.sign(payload, this.jwtSecret, {
            expiresIn: '1y',
            issuer: 'promethean-agent-os',
            audience: 'promethean-agents',
        });
    }
    async validateApiKey(apiKey) {
        try {
            const validatedApiKey = SecurityValidator.validateToken(apiKey);
            const decoded = jwt.verify(validatedApiKey, this.jwtSecret, {
                issuer: 'promethean-agent-os',
                audience: 'promethean-agents',
            });
            if (decoded.type !== 'api-key') {
                return null;
            }
            return {
                token: validatedApiKey,
                agentId: decoded.agentId,
                expiresAt: new Date(decoded.exp * 1000),
                permissions: decoded.permissions,
            };
        }
        catch {
            return null;
        }
    }
}
//# sourceMappingURL=api-keys.js.map