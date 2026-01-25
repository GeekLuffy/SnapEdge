import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createWebhook, getUserWebhooks } from '@/lib/db';

// GET - List all webhooks for the authenticated user
export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        const webhooks = await getUserWebhooks(auth.userId);

        return NextResponse.json({
            success: true,
            data: webhooks.map(webhook => ({
                id: webhook.id,
                url: webhook.url,
                events: webhook.events,
                is_active: webhook.is_active,
                created_at: webhook.created_at
            }))
        });

    } catch (error: any) {
        if (error.message === 'UNAUTHORIZED') {
            return NextResponse.json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
            }, { status: 401 });
        }

        console.error('Get webhooks error:', error);
        return NextResponse.json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to get webhooks' }
        }, { status: 500 });
    }
}

// POST - Create a new webhook
export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        const body = await req.json();
        const { url, events, secret } = body;

        if (!url || typeof url !== 'string') {
            return NextResponse.json({
                success: false,
                error: { code: 'MISSING_FIELDS', message: 'Webhook URL is required' }
            }, { status: 400 });
        }

        // Validate URL
        try {
            new URL(url);
        } catch {
            return NextResponse.json({
                success: false,
                error: { code: 'INVALID_URL', message: 'Invalid webhook URL format' }
            }, { status: 400 });
        }

        // Validate events
        const validEvents = ['upload', 'delete'];
        const webhookEvents = events && Array.isArray(events) 
            ? events.filter((e: string) => validEvents.includes(e))
            : ['upload'];

        if (webhookEvents.length === 0) {
            return NextResponse.json({
                success: false,
                error: { code: 'INVALID_EVENTS', message: 'At least one valid event is required (upload, delete)' }
            }, { status: 400 });
        }

        // Create webhook
        const webhook = await createWebhook(auth.userId, url, webhookEvents, secret);

        return NextResponse.json({
            success: true,
            data: {
                id: webhook.id,
                url: webhook.url,
                events: webhook.events,
                is_active: webhook.is_active,
                created_at: webhook.created_at
            }
        });

    } catch (error: any) {
        if (error.message === 'UNAUTHORIZED') {
            return NextResponse.json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
            }, { status: 401 });
        }

        console.error('Create webhook error:', error);
        return NextResponse.json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to create webhook' }
        }, { status: 500 });
    }
}
