import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getApiKeyById, revokeApiKey, deleteApiKey } from '@/lib/db';

// DELETE - Revoke or delete an API key
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await requireAuth(req);
        const { id } = await params;

        const apiKey = await getApiKeyById(id);
        if (!apiKey) {
            return NextResponse.json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'API key not found' }
            }, { status: 404 });
        }

        // Verify ownership
        if (apiKey.user_id !== auth.userId) {
            return NextResponse.json({
                success: false,
                error: { code: 'FORBIDDEN', message: 'You do not have permission to delete this API key' }
            }, { status: 403 });
        }

        // Delete the API key
        await deleteApiKey(id, auth.userId);

        return NextResponse.json({
            success: true,
            message: 'API key deleted successfully'
        });

    } catch (error: any) {
        if (error.message === 'UNAUTHORIZED') {
            return NextResponse.json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
            }, { status: 401 });
        }

        console.error('Delete API key error:', error);
        return NextResponse.json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to delete API key' }
        }, { status: 500 });
    }
}

// PATCH - Revoke (deactivate) an API key
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await requireAuth(req);
        const { id } = await params;

        const apiKey = await getApiKeyById(id);
        if (!apiKey) {
            return NextResponse.json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'API key not found' }
            }, { status: 404 });
        }

        // Verify ownership
        if (apiKey.user_id !== auth.userId) {
            return NextResponse.json({
                success: false,
                error: { code: 'FORBIDDEN', message: 'You do not have permission to modify this API key' }
            }, { status: 403 });
        }

        // Revoke the API key
        await revokeApiKey(id);

        return NextResponse.json({
            success: true,
            message: 'API key revoked successfully'
        });

    } catch (error: any) {
        if (error.message === 'UNAUTHORIZED') {
            return NextResponse.json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
            }, { status: 401 });
        }

        console.error('Revoke API key error:', error);
        return NextResponse.json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to revoke API key' }
        }, { status: 500 });
    }
}
