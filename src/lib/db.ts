
import fs from 'fs/promises';
import path from 'path';
import { Redis } from '@upstash/redis';

const DB_PATH = path.join(process.cwd(), 'db.json');

const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    : null;

const useCloud = () => !!redis;

export interface ImageRecord {
    id: string;
    telegram_file_id: string;
    created_at: number;
    views: number;
    metadata: {
        size: number;
        type: string;
    };
}

async function ensureLocalDb() {
    try {
        await fs.access(DB_PATH);
    } catch {
        await fs.writeFile(DB_PATH, JSON.stringify({ images: [] }));
    }
}

export async function saveImage(record: any, source: 'web' | 'bot' = 'web', userId?: string | number) {
    if (useCloud() && redis) {
        // Use HSET to store as a single Hash object in Redis
        const pipeline = redis.pipeline();
        pipeline.hset(`snap:${record.id}`, {
            ...record,
            views: 0,
            metadata: JSON.stringify(record.metadata)
        });

        // 1. Total Uploads
        pipeline.incr('stats:total_uploads');

        // 2. Source specific stats
        // 2. Source specific stats
        if (source === 'web') {
            pipeline.incr('stats:web_uploads');
        } else if (source === 'bot') {
            pipeline.incr('stats:bot_uploads');
            if (userId) {
                // 3. Unique Users (only for bot users usually)
                pipeline.sadd('stats:users', userId);
            }
        }

        // 3. Media Type stats
        const type = record.metadata.type || '';
        if (type.startsWith('video/') || type === 'image/gif') {
            pipeline.incr('stats:videos');
        } else {
            pipeline.incr('stats:images');
        }

        await pipeline.exec();
        return;
    }

    await ensureLocalDb();
    const content = await fs.readFile(DB_PATH, 'utf-8');
    const db = JSON.parse(content);
    db.images.push({ ...record, views: 0 });
    // Local DB stats not really needed as this is mostly for the bot which runs with Redis
    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
}

export async function getStats() {
    if (useCloud() && redis) {
        const start = Date.now();
        const [totalUploads, totalUsers, webUploads, botUploads, totalImages, totalVideos] = await Promise.all([
            redis.get('stats:total_uploads'),
            redis.scard('stats:users'),
            redis.get('stats:web_uploads'),
            redis.get('stats:bot_uploads'),
            redis.get('stats:images'),
            redis.get('stats:videos')
        ]);
        const ping = Date.now() - start;

        return {
            totalUploads: parseInt(totalUploads as string || '0'),
            totalUsers: totalUsers || 0,
            webUploads: parseInt(webUploads as string || '0'),
            botUploads: parseInt(botUploads as string || '0'),
            totalImages: parseInt(totalImages as string || '0'),
            totalVideos: parseInt(totalVideos as string || '0'),
            ping
        };
    }
    return {
        totalUploads: 0,
        totalUsers: 0,
        webUploads: 0,
        botUploads: 0,
        totalImages: 0,
        totalVideos: 0,
        ping: 0
    };
}

export async function getImage(id: string): Promise<ImageRecord | null> {
    if (useCloud() && redis) {
        // Increment views and get data from the SAME hash object
        await redis.hincrby(`snap:${id}`, 'views', 1);
        const data: any = await redis.hgetall(`snap:${id}`);

        if (!data || Object.keys(data).length === 0) return null;

        return {
            ...data,
            id,
            views: parseInt(data.views || '0'),
            created_at: parseInt(data.created_at),
            metadata: typeof data.metadata === 'string' ? JSON.parse(data.metadata) : data.metadata
        } as ImageRecord;
    }

    try {
        await ensureLocalDb();
        const content = await fs.readFile(DB_PATH, 'utf-8');
        const db = JSON.parse(content);
        const index = db.images.findIndex((img: any) => img.id === id);
        if (index !== -1) {
            db.images[index].views = (db.images[index].views || 0) + 1;
            await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
            return db.images[index];
        }
        return null;
    } catch {
        return null;
    }
}

