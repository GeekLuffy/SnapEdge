import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createApiKey, getUserApiKeys, storeApiKeyHashMapping } from '@/lib/db';
import { generateApiKey, hashApiKey } from '@/lib/auth';

// GET - List all API keys for the authenticated user
export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        const keys = await getUserApiKeys(auth.userId);

        return NextResponse.json({
            success: true,
            data: keys.map(key => ({
                id: key.id,
                name: key.name,
                prefix: key.prefix,
                rate_limit: key.rate_limit,
                created_at: key.created_at,
                last_used: key.last_used,
                is_active: key.is_active
            }))
        });

    } catch (error: any) {
        if (error.message === 'UNAUTHORIZED') {
            return NextResponse.json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
            }, { status: 401 });
        }

        console.error('Get API keys error:', error);
        return NextResponse.json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to get API keys' }
        }, { status: 500 });
    }
}

// POST - Create a new API key
export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        const body = await req.json();
        const { name, rate_limit } = body;

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return NextResponse.json({
                success: false,
                error: { code: 'MISSING_FIELDS', message: 'API key name is required' }
            }, { status: 400 });
        }

        // Generate API key
        const apiKey = generateApiKey();
        const keyHash = await hashApiKey(apiKey);
        const keyPrefix = apiKey.substring(0, 11); // px_ + 8 chars

        // Create API key record
        const apiKeyRecord = await createApiKey(
            auth.userId,
            name.trim(),
            keyHash,
            keyPrefix,
            rate_limit && rate_limit > 0 ? rate_limit : 100
        );

        // Store hash mapping for quick lookup
        await storeApiKeyHashMapping(keyHash, apiKeyRecord.id);

        return NextResponse.json({
            success: true,
            data: {
                id: apiKeyRecord.id,
                name: apiKeyRecord.name,
                key: apiKey, // Only returned once!
                prefix: apiKeyRecord.prefix,
                rate_limit: apiKeyRecord.rate_limit,
                created_at: apiKeyRecord.created_at
            }
        });

    } catch (error: any) {
        if (error.message === 'UNAUTHORIZED') {
            return NextResponse.json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
            }, { status: 401 });
        }

        console.error('Create API key error:', error);
        return NextResponse.json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to create API key' }
        }, { status: 500 });
    }
}
