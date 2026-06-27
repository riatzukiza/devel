import { z } from 'zod';
/**
 * JWT token payload schema
 */
export declare const JwtPayloadSchema: z.ZodObject<{
    userId: z.ZodString;
    username: z.ZodString;
    roles: z.ZodArray<z.ZodEnum<["admin", "user", "viewer"]>, "many">;
    permissions: z.ZodArray<z.ZodString, "many">;
    sessionId: z.ZodString;
    iat: z.ZodNumber;
    exp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    roles: ("admin" | "user" | "viewer")[];
    sessionId: string;
    permissions: string[];
    userId: string;
    username: string;
    iat: number;
    exp: number;
}, {
    roles: ("admin" | "user" | "viewer")[];
    sessionId: string;
    permissions: string[];
    userId: string;
    username: string;
    iat: number;
    exp: number;
}>;
export type JwtPayload = z.infer<typeof JwtPayloadSchema>;
/**
 * Authentication credentials schema
 */
export declare const CredentialsSchema: z.ZodObject<{
    username: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    username: string;
    password: string;
}, {
    username: string;
    password: string;
}>;
export type Credentials = z.infer<typeof CredentialsSchema>;
/**
 * API key authentication schema
 */
export declare const ApiKeyCredentialsSchema: z.ZodObject<{
    apiKey: z.ZodString;
}, "strip", z.ZodTypeAny, {
    apiKey: string;
}, {
    apiKey: string;
}>;
export type ApiKeyCredentials = z.infer<typeof ApiKeyCredentialsSchema>;
/**
 * User information schema
 */
export declare const UserSchema: z.ZodObject<{
    id: z.ZodString;
    username: z.ZodString;
    email: z.ZodString;
    roles: z.ZodArray<z.ZodEnum<["admin", "user", "viewer"]>, "many">;
    permissions: z.ZodArray<z.ZodString, "many">;
    createdAt: z.ZodDate;
    lastLogin: z.ZodOptional<z.ZodDate>;
    active: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    active: boolean;
    id: string;
    roles: ("admin" | "user" | "viewer")[];
    createdAt: Date;
    permissions: string[];
    email: string;
    username: string;
    lastLogin?: Date | undefined;
}, {
    active: boolean;
    id: string;
    roles: ("admin" | "user" | "viewer")[];
    createdAt: Date;
    permissions: string[];
    email: string;
    username: string;
    lastLogin?: Date | undefined;
}>;
export type User = z.infer<typeof UserSchema>;
/**
 * Session information schema
 */
export declare const SessionSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    createdAt: z.ZodDate;
    lastActivity: z.ZodDate;
    expiresAt: z.ZodDate;
    ipAddress: z.ZodOptional<z.ZodString>;
    userAgent: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    expiresAt: Date;
    createdAt: Date;
    lastActivity: Date;
    userId: string;
    ipAddress?: string | undefined;
    userAgent?: string | undefined;
}, {
    id: string;
    expiresAt: Date;
    createdAt: Date;
    lastActivity: Date;
    userId: string;
    ipAddress?: string | undefined;
    userAgent?: string | undefined;
}>;
export type Session = z.infer<typeof SessionSchema>;
/**
 * Authentication result schema
 */
