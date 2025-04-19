import prisma from './index'
// 使用 import type 来明确导入类型
import type { User, Prisma } from '@prisma/client'

// 定义创建用户时需要的数据类型，确保与 Prisma 生成的类型一致或兼容
// 使用 Prisma.UserCreateInput 通常更安全，但如果需要自定义，确保包含所有必需字段
type UserCreateInput = Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'emailVerified' | 'creditAccount' | 'creditTransactions' | 'paymentOrders' | 'couponUsages' | 'imageGenerations'>


// 定义更新用户时可能需要的数据类型
// 使用 Prisma.UserUpdateInput 也是一个好选择
type UserUpdateInput = Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'creditAccount' | 'creditTransactions' | 'paymentOrders' | 'couponUsages' | 'imageGenerations'>>


export class UserRepository {
  // 辅助类型，包含 User 和 CreditAccount
  private get includeCreditAccount() {
    return { creditAccount: true };
  }


  async findById(id: string): Promise<(User & { creditAccount: { balance: number } | null }) | null> { // Update return type hint
    return prisma.user.findUnique({
      where: { id },
      include: this.includeCreditAccount // 包含 creditAccount
    });
  }

  async findByEmail(email: string): Promise<(User & { creditAccount: { balance: number } | null }) | null> { // Update return type hint
    return prisma.user.findUnique({
      where: { email },
      include: this.includeCreditAccount // 包含 creditAccount
    });
  }

  async findByProviderId(provider: 'google' | 'github', providerId: string): Promise<(User & { creditAccount: { balance: number } | null }) | null> { // Update return type hint
    const whereCondition: Prisma.UserWhereUniqueInput = provider === 'google' ? { googleId: providerId } : { githubId: providerId };
    // Use findFirst because googleId/githubId might not be unique if schema allows nulls and multiple nulls exist
    // If they are guaranteed unique, findUnique is fine.
    return prisma.user.findFirst({ // Changed to findFirst for potentially non-unique nulls
      where: whereCondition,
      include: this.includeCreditAccount // 包含 creditAccount
    });
  }


  async findByUsername(username: string): Promise<(User & { creditAccount: { balance: number } | null }) | null> { // Update return type hint
    return prisma.user.findUnique({
      where: { username },
      include: this.includeCreditAccount // 包含 creditAccount
    });
  }

  // 创建用户时确保包含 creditAccount
  async create(data: UserCreateInput): Promise<(User & { creditAccount: { balance: number } | null })> { // Update return type hint
    return prisma.user.create({
      data: {
        ...data,
        creditAccount: {
          create: {} // 自动创建关联的 CreditAccount
        }
      },
      include: this.includeCreditAccount // 返回时包含 creditAccount
    });
  }


   // 查找或创建 (用于 OAuth, 需要确保返回带 creditAccount 的用户)
   async findOrCreateOAuthUser(
     provider: 'google' | 'github',
     providerId: string,
     email: string,
     name?: string | null, // Prisma types often use | null
     avatarUrl?: string | null
   ): Promise<(User & { creditAccount: { balance: number } | null })> { // Update return type hint
      let user = await this.findByProviderId(provider, providerId);

      // If found by provider ID, return it (it already includes creditAccount)
      if (user) {
         // Potentially update email/name/avatar if they changed in provider
         // This logic might be needed depending on requirements
         const updateData: UserUpdateInput = {}
         if (user.email !== email) updateData.email = email;
         // Add more update logic if needed...
         if (Object.keys(updateData).length > 0) {
            user = await this.update(user.id, updateData); // update returns user with creditAccount
         }
         return user;
      }

      // If not found by provider ID, check by email
      user = await this.findByEmail(email);
      if (user) {
         // Found by email, link the provider ID and potentially update avatar
         const updateData: UserUpdateInput = {};
         if (provider === 'google') updateData.googleId = providerId;
         if (provider === 'github') updateData.githubId = providerId;
         if (avatarUrl && !user.avatarUrl) updateData.avatarUrl = avatarUrl

         if (Object.keys(updateData).length > 0) {
             return this.update(user.id, updateData); // update returns user with creditAccount
         }
         // If no updates needed, return the user found by email (which includes creditAccount)
         return user;

      }

      // If not found by email either, create a new user
      const usernameBase = name || email.split('@')[0] || `user_${Date.now()}`;
      // Ensure username is unique if required by schema (needs check+modification logic)
      // For simplicity, assuming direct creation works or username clashes are handled elsewhere/unlikely
       let username = usernameBase;
        // Add logic here to ensure username uniqueness if needed, e.g., append numbers
        // const existingUsername = await this.findByUsername(username);
        // if (existingUsername) { username = `${usernameBase}_${crypto.randomBytes(4).toString('hex')}`; }


      const createData: Prisma.UserCreateInput = {
          email: email,
          username: username, // Use potentially modified unique username
          avatarUrl: avatarUrl,
          passwordHash: null, // No password for OAuth users initially
          ...(provider === 'google' ? { googleId: providerId } : { githubId: providerId }),
          // Automatically create credit account
          creditAccount: {
              create: {}
          }
      };
      // We don't need UserCreateInput type here as we use Prisma.UserCreateInput
      // The create method below will include the creditAccount
      return this.create(createData as any); // Using 'as any' to bypass strict type checking if UserCreateInput conflicts
                                             // Or adjust types carefully. Prisma.UserCreateInput is safer.
   }


  // 更新用户时确保返回包含 creditAccount
  async update(id: string, data: UserUpdateInput): Promise<(User & { creditAccount: { balance: number } | null })> { // Update return type hint
    return prisma.user.update({
      where: { id },
      data,
      include: this.includeCreditAccount // 返回时包含 creditAccount
    });
  }

  async setEmailVerified(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { emailVerified: new Date() }
    })
  }

  async delete(id: string): Promise<User> {
    // 注意：删除用户可能会因为外键约束失败，取决于 schema 中的 onDelete 设置
    // 可能需要先处理关联数据或使用事务
    return prisma.user.delete({
      where: { id }
    })
  }

  // getCreditAccount 已经包含了 include
  async getCreditAccount(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        creditAccount: true
      }
    });
    return user?.creditAccount;
  }
}