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
        status: ImageGenerationStatus.PENDING,
        outputUrls: []
      }
    })
  }

  async updateStatus(
    id: string, 
    status: ImageGenerationStatus, 
    errorMessage?: string,
    outputUrls?: string[]
  ): Promise<ImageGeneration> {
    return prisma.imageGeneration.update({
      where: { id },
      data: {
        status,
        errorMessage,
        outputUrls: outputUrls || undefined,
        completedAt: status === ImageGenerationStatus.COMPLETED ? new Date() : undefined
      }
    })
  }

  async findById(id: string): Promise<ImageGeneration | null> {
    return prisma.imageGeneration.findUnique({
      where: { id }
    })
  }

  async findByUserId(userId: string): Promise<ImageGeneration[]> {
    return prisma.imageGeneration.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })
  }
}