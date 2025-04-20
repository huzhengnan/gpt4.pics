import prisma from './index'
import { CreditTransaction, CreditTransactionType } from '@prisma/client'

export class CreditAccountRepository {
  async createAccount(userId: string, initialBalance: number = 0): Promise<boolean> {
    try {
      console.log('Create credit account for user:', userId, 'Initial balance:', initialBalance);
      await prisma.creditAccount.create({
        data: {
          userId,
          balance: initialBalance,
          totalEarned: initialBalance,
          totalSpent: 0
        }
      });
      return true;
    } catch (error) {
      console.error('Create credit account error:', error);
      return false;
    }
  }

  async addCredits(userId: string, amount: number, description: string): Promise<{ success: boolean; transaction?: CreditTransaction }> {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const account = await tx.creditAccount.findUnique({
          where: { userId }
        })

        if (!account) {
          return { success: false }
        }

        await tx.creditAccount.update({
          where: { userId },
          data: {
            balance: { increment: amount },
            totalEarned: { increment: amount }
          }
        })

        const transaction = await tx.creditTransaction.create({
          data: {
            userId,
            amount,
            balanceAfter: account.balance + amount,
            type: CreditTransactionType.PURCHASE,
            description
          }
        })

        return { success: true, transaction }
      })

      return result
    } catch (error) {
      console.error('Add credits error:', error)
      return { success: false }
    }
  }

  async getBalance(userId: string): Promise<number> {
    const account = await prisma.creditAccount.findUnique({
      where: { userId }
    })
    return account?.balance ?? 0
  }

  async deductCredits(
    userId: string,
    amount: number,
    description: string
  ): Promise<{ success: boolean; transaction?: CreditTransaction }> {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const account = await tx.creditAccount.findUnique({
          where: { userId }
        })

        if (!account || account.balance < amount) {
          return { success: false }
        }

        await tx.creditAccount.update({
          where: { userId },
          data: {
            balance: { decrement: amount },
            totalSpent: { increment: amount }
          }
        })

        const transaction = await tx.creditTransaction.create({
          data: {
            userId,
            amount: -amount,
            balanceAfter: account.balance - amount,
            type: CreditTransactionType.USAGE, // Changed from 'consumption' to enum value
            description
          }
        })

        return { success: true, transaction }
      })

      return result
    } catch (error) {
      console.error('Deduct credits error:', error)
      return { success: false }
    }
  }
}