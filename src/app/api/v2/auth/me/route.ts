import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getUserById } from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        const user = await getUserById(auth.userId);

        if (!user) {
            return NextResponse.json({
                success: false,
                error: { code: 'USER_NOT_FOUND', message: 'User not found' }
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: {
                id: user.id,
                email: user.email,
                created_at: user.created_at,
                last_login: user.last_login
            }
        });

    } catch (error: any) {
        if (error.message === 'UNAUTHORIZED') {
            return NextResponse.json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
            }, { status: 401 });
        }

        console.error('Get user error:', error);
        return NextResponse.json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to get user' }
        }, { status: 500 });
    }
}
