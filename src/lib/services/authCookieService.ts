import { cookies } from 'next/headers';
import { sign, verify } from 'jsonwebtoken';
import { User } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const AUTH_COOKIE_NAME = 'auth_token';

export class AuthCookieService {
  // Create and set auth token
  static async setAuthCookie(user: User) {
    const token = sign(
      {
        id: user.id,
        email: user.email,
        username: user.username
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const cookieStore = await cookies();
    cookieStore.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return token;
  }

  // Clear auth cookie
  static async clearAuthCookie() {
    const cookieStore = await cookies();
    cookieStore.set({
      name: AUTH_COOKIE_NAME,
      value: '',
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0, // Expire immediately
    });
  }

  // Get auth token from cookie
  static async getAuthToken(): Promise<string | undefined> {
    const cookieStore = await cookies();
    return cookieStore.get(AUTH_COOKIE_NAME)?.value;
  }

  // Verify auth token and return decoded data
  static verifyToken(token: string) {
    try {
      return verify(token, JWT_SECRET) as {
        id: string;
        email: string;
        username: string;
      };
    } catch (error) {
      return null;
    }
  }
}