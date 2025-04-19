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
        
        const user = await userService.getUserById(decoded.id);
        
        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }
        
        // The 'user' object is already of type UserWithBalance and doesn't contain passwordHash.
        // No need to destructure here. We can send 'user' directly.
        const safeUser = user;
        
        return NextResponse.json({
            success: true,
            user: safeUser // Return the safe UserWithBalance object
        });
    } catch (error) {
        console.error('Auth check error:', error);
        return NextResponse.json(
            { success: false, message: 'Authentication failed' },
            { status: 401 }
        );
    }
}