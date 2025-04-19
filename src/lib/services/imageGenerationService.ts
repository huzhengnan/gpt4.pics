import { ImageGenerationRepository } from '../db/repositories/imageGenerationRepository'
import { CreditAccountRepository } from '../db/repositories/creditAccountRepository'
import { ApiyiService } from './third-party/apiyiService'
import type { ImageGenerationRequest } from '@/types/image'
import { ImageGenerationStatus } from '@prisma/client'

export class ImageGenerationService {
  private imageRepo: ImageGenerationRepository
  private creditRepo: CreditAccountRepository
  private apiyiService: ApiyiService

  constructor() {
    this.imageRepo = new ImageGenerationRepository()
    this.creditRepo = new CreditAccountRepository()
    this.apiyiService = new ApiyiService()
  }

  async generateImage(userId: string, request: ImageGenerationRequest) {
    // 检查积分余额
    const deductResult = await this.creditRepo.deductCredits(
      userId,
      4, // 默认消耗1积分
      `Generate image: ${request.prompt}` // Changed to English
    )

    if (!deductResult.success) {
      throw new Error('Insufficient credits') // Changed error message to English
    }

    // 创建图片生成记录
    const generation = await this.imageRepo.create({
      userId,
      prompt: request.prompt,
      size: request.size || '1024x1024',
      creditsUsed: 4
    })

    try {
      // 调用 Apiyi 服务生成图片
      const result = await this.apiyiService.generateImage(
        request.prompt,
        request.size || '1024x1024'
      )

      // 更新图片生成记录
      await this.imageRepo.updateStatus(
        generation.id,
        ImageGenerationStatus.COMPLETED,
        result.data[0].url
      )

      return {
        success: true,
        data: result.data[0],
        created: result.created
      }
    } catch (error) {
      await this.imageRepo.updateStatus(
        generation.id,
        ImageGenerationStatus.FAILED,
        error instanceof Error ? error.message : 'Unknown error'
      )
      throw error
    }
  }

  // Add proper return type and make it public
  public async processImageGenerationRequest(userId: string, request: ImageGenerationRequest) {
    return this.generateImage(userId, request)
  }
}