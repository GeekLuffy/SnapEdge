import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, updateUserLastLogin } from '@/lib/db';
import { verifyPassword, generateToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({
                success: false,
                error: { code: 'MISSING_FIELDS', message: 'Email and password are required' }
            }, { status: 400 });
        }

        // Get user
        const user = await getUserByEmail(email);
        if (!user) {
            return NextResponse.json({
                success: false,
                error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
            }, { status: 401 });
        }

        // Verify password
        const isValid = await verifyPassword(password, user.password_hash);
        if (!isValid) {
            return NextResponse.json({
                success: false,
                error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
            }, { status: 401 });
        }

        // Update last login
        await updateUserLastLogin(user.id);

        // Generate token
        const token = generateToken({
            userId: user.id,
            email: user.email,
            type: 'user'
        });

        const response = NextResponse.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    created_at: user.created_at,
                    last_login: Date.now()
                },
                token
            }
        });

        // Set HTTP-only cookie
        response.cookies.set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days
        });

        return response;

    } catch (error: any) {
        console.error('Login error:', error);
        return NextResponse.json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: error.message || 'Login failed' }
        }, { status: 500 });
    }
}
