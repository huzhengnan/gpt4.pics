import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services/userService';

const userService = new UserService();

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, username, password } = body;

        // Validate input
        if (!email || !username || !password) {
            return NextResponse.json(
                { success: false, message: 'Email, username and password are required' },
                { status: 400 }
            );
        }

        // Register user
        const result = await userService.register({ email, username, password });

        if (!result.success) {
            return NextResponse.json(
                { success: false, message: result.message },
                { status: 400 } // Corrected status to 400 for client-side errors like "email exists"
            );
        }

        // The user object is available after successful registration in result.user
        if (!result.user) {
            // This indicates an internal issue if registration succeeded but user wasn't returned
            console.error('Registration successful but user data is missing in the result.');
            return NextResponse.json(
                { success: false, message: 'Internal server error after registration.' },
                { status: 500 }
            );
        }

        // result.user is already UserWithBalance and does not contain passwordHash.
        // Assign it directly to safeUser.
        const safeUser = result.user;

        // Return the registered user's safe data (excluding sensitive info)
        return NextResponse.json({
            success: true,
            message: 'Registration successful',
            user: safeUser // Return the UserWithBalance object
        });
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { success: false, message: 'An error occurred during registration' },
            { status: 500 }
        );
    }
}