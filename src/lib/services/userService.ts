import { UserRepository } from '../db/repositories/userRepository';
// Import Prisma types directly if needed elsewhere, or rely on UserRepository's return types
import type { User as PrismaUser } from '@prisma/client';
import crypto from 'crypto';

// 定义扩展后的 User 类型，与 UserRepository 返回的结构对齐
// It might be simpler to infer this from the repository's return type if possible
// Or define it explicitly but ensure it includes the nested creditAccount structure.
// Let's stick to the flat UserWithBalance for the service layer output.
export type UserWithBalance = Omit<PrismaUser, 'passwordHash' | 'creditAccount'> & { // Omit sensitive and nested fields
  balance: number; // Make balance non-optional here for service output consistency
};

// 用户注册输入类型
type RegisterInput = {
  email: string;
  username: string;
  password: string;
};

// 用户登录输入类型
type LoginInput = {
  email: string;
  password: string;
};

// 用户更新输入类型 (Define UserUpdateInput here)
// This defines the shape of data allowed for updating a user via this service.
// Exclude fields that should not be directly updated or are handled elsewhere.
type UserUpdateInput = Partial<Omit<PrismaUser,
  | 'id'
  | 'passwordHash' // Password updates should likely have a separate method/flow
  | 'emailVerified' // Usually updated via a verification process
  | 'createdAt'
  | 'updatedAt'
  | 'googleId' // Usually set during OAuth connect
  | 'githubId' // Usually set during OAuth connect
  | 'creditAccount' // Balance is handled separately
  | 'creditTransactions'
  | 'paymentOrders'
  | 'couponUsages'
  | 'imageGenerations'
>>;


// Service 方法的结果类型
type AuthResult = {
  success: boolean;
  user?: UserWithBalance;
  message?: string;
};

export class UserService {
  private userRepo: UserRepository;

  constructor() {
    this.userRepo = new UserRepository();
  }

  // 密码哈希函数
  private hashPassword(password: string): string {
    if (!process.env.PASSWORD_SALT) {
      throw new Error('PASSWORD_SALT environment variable is not set.');
    }
    // 使用更安全的哈希算法，例如 scrypt 或 argon2，如果生产环境允许的话
    // 这里保持 crypto 示例
    return crypto.pbkdf2Sync(password, process.env.PASSWORD_SALT, 100000, 64, 'sha512').toString('hex');
  }

  // 验证密码
  private verifyPassword(storedHash: string | null, providedPassword: string): boolean {
    if (!storedHash) return false; // Cannot verify if no hash stored (e.g., OAuth user never set one)
    if (!process.env.PASSWORD_SALT) {
       console.error('PASSWORD_SALT environment variable is not set during password verification.');
       return false; // Or throw an error
    }
    const hash = crypto.pbkdf2Sync(providedPassword, process.env.PASSWORD_SALT, 100000, 64, 'sha512').toString('hex');
    return storedHash === hash;
  }

  // 辅助函数：将 UserRepository 返回的用户对象（带嵌套 creditAccount）转换为扁平的 UserWithBalance
  private formatUserWithBalance(userFromRepo: (PrismaUser & { creditAccount: { balance: number } | null }) | null): UserWithBalance | null {
      if (!userFromRepo) {
          return null;
      }
      const { creditAccount, ...restOfUser } = userFromRepo; // Destructure to remove nested fields
      return {
          ...restOfUser, // Include all other user fields
          balance: creditAccount?.balance ?? 0, // Extract balance, default to 0
      };
  }


  // 用户注册方法 (返回 AuthResult)
  async register(data: RegisterInput): Promise<AuthResult> {
    try {
       // 检查邮箱或用户名是否已存在
       const existingEmail = await this.userRepo.findByEmail(data.email);
       if (existingEmail) {
         return { success: false, message: 'Email already in use' };
       }
       const existingUsername = await this.userRepo.findByUsername(data.username);
       if (existingUsername) {
           return { success: false, message: 'Username already taken' };
       }

      // 创建用户 (UserRepository 返回带 creditAccount 的用户)
      const newUserFromRepo = await this.userRepo.create({
        email: data.email,
        username: data.username,
        passwordHash: this.hashPassword(data.password),
        // Set default values for other fields as needed by your DB schema/logic
        avatarUrl: null,
        googleId: null, // Ensure these can be null in your schema
        githubId: null
      });

      // 格式化用户数据
      const formattedUser = this.formatUserWithBalance(newUserFromRepo);

      // 注册成功通常不直接返回用户信息给前端 API，但保持内部一致性
      return { success: true, user: formattedUser ?? undefined }; // Return formatted user or undefined
    } catch (error: unknown) {
      console.error('Registration service error:', error);
      // More specific error handling based on Prisma errors could be added
      return { success: false, message: error instanceof Error ? error.message : 'An error occurred during registration' };
    }
  }

