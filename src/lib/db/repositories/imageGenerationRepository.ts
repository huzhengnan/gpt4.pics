import prisma from './index'
import { ImageGeneration, ImageGenerationStatus } from '@prisma/client'

export class ImageGenerationRepository {
  async create(data: {
    userId: string
    prompt: string
    size: string
    creditsUsed: number
  }): Promise<ImageGeneration> {
    return prisma.imageGeneration.create({
      data: {
        ...data,
        status: ImageGenerationStatus.PENDING
      }
    })
  }

  async updateStatus(id: string, status: ImageGenerationStatus, outputUrl?: string): Promise<ImageGeneration> {
    return prisma.imageGeneration.update({
      where: { id },
      data: {
        status,
        outputUrls: outputUrl ? [outputUrl] : undefined,
        completedAt: status === ImageGenerationStatus.COMPLETED ? new Date() : null
      }
    })
  }

  async findByUserId(userId: string): Promise<ImageGeneration[]> {
    return prisma.imageGeneration.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })
  }
}