export declare const AuthResultSchema: z.ZodObject<{
    success: z.ZodBoolean;
    user: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        username: z.ZodString;
        email: z.ZodString;
        roles: z.ZodArray<z.ZodEnum<["admin", "user", "viewer"]>, "many">;
        permissions: z.ZodArray<z.ZodString, "many">;
        createdAt: z.ZodDate;
        lastLogin: z.ZodOptional<z.ZodDate>;
        active: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        active: boolean;
        id: string;
        roles: ("admin" | "user" | "viewer")[];
        createdAt: Date;
        permissions: string[];
        email: string;
        username: string;
        lastLogin?: Date | undefined;
    }, {
        active: boolean;
        id: string;
        roles: ("admin" | "user" | "viewer")[];
        createdAt: Date;
        permissions: string[];
        email: string;
        username: string;
        lastLogin?: Date | undefined;
    }>>;
    token: z.ZodOptional<z.ZodString>;
    session: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        userId: z.ZodString;
        createdAt: z.ZodDate;
        lastActivity: z.ZodDate;
        expiresAt: z.ZodDate;
        ipAddress: z.ZodOptional<z.ZodString>;
        userAgent: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        expiresAt: Date;
        createdAt: Date;
        lastActivity: Date;
        userId: string;
        ipAddress?: string | undefined;
        userAgent?: string | undefined;
    }, {
        id: string;
        expiresAt: Date;
        createdAt: Date;
        lastActivity: Date;
        userId: string;
        ipAddress?: string | undefined;
        userAgent?: string | undefined;
    }>>;
    error: z.ZodOptional<z.ZodString>;
    errorCode: z.ZodOptional<z.ZodEnum<["INVALID_CREDENTIALS", "USER_INACTIVE", "SESSION_EXPIRED", "INVALID_TOKEN"]>>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    error?: string | undefined;
    user?: {
        active: boolean;
        id: string;
        roles: ("admin" | "user" | "viewer")[];
        createdAt: Date;
        permissions: string[];
        email: string;
        username: string;
        lastLogin?: Date | undefined;
    } | undefined;
    token?: string | undefined;
    session?: {
        id: string;
        expiresAt: Date;
        createdAt: Date;
        lastActivity: Date;
        userId: string;
        ipAddress?: string | undefined;
        userAgent?: string | undefined;
    } | undefined;
    errorCode?: "INVALID_CREDENTIALS" | "USER_INACTIVE" | "SESSION_EXPIRED" | "INVALID_TOKEN" | undefined;
}, {
    success: boolean;
    error?: string | undefined;
    user?: {
        active: boolean;
        id: string;
        roles: ("admin" | "user" | "viewer")[];
        createdAt: Date;
        permissions: string[];
        email: string;
        username: string;
        lastLogin?: Date | undefined;
    } | undefined;
    token?: string | undefined;
    session?: {
        id: string;
        expiresAt: Date;
        createdAt: Date;
        lastActivity: Date;
        userId: string;
        ipAddress?: string | undefined;
        userAgent?: string | undefined;
    } | undefined;
    errorCode?: "INVALID_CREDENTIALS" | "USER_INACTIVE" | "SESSION_EXPIRED" | "INVALID_TOKEN" | undefined;
}>;
export type AuthResult = z.infer<typeof AuthResultSchema>;
/**
 * Security context schema
 */
export declare const SecurityContextSchema: z.ZodObject<{
    userId: z.ZodString;
    username: z.ZodString;
    roles: z.ZodArray<z.ZodEnum<["admin", "user", "viewer"]>, "many">;
    permissions: z.ZodArray<z.ZodString, "many">;
    sessionId: z.ZodString;
    authenticated: z.ZodBoolean;
    timestamp: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    roles: ("admin" | "user" | "viewer")[];
    timestamp: Date;
    sessionId: string;
    permissions: string[];
    userId: string;
    username: string;
    authenticated: boolean;
}, {
    roles: ("admin" | "user" | "viewer")[];
    timestamp: Date;
    sessionId: string;
    permissions: string[];
    userId: string;
    username: string;
    authenticated: boolean;
}>;
export type SecurityContext = z.infer<typeof SecurityContextSchema>;
/**
 * Permission definitions
 */
export declare const PERMISSIONS: {
    readonly ACTOR_CREATE: "actor:create";
    readonly ACTOR_READ: "actor:read";
    readonly ACTOR_UPDATE: "actor:update";
    readonly ACTOR_DELETE: "actor:delete";
    readonly ACTOR_TICK: "actor:tick";
    readonly ACTOR_START: "actor:start";
    readonly ACTOR_STOP: "actor:stop";
    readonly CONTEXT_CREATE: "context:create";
    readonly CONTEXT_READ: "context:read";
    readonly CONTEXT_UPDATE: "context:update";
    readonly CONTEXT_DELETE: "context:delete";
    readonly CONTEXT_COMPILE: "context:compile";
    readonly TOOL_EXECUTE: "tool:execute";
    readonly TOOL_READ: "tool:read";
    readonly SYSTEM_ADMIN: "system:admin";
    readonly SYSTEM_MONITOR: "system:monitor";
    readonly SYSTEM_CONFIG: "system:config";
};
export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
/**
 * Role definitions with default permissions
 */
export declare const ROLE_PERMISSIONS: {
    readonly admin: ("system:config" | "actor:create" | "actor:read" | "actor:update" | "actor:delete" | "actor:tick" | "actor:start" | "actor:stop" | "context:create" | "context:read" | "context:update" | "context:delete" | "context:compile" | "tool:execute" | "tool:read" | "system:admin" | "system:monitor")[];
    readonly user: readonly ["actor:create", "actor:read", "actor:update", "actor:tick", "actor:start", "actor:stop", "context:create", "context:read", "context:update", "context:compile", "tool:execute", "tool:read", "system:monitor"];
    readonly viewer: readonly ["actor:read", "context:read", "tool:read", "system:monitor"];
};
export type Role = keyof typeof ROLE_PERMISSIONS;
//# sourceMappingURL=types.d.ts.map