import prisma from './index'
import { CreditAccount, CreditTransaction, CreditTransactionType } from '@prisma/client'

export class CreditAccountRepository {
  addCredits(userId: string, credits: number, arg2: string, arg3: string, id: string) {
      throw new Error('Method not implemented.');
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