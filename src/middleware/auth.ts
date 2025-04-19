import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verify } from 'jsonwebtoken';

// 需要认证的路径
const protectedPaths = [
  '/dashboard',
  '/profile',
  '/api/user',
  '/api/credits',
  '/api/images',
];

// 不需要认证的API路径
const publicApiPaths = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 检查是否是受保护的路径
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  const isPublicApiPath = publicApiPaths.some(path => pathname.startsWith(path));
  
  // 如果不是受保护的路径，直接放行
  if (!isProtectedPath || isPublicApiPath) {
    return NextResponse.next();
  }
  
  // 获取认证令牌
  const token = request.cookies.get('auth_token')?.value;
  
  // 如果没有令牌，重定向到登录页面
  if (!token) {
    // 如果是API请求，返回401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // 否则重定向到登录页面
    const url = new URL('/auth/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }
  
  try {
    // 验证令牌
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    verify(token, JWT_SECRET);
    
    // 令牌有效，放行请求
    return NextResponse.next();
  } catch (error) {
    // 令牌无效，清除cookie并重定向到登录页面
    console.error('Token verification failed:', error);
    const response = NextResponse.redirect(
      new URL('/auth/login', request.url)
    );
    
    response.cookies.set({
      name: 'auth_token',
      value: '',
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0,
    });
    
    return response;
  }
}

// 配置中间件应用的路径
export const config = {
  matcher: [
    /*
     * 匹配所有需要认证的路径:
     * - /dashboard, /profile 等页面
     * - /api/ 下的所有路径，除了 /api/auth
     */
    '/dashboard/:path*',
    '/profile/:path*',
    '/api/((?!auth).)*',
  ],
};