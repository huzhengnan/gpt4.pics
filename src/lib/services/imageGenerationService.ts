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
      4,
      `Generate image: ${request.prompt}`
    )

    if (!deductResult.success) {
      throw new Error('Insufficient credits')
    }

    // 创建待处理的图片生成记录
    const generation = await this.imageRepo.create({
      userId,
      prompt: request.prompt,
      size: request.size || '1024x1024',
      creditsUsed: 4,
      // Remove status and outputUrls as they should be handled by the repository
    })

    // 异步处理图片生成
    this.processImageGeneration(generation.id, request).catch(error => {
      console.error('Image generation processing error:', error)
    })

    // 立即返回生成记录
    return {
      success: true,
      generationId: generation.id,
      status: ImageGenerationStatus.PENDING
    }
  }

  private async processImageGeneration(generationId: string, request: ImageGenerationRequest) {
    try {
      // 更新状态为处理中
      await this.imageRepo.updateStatus(
        generationId,
        ImageGenerationStatus.PROCESSING
      )

      // 调用 Apiyi 服务生成图片
      const result = await this.apiyiService.generateImage(
        request.prompt,
        request.size || '1024x1024'
      )

      // 更新图片生成记录为完成状态
      await this.imageRepo.updateStatus(
        generationId,
        ImageGenerationStatus.COMPLETED,
        undefined,
        [result.data[0].url]
      )
    } catch (error) {
      // 更新图片生成记录为失败状态
      await this.imageRepo.updateStatus(
        generationId,
        ImageGenerationStatus.FAILED,
        error instanceof Error ? error.message : 'Unknown error'
      )
    }
  }

  public async processImageGenerationRequest(userId: string, request: ImageGenerationRequest) {
    return this.generateImage(userId, request)
  }

  // 新增：获取生成状态的方法
  public async getGenerationStatus(generationId: string) {
    return this.imageRepo.findById(generationId)
  }
}