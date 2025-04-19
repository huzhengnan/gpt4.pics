import prisma from './index'
import { CreditTransaction } from '@prisma/client'

export class CreditTransactionRepository {
  async create(data: Omit<CreditTransaction, 'id' | 'createdAt'>): Promise<CreditTransaction> {
    return prisma.creditTransaction.create({
      data
    })
  }

  async findByUserId(userId: string): Promise<CreditTransaction[]> {
    return prisma.creditTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })
  }
}