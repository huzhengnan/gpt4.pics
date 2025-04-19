import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services/userService';
import { AuthCookieService } from '@/lib/services/authCookieService';
// Import UserRepository to fetch the full user object
import { UserRepository } from '@/lib/db/repositories/userRepository';

const userService = new UserService();
const userRepo = new UserRepository(); // Instantiate repository

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { success: false, message: 'Email and password are required' },
                { status: 400 }
            );
        }


        const result = await userService.login({ email, password });

        if (!result.success || !result.user) {
            return NextResponse.json(
                { success: false, message: result.message },
                { status: 401 }
            );
        }

        // Login successful, result.user is UserWithBalance.
        // Fetch the full user object again directly from the repository
        // to satisfy the expected type for AuthCookieService.setAuthCookie.
        // NOTE: This adds an extra DB call. The better long-term fix is to
        // adjust AuthCookieService.setAuthCookie's signature to accept only
        // required non-sensitive fields (e.g., Pick<User, 'id'> or UserWithBalance).
        const fullUserForCookie = await userRepo.findById(result.user.id);

        if (!fullUserForCookie) {
             // This case should ideally not happen if login just succeeded.
             console.error(`Consistency error: User ${result.user.id} not found immediately after login.`);
             return NextResponse.json(
                 { success: false, message: 'An internal error occurred after login.' },
                 { status: 500 }
             );
        }

        // Set auth cookie using the fetched full user object.
        // This now matches the expected type.
        await AuthCookieService.setAuthCookie(fullUserForCookie);

        // Prepare the response using the safe user data (UserWithBalance) from the login result.
        // No need to destructure passwordHash as result.user doesn't contain it.
        const safeUser = result.user;

        return NextResponse.json({
            success: true,
            message: 'Login successful',
            user: safeUser // Return the UserWithBalance object
        });
    } catch (error) {
        console.error('Login API error:', error); // Log the specific error
        return NextResponse.json(
            { success: false, message: 'An error occurred during login' },
            { status: 500 }
        );
    }
}