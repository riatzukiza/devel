/**
 * Pantheon Utilities Module
 * Common utility functions and helpers
 */
// === ID Generation ===
export const generateId = () => {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};
export const generateActorId = (name) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const sanitizedName = name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    return `actor_${sanitizedName}_${timestamp}_${random}`;
};
// === Message Processing ===
export const createMessage = (role, content, images) => ({
    role,
    content,
    images,
});
export const createSystemMessage = (content) => createMessage('system', content);
export const createUserMessage = (content) => createMessage('user', content);
export const createAssistantMessage = (content) => createMessage('assistant', content);
export const truncateMessages = (messages, maxTokens = 4000, avgTokensPerChar = 0.25) => {
    const maxChars = Math.floor(maxTokens / avgTokensPerChar);
    let totalChars = 0;
    const result = [];
    // Process messages in reverse order (most recent first)
    for (let i = messages.length - 1; i >= 0; i--) {
        const message = messages[i];
        if (!message)
            continue;
        const messageChars = message.content.length;
        if (totalChars + messageChars <= maxChars) {
            result.unshift(message);
            totalChars += messageChars;
        }
        else {
            // Add partial message if it's the last one
            if (result.length === 0) {
                const remainingChars = maxChars - totalChars;
                const partialContent = message.content.substring(0, remainingChars);
                result.unshift({
                    ...message,
                    content: partialContent + '...[truncated]',
                });
            }
            break;
        }
    }
    return result;
};
// === Context Management ===
export const createContextSource = (id, label, where, metadata) => ({
    id,
    label,
    where,
    metadata,
});
export const mergeContextSources = (...sources) => {
    const seen = new Set();
    const result = [];
    for (const sourceArray of sources) {
        for (const source of sourceArray) {
            if (!seen.has(source.id)) {
                seen.add(source.id);
                result.push(source);
            }
        }
    }
    return result;
};
// === Actor Utilities ===
export const createActorSummary = (actor) => {
    const status = actor.state;
    const goalCount = actor.goals.length;
    const talentCount = actor.script.talents.length;
    const lastActivity = actor.updatedAt.toISOString();
    return `Actor ${actor.script.name} (${actor.id}): ${status}, ${goalCount} goals, ${talentCount} talents, last active ${lastActivity}`;
};
export const isActorActive = (actor) => {
    return actor.state === 'running' || actor.state === 'idle';
};
export const isActorCompleted = (actor) => {
    return actor.state === 'completed' || actor.state === 'failed';
};
export const getActorAge = (actor) => {
    return Date.now() - actor.createdAt.getTime();
};
export const getActorIdleTime = (actor) => {
    return Date.now() - actor.updatedAt.getTime();
};
// === Configuration Utilities ===
export const mergeConfigs = (defaultConfig, userConfig) => {
    return {
        ...defaultConfig,
        ...userConfig,
    };
};
export const validateConfig = (config, requiredKeys) => {
    return requiredKeys.every((key) => key in config && config[key] !== null && config[key] !== undefined);
};
// === Error Handling ===
export class PantheonError extends Error {
    code;
    details;
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'PantheonError';
    }
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            details: this.details,
        };
    }
}
export const createError = (code, message, details) => {
    return new PantheonError(message, code, details);
};
export const isError = (error) => {
    return error instanceof PantheonError;
};
// === Async Utilities ===
export const withTimeout = (promise, timeoutMs, timeoutError) => {
    const timeout = new Promise((_, reject) => {
        setTimeout(() => {
            reject(timeoutError || new Error(`Operation timed out after ${timeoutMs}ms`));
        }, timeoutMs);
    });
    return Promise.race([promise, timeout]);
};
export const retry = async (fn, maxRetries = 3, delayMs = 1000, backoff = 'exponential') => {
    // Special case: maxRetries = 0 means try once with no retries
    if (maxRetries === 0) {
        return await fn();
    }
    let lastError;
    // Make exactly maxRetries attempts (not maxRetries + 1)
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            const originalError = error instanceof Error ? error : new Error(String(error));
            lastError = originalError;
            // If this is the last attempt, enhance error message with attempt count
            if (attempt === maxRetries) {
                // Only add attempt info if not already present in error message
                const attemptPattern = /attempt \d+/;
                if (attemptPattern.test(originalError.message)) {
                    throw originalError;
                }
                throw new Error(`${originalError.message}, attempt ${maxRetries}`);
            }
            const delay = backoff === 'exponential' ? delayMs * Math.pow(2, attempt - 1) : delayMs * attempt;
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
    throw lastError;
};
;
;
export const createConsoleLogger = (level = 'info') => {
    const levels = {
        debug: 0,
        info: 1,
        warn: 2,
        error: 3,
    };
    const currentLevel = levels[level];
    const shouldLog = (logLevel) => {
        return levels[logLevel] >= currentLevel;
    };
    return {
        debug: (message, meta) => {
            if (shouldLog('debug')) {
                console.debug(`[Pantheon] ${message}`, meta);
            }
        },
        info: (message, meta) => {
            if (shouldLog('info')) {
                console.info(`[Pantheon] ${message}`, meta);
            }
        },
        warn: (message, meta) => {
            if (shouldLog('warn')) {
                console.warn(`[Pantheon] ${message}`, meta);
            }
        },
        error: (message, meta) => {
            if (shouldLog('error')) {
                console.error(`[Pantheon] ${message}`, meta);
            }
        },
    };
};
export const createNullLogger = () => ({
    debug: () => { },
    info: () => { },
    warn: () => { },
    error: () => { },
});
// === Performance Utilities ===
export const createTimer = () => {
    const start = performance.now();
    return () => performance.now() - start;
};
export const measureAsync = async (fn, label) => {
    const timer = createTimer();
    try {
        const result = await fn();
        const duration = timer();
        if (label) {
            console.debug(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
        }
        return [result, duration];
    }
    catch (error) {
        const duration = timer();
        if (label) {
            console.debug(`[Performance] ${label} (failed): ${duration.toFixed(2)}ms`);
        }
        throw error;
    }
};
//# sourceMappingURL=index.js.map