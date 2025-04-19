'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'; // Import useCallback
import { useRouter } from 'next/navigation';
// 导入 userService 中定义的扁平化用户类型
import type { UserWithBalance } from '@/lib/services/userService'; // 注意: 路径可能需要根据实际结构调整

// Context 中使用的用户类型 (就是 UserWithBalance)
type User = UserWithBalance;

// 认证上下文类型
type AuthContextType = {
  user: User | null;
  loading: boolean; // 表示初始加载或正在刷新用户信息
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (email: string, username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  updateBalance: (newBalance: number) => void; // 本地更新余额状态
  refreshUser: () => Promise<void>; // 重新从后端获取用户信息
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // 初始加载状态
  const router = useRouter(); // Router for potential redirects

  // 获取当前登录用户信息的方法 (调用 API)
  const fetchCurrentUser = useCallback(async () => { // useCallback 防止在 Effect 中不必要的重定义
    setLoading(true); // 开始获取时设置为加载中
    try {
      const response = await fetch('/api/auth/me'); // 假设此 API 返回 { user: UserWithBalance } 或错误
      if (response.ok) {
        const data = await response.json();
        if (data && data.user) {
          setUser(data.user); // 设置从 API 获取的用户信息 (包含 balance)
        } else {
          // API 成功但未返回 user，视为未登录
           console.warn('/api/auth/me returned ok but no user data.');
          setUser(null);
        }
      } else {
         // API 返回错误状态 (如 401 未授权), 清除用户状态
         if(response.status !== 401) { // Don't log expected 401s on logout/session expiry
            console.error(`Failed to fetch current user: ${response.status}`);
         }
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
      setUser(null); // 网络或其他错误，清除用户状态
    } finally {
      setLoading(false); // 获取结束，无论成功与否都结束加载状态
    }
  }, []); // 空依赖数组，此函数本身不会因 props/state 变化而改变

  // 组件挂载时检查认证状态
  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]); // 依赖 fetchCurrentUser (已被 useCallback 包裹)

  // 登录方法 (调用 API)
  const login = async (email: string, password: string) => {
    setLoading(true); // 开始登录，设置加载状态（可选，用于指示登录过程）
    try {
      const response = await fetch('/api/auth/login', { // 假设此 API 使用 userService.login
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json(); // data 应包含 { success: boolean, user?: UserWithBalance, message?: string }

      if (response.ok && data.success && data.user) {
        setUser(data.user); // 登录成功，设置 user state
        setLoading(false);
        return { success: true };
      } else {
        setUser(null); // 登录失败，确保清除 user state
        setLoading(false);
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login API error:', error);
      setUser(null);
      setLoading(false);
      return { success: false, message: 'An error occurred during login' };
    }
  };

  // 注册方法 (调用 API)
  const register = async (email: string, username: string, password: string) => {
     // 注册成功后，通常会重定向到登录页面，所以这里不需要 setLoading 或 setUser
     // API 返回 { success: boolean, message?: string }
    try {
      const response = await fetch('/api/auth/register', { // 假设此 API 使用 userService.register
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, username, password }),
      });
      const data = await response.json();
      return { success: response.ok && data.success, message: data.message };
    } catch (error) {
        console.error('Register API error:', error);
        return { success: false, message: 'An error occurred during registration' };
    }
  };


  // 登出方法 (调用 API)
  const logout = async () => {
    setUser(null); // 立即清除前端状态，提供快速反馈
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      // 不需要等待 API 响应成功才清除状态，因为即使用户的会话在后端未能立即清除，前端也应表现为已登出
    } catch (error) {
      console.error('Logout API error:', error);
      // 错误处理：即使登出 API 调用失败，前端状态也已被清除
    }
    // 可选：登出后重定向
    // router.push('/auth/login');
  };

  // 本地更新余额的方法 (不调用 API)
  const updateBalance = (newBalance: number) => {
    setUser(currentUser => {
      if (currentUser) {
        // 返回一个新的用户对象，只更新余额
        return { ...currentUser, balance: newBalance };
      }
      // 如果当前没有用户，或者用户对象不可变，则不执行任何操作
      // 或者可以打印一个警告 console.warn("Attempted to update balance when no user is logged in.");
      return currentUser; // 返回原始状态或 null
    });
  };

  // 刷新用户数据 (调用 API)
  const refreshUser = useCallback(async () => {
    // 避免在初始加载时或已在刷新时重复调用
    if (!loading) {
       await fetchCurrentUser(); // 直接调用已定义的获取函数
    }
  }, [loading, fetchCurrentUser]); // 依赖 loading 和 fetchCurrentUser


  // 计算 isAuthenticated 状态
  // 现在只依赖 user 是否存在，因为 loading 状态分开管理
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated,
        updateBalance,
        refreshUser, // 提供刷新方法
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// 使用上下文的 Hook (保持不变)
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}