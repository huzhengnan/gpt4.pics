import { NextResponse } from 'next/server';
import { AuthCookieService } from '@/lib/services/authCookieService';
import { UserService } from '@/lib/services/userService';

const userService = new UserService();

export async function GET() {
    try {
        const token = await AuthCookieService.getAuthToken();
        
        if (!token) {
            return NextResponse.json(
                { success: false, message: 'Not authenticated' },
                { status: 401 }
            );
        }
        
        const decoded = AuthCookieService.verifyToken(token);
        if (!decoded) {
            return NextResponse.json(
                { success: false, message: 'Invalid token' },
                { status: 401 }
            );
        }
        
        const balance = await userService.getUserBalance(decoded.id);
        
        return NextResponse.json({
            success: true,
            balance
        });
    } catch (error) {
        console.error('Get balance error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to get balance' },
            { status: 500 }
        );
    }
}