export async function rateLimit(key: string, limit: number, windowSeconds: number) {
    if (!redis) return { success: true, count: 0 };

    const fullKey = `ratelimit:${key}`;
    const count = await redis.incr(fullKey);

    if (count === 1) {
        await redis.expire(fullKey, windowSeconds);
    }

    return {
        success: count <= limit,
        limit,
        remaining: Math.max(0, limit - count),
        count
    };
}

export function generateId() {
    return Math.random().toString(36).substring(2, 10);
}

export async function registerUser(userId: string | number) {
    if (useCloud() && redis) {
        await redis.sadd('stats:users', userId);
    }
}

// ==================== V2: User & API Key Management ====================

export interface User {
    id: string;
    email: string;
    password_hash: string;
    created_at: number;
    last_login?: number;
}

export interface ApiKey {
    id: string;
    user_id: string;
    key_hash: string;
    name: string;
    prefix: string; // First 8 chars for display
    rate_limit: number;
    created_at: number;
    last_used?: number;
    is_active: boolean;
}

export interface Webhook {
    id: string;
    user_id: string;
    url: string;
    events: string[]; // ['upload', 'delete']
    secret?: string;
    is_active: boolean;
    created_at: number;
}

// User Management
export async function createUser(email: string, passwordHash: string): Promise<User> {
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const user: User = {
        id: userId,
        email: email.toLowerCase(),
        password_hash: passwordHash,
        created_at: Date.now()
    };

    if (useCloud() && redis) {
        await redis.hset(`user:${userId}`, user);
        await redis.set(`user:email:${user.email}`, userId);
    } else {
        await ensureLocalDb();
        const content = await fs.readFile(DB_PATH, 'utf-8');
        const db = JSON.parse(content);
        if (!db.users) db.users = [];
        db.users.push(user);
        await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
    }

    return user;
}

export async function getUserByEmail(email: string): Promise<User | null> {
    if (useCloud() && redis) {
        const userId = await redis.get(`user:email:${email.toLowerCase()}`);
        if (!userId) return null;
        const data: any = await redis.hgetall(`user:${userId}`);
        if (!data || Object.keys(data).length === 0) return null;
        return {
            ...data,
            created_at: parseInt(data.created_at),
            last_login: data.last_login ? parseInt(data.last_login) : undefined
        } as User;
    }

    try {
        await ensureLocalDb();
        const content = await fs.readFile(DB_PATH, 'utf-8');
        const db = JSON.parse(content);
        if (!db.users) return null;
        return db.users.find((u: User) => u.email.toLowerCase() === email.toLowerCase()) || null;
    } catch {
        return null;
    }
}

export async function getUserById(userId: string): Promise<User | null> {
    if (useCloud() && redis) {
        const data: any = await redis.hgetall(`user:${userId}`);
        if (!data || Object.keys(data).length === 0) return null;
        return {
            ...data,
            created_at: parseInt(data.created_at),
            last_login: data.last_login ? parseInt(data.last_login) : undefined
        } as User;
    }

    try {
        await ensureLocalDb();
        const content = await fs.readFile(DB_PATH, 'utf-8');
        const db = JSON.parse(content);
        if (!db.users) return null;
        return db.users.find((u: User) => u.id === userId) || null;
    } catch {
        return null;
    }
}

export async function updateUserLastLogin(userId: string) {
    if (useCloud() && redis) {
        await redis.hset(`user:${userId}`, { last_login: Date.now() });
    } else {
        await ensureLocalDb();
        const content = await fs.readFile(DB_PATH, 'utf-8');
        const db = JSON.parse(content);
        if (db.users) {
            const user = db.users.find((u: User) => u.id === userId);
            if (user) {
                user.last_login = Date.now();
                await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
            }
        }
    }
}

