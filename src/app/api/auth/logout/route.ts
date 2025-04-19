import { NextResponse } from 'next/server';
import { AuthCookieService } from '@/lib/services/authCookieService';

export async function POST() {
    try {
        await AuthCookieService.clearAuthCookie();

        return NextResponse.json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json(
            { success: false, message: 'An error occurred during logout' },
            { status: 500 }
        );
    }
}