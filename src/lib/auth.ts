import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { getUserById, getApiKeyByHash, updateApiKeyLastUsed } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface JWTPayload {
    userId: string;
    email: string;
    type: 'user' | 'apikey';
}

// Password hashing
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

// JWT Token generation
export function generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
        return null;
    }
}

// API Key generation
export function generateApiKey(): string {
    const prefix = 'px_';
    const randomPart = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    return `${prefix}${randomPart}`;
}

export async function hashApiKey(key: string): Promise<string> {
    // Use a simple hash for API keys (in production, use proper hashing)
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Authentication middleware
export async function authenticateRequest(req: NextRequest): Promise<{ userId: string; email?: string; apiKey?: any } | null> {
    // Try JWT token first (from Authorization header or cookie)
    const authHeader = req.headers.get('authorization');
    let token: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
    } else {
        // Try cookie
        token = req.cookies.get('auth_token')?.value || null;
    }

    if (token) {
        const payload = verifyToken(token);
        if (payload && payload.type === 'user') {
            const user = await getUserById(payload.userId);
            if (user) {
                return { userId: user.id, email: user.email };
            }
        }
    }

    // Try API key (X-API-Key header)
    const apiKey = req.headers.get('x-api-key');
    if (apiKey) {
        const keyHash = await hashApiKey(apiKey);
        const apiKeyRecord = await getApiKeyByHash(keyHash);
        if (apiKeyRecord && apiKeyRecord.is_active) {
            await updateApiKeyLastUsed(apiKeyRecord.id);
            return { userId: apiKeyRecord.user_id, apiKey: apiKeyRecord };
        }
    }

    return null;
}

// Require authentication
export async function requireAuth(req: NextRequest): Promise<{ userId: string; email?: string; apiKey?: any }> {
    const auth = await authenticateRequest(req);
    if (!auth) {
        throw new Error('UNAUTHORIZED');
    }
    return auth;
}