// API Key Management
export async function createApiKey(userId: string, name: string, keyHash: string, keyPrefix: string, rateLimit: number = 100): Promise<ApiKey> {
    const apiKeyId = `key_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const apiKey: ApiKey = {
        id: apiKeyId,
        user_id: userId,
        key_hash: keyHash,
        name,
        prefix: keyPrefix,
        rate_limit: rateLimit,
        created_at: Date.now(),
        is_active: true
    };

    if (useCloud() && redis) {
        await redis.hset(`apikey:${apiKeyId}`, apiKey);
        await redis.sadd(`user:${userId}:keys`, apiKeyId);
    } else {
        await ensureLocalDb();
        const content = await fs.readFile(DB_PATH, 'utf-8');
        const db = JSON.parse(content);
        if (!db.apiKeys) db.apiKeys = [];
        db.apiKeys.push(apiKey);
        await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
    }

    return apiKey;
}

export async function getApiKeyByHash(keyHash: string): Promise<ApiKey | null> {
    if (useCloud() && redis) {
        // We need to search all keys - in production, you'd use a hash index
        // For now, we'll store a mapping: key_hash -> api_key_id
        const apiKeyId = await redis.get(`apikey:hash:${keyHash}`);
        if (!apiKeyId) return null;
        const data: any = await redis.hgetall(`apikey:${apiKeyId}`);
        if (!data || Object.keys(data).length === 0) return null;
        return {
            ...data,
            rate_limit: parseInt(data.rate_limit),
            created_at: parseInt(data.created_at),
            last_used: data.last_used ? parseInt(data.last_used) : undefined,
            is_active: data.is_active === 'true' || data.is_active === true
        } as ApiKey;
    }

    try {
        await ensureLocalDb();
        const content = await fs.readFile(DB_PATH, 'utf-8');
        const db = JSON.parse(content);
        if (!db.apiKeys) return null;
        return db.apiKeys.find((k: ApiKey) => k.key_hash === keyHash && k.is_active) || null;
    } catch {
        return null;
    }
}

export async function getApiKeyById(apiKeyId: string): Promise<ApiKey | null> {
    if (useCloud() && redis) {
        const data: any = await redis.hgetall(`apikey:${apiKeyId}`);
        if (!data || Object.keys(data).length === 0) return null;
        return {
            ...data,
            rate_limit: parseInt(data.rate_limit),
            created_at: parseInt(data.created_at),
            last_used: data.last_used ? parseInt(data.last_used) : undefined,
            is_active: data.is_active === 'true' || data.is_active === true
        } as ApiKey;
    }

    try {
        await ensureLocalDb();
        const content = await fs.readFile(DB_PATH, 'utf-8');
        const db = JSON.parse(content);
        if (!db.apiKeys) return null;
        return db.apiKeys.find((k: ApiKey) => k.id === apiKeyId) || null;
    } catch {
        return null;
    }
}

export async function getUserApiKeys(userId: string): Promise<ApiKey[]> {
    if (useCloud() && redis) {
        const keyIds = await redis.smembers(`user:${userId}:keys`);
        if (!keyIds || keyIds.length === 0) return [];
        const keys = await Promise.all(keyIds.map(id => getApiKeyById(id as string)));
        return keys.filter(k => k !== null) as ApiKey[];
    }

    try {
        await ensureLocalDb();
        const content = await fs.readFile(DB_PATH, 'utf-8');
        const db = JSON.parse(content);
        if (!db.apiKeys) return [];
        return db.apiKeys.filter((k: ApiKey) => k.user_id === userId);
    } catch {
        return [];
    }
}

export async function updateApiKeyLastUsed(apiKeyId: string) {
    if (useCloud() && redis) {
        await redis.hset(`apikey:${apiKeyId}`, { last_used: Date.now() });
    } else {
        await ensureLocalDb();
        const content = await fs.readFile(DB_PATH, 'utf-8');
        const db = JSON.parse(content);
        if (db.apiKeys) {
            const key = db.apiKeys.find((k: ApiKey) => k.id === apiKeyId);
            if (key) {
                key.last_used = Date.now();
                await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
            }
        }
    }
}

export async function revokeApiKey(apiKeyId: string) {
    if (useCloud() && redis) {
        await redis.hset(`apikey:${apiKeyId}`, { is_active: false });
    } else {
        await ensureLocalDb();
        const content = await fs.readFile(DB_PATH, 'utf-8');
        const db = JSON.parse(content);
        if (db.apiKeys) {
            const key = db.apiKeys.find((k: ApiKey) => k.id === apiKeyId);
            if (key) {
                key.is_active = false;
                await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
            }
        }
    }
}

export async function deleteApiKey(apiKeyId: string, userId: string) {
    if (useCloud() && redis) {
        await redis.del(`apikey:${apiKeyId}`);
        await redis.srem(`user:${userId}:keys`, apiKeyId);
    } else {
        await ensureLocalDb();
        const content = await fs.readFile(DB_PATH, 'utf-8');
        const db = JSON.parse(content);
        if (db.apiKeys) {
            db.apiKeys = db.apiKeys.filter((k: ApiKey) => k.id !== apiKeyId);
            await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
        }
    }
}

// Store API key hash mapping for quick lookup
export async function storeApiKeyHashMapping(keyHash: string, apiKeyId: string) {
    if (useCloud() && redis) {
        await redis.set(`apikey:hash:${keyHash}`, apiKeyId);
    }
}

// Webhook Management
export async function createWebhook(userId: string, url: string, events: string[], secret?: string): Promise<Webhook> {
    const webhookId = `wh_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const webhook: Webhook = {
        id: webhookId,
        user_id: userId,
        url,
        events,
        secret,
        is_active: true,
        created_at: Date.now()
    };

    if (useCloud() && redis) {
        await redis.hset(`webhook:${webhookId}`, {
            ...webhook,
            events: JSON.stringify(events)
        });
        await redis.sadd(`user:${userId}:webhooks`, webhookId);
    } else {
        await ensureLocalDb();
        const content = await fs.readFile(DB_PATH, 'utf-8');
        const db = JSON.parse(content);
        if (!db.webhooks) db.webhooks = [];
        db.webhooks.push(webhook);
        await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
    }

    return webhook;
}