  // 用户登录方法 (返回 AuthResult)
  async login(data: LoginInput): Promise<AuthResult> {
    try {
      // 查找用户 (UserRepository 返回带 creditAccount 的用户)
      const userFromRepo = await this.userRepo.findByEmail(data.email);
      if (!userFromRepo) {
        return { success: false, message: 'Invalid email or password' }; // Generic message
      }

      // 检查密码
      if (!this.verifyPassword(userFromRepo.passwordHash, data.password)) {
        return { success: false, message: 'Invalid email or password' }; // Generic message
      }

      // 登录成功 - 格式化返回数据
      const formattedUser = this.formatUserWithBalance(userFromRepo);
      if (!formattedUser) {
          // This should theoretically not happen if userFromRepo is valid
          return { success: false, message: 'Failed to format user data after login' };
      }

      return { success: true, user: formattedUser }; // 返回扁平化的 UserWithBalance
    } catch (error: unknown) {
      console.error('Login service error:', error);
      return { success: false, message: error instanceof Error ? error.message : 'An error occurred during login' };
    }
  }

  // 通过ID获取用户信息 (返回 UserWithBalance 或 null)
  async getUserById(id: string): Promise<UserWithBalance | null> {
    const userFromRepo = await this.userRepo.findById(id);
    return this.formatUserWithBalance(userFromRepo);
  }

  // 通过邮箱获取用户信息 (返回 UserWithBalance 或 null)
  async getUserByEmail(email: string): Promise<UserWithBalance | null> {
    const userFromRepo = await this.userRepo.findByEmail(email);
    return this.formatUserWithBalance(userFromRepo);
  }

  // 更新用户信息 (返回 UserWithBalance)
  // The method now correctly uses the locally defined UserUpdateInput type.
  async updateUser(id: string, data: UserUpdateInput): Promise<UserWithBalance | null> {
     try {
         // The input 'data' should already conform to UserUpdateInput,
         // excluding forbidden fields based on the type definition.
         // Additional runtime filtering might be added for extra safety if needed.
         const safeUpdateData = data; // data is already constrained by the type

        const updatedUserFromRepo = await this.userRepo.update(id, safeUpdateData); // Pass the validated data to repo
        return this.formatUserWithBalance(updatedUserFromRepo);
     } catch (error) {
         console.error(`Failed to update user ${id}:`, error);
         // Consider more specific error handling, e.g., Prisma known errors
         // like P2025 (Record not found)
         return null;
     }
  }

  // OAuth登录/注册 (返回 AuthResult)
  async handleOAuthLogin(provider: 'google' | 'github', providerId: string, email: string, name?: string, avatarUrl?: string): Promise<AuthResult> {
     try {
       // findOrCreateOAuthUser in repo handles DB interaction and returns user with creditAccount
       const userFromRepo = await this.userRepo.findOrCreateOAuthUser(provider, providerId, email, name ?? undefined, avatarUrl ?? undefined); // Pass undefined if name/avatarUrl are null

       // Format the result
       const formattedUser = this.formatUserWithBalance(userFromRepo);
       if (!formattedUser) {
         return { success: false, message: 'Failed to format user data after OAuth login' };
       }

       return { success: true, user: formattedUser };
     } catch (error: unknown) {
       console.error('OAuth login service error:', error);
       return { success: false, message: error instanceof Error ? error.message : 'An error occurred during OAuth login' };
     }
  }

  // 获取用户余额 (保持不变，直接返回数字)
  async getUserBalance(userId: string): Promise<number> {
    try {
      const creditAccount = await this.userRepo.getCreditAccount(userId);
      return creditAccount?.balance ?? 0;
    } catch (error) {
      console.error(`Get balance error for user ${userId}:`, error);
      // Consider how to handle errors - rethrow, return specific error code or default value?
      return 0; // Returning 0 might mask issues
    }
  }

  // **未来可能添加:** 更新余额的专用服务方法
  // async updateUserBalance(userId: string, amountChange: number): Promise<{success: boolean, newBalance?: number, message?: string}> {
  //   // This would likely involve a transaction in the repository layer
  //   // 1. Fetch current balance
  //   // 2. Check if update is valid (e.g., sufficient funds for deduction)
  //   // 3. Update balance in DB (transaction recommended)
  //   // 4. Return result
  // }
}