import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/db';
import { hashPassword, generateToken } from '@/lib/auth';

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

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({
                success: false,
                error: { code: 'INVALID_EMAIL', message: 'Invalid email format' }
            }, { status: 400 });
        }

        // Validate password strength
        if (password.length < 8) {
            return NextResponse.json({
                success: false,
                error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 8 characters' }
            }, { status: 400 });
        }

        // Check if user already exists
        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            return NextResponse.json({
                success: false,
                error: { code: 'USER_EXISTS', message: 'User with this email already exists' }
            }, { status: 409 });
        }

        // Create user
        const passwordHash = await hashPassword(password);
        const user = await createUser(email, passwordHash);

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
                    created_at: user.created_at
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
        console.error('Registration error:', error);
        return NextResponse.json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: error.message || 'Registration failed' }
        }, { status: 500 });
    }
}