export async function getUserWebhooks(userId: string): Promise<Webhook[]> {
    if (useCloud() && redis) {
        const webhookIds = await redis.smembers(`user:${userId}:webhooks`);
        if (!webhookIds || webhookIds.length === 0) return [];
        const webhooks = await Promise.all(webhookIds.map(async (id) => {
            const data: any = await redis.hgetall(`webhook:${id}`);
            if (!data || Object.keys(data).length === 0) return null;
            return {
                ...data,
                events: typeof data.events === 'string' ? JSON.parse(data.events) : data.events,
                created_at: parseInt(data.created_at),
                is_active: data.is_active === 'true' || data.is_active === true
            } as Webhook;
        }));
        return webhooks.filter(w => w !== null) as Webhook[];
    }

    try {
        await ensureLocalDb();
        const content = await fs.readFile(DB_PATH, 'utf-8');
        const db = JSON.parse(content);
        if (!db.webhooks) return [];
        return db.webhooks.filter((w: Webhook) => w.user_id === userId);
    } catch {
        return [];
    }
}

export async function triggerWebhook(webhook: Webhook, event: string, data: any) {
    if (!webhook.is_active || !webhook.events.includes(event)) return;

    try {
        const payload = {
            event,
            timestamp: Date.now(),
            data
        };

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'User-Agent': 'PixEdge-Webhook/1.0'
        };

        if (webhook.secret) {
            // In production, you'd sign the payload with the secret
            headers['X-PixEdge-Signature'] = webhook.secret; // Simplified
        }

        await fetch(webhook.url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });
    } catch (error) {
        console.error('Webhook delivery failed:', error);
    }
}