import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import * as sharp from 'sharp'
import {
  BatchCropDto,
  BatchFilterDto,
  BatchProcessingResponseDto,
  BatchProcessingResultDto,
  BatchResizeDto,
} from './dto/batch-processing.dto'
import {
  CropImageDto,
  FilterImageDto,
  ImageFormat,
  ResizeImageDto,
} from './dto/image-processing.dto'
import { WorkerPoolService } from './services/worker-pool.service'

@Injectable()
export class ImageProcessingService {
  private readonly logger = new Logger(ImageProcessingService.name)

  constructor(private readonly workerPool: WorkerPoolService) {}

  async resizeImage(imageBuffer: Buffer, resizeDto: ResizeImageDto): Promise<Buffer> {
    try {
      const result = await this.workerPool.processTask('resize', imageBuffer, resizeDto)

      if (!result.success) {
        throw new BadRequestException(result.error || 'Failed to resize image')
      }

      this.logger.log(
        `Image resized to ${resizeDto.width}x${resizeDto.height} with format ${resizeDto.format || 'jpeg'}`,
      )
      return result.data as Buffer
    } catch (error) {
      this.logger.error('Error resizing image:', error)
      throw new BadRequestException('Failed to resize image')
    }
  }

  async cropImage(imageBuffer: Buffer, cropDto: CropImageDto): Promise<Buffer> {
    try {
      const result = await this.workerPool.processTask('crop', imageBuffer, cropDto)

      if (!result.success) {
        throw new BadRequestException(result.error || 'Failed to crop image')
      }

      this.logger.log(
        `Image cropped to ${cropDto.width}x${cropDto.height} at position (${cropDto.left}, ${cropDto.top})`,
      )
      return result.data as Buffer
    } catch (error) {
      this.logger.error('Error cropping image:', error)
      throw new BadRequestException('Failed to crop image')
    }
  }

  async filterImage(imageBuffer: Buffer, filterDto: FilterImageDto): Promise<Buffer> {
    try {
      const result = await this.workerPool.processTask('filter', imageBuffer, filterDto)

      if (!result.success) {
        throw new BadRequestException(result.error || 'Failed to apply filter to image')
      }

      this.logger.log(`Filter ${filterDto.filterType} applied to image`)
      return result.data as Buffer
    } catch (error) {
      this.logger.error('Error applying filter to image:', error)
      throw new BadRequestException('Failed to apply filter to image')
    }
  }

  async getImageMetadata(imageBuffer: Buffer): Promise<sharp.Metadata> {
    try {
      const metadata = await sharp(imageBuffer).metadata()
      return metadata
    } catch (error) {
      this.logger.error('Error getting image metadata:', error)
      throw new BadRequestException('Failed to get image metadata')
    }
  }

  private applyFormat(
    sharpInstance: sharp.Sharp,
    format: ImageFormat,
    quality: number,
  ): sharp.Sharp {
    switch (format) {
      case ImageFormat.JPEG:
        return sharpInstance.jpeg({ quality })
      case ImageFormat.PNG:
        return sharpInstance.png({ quality })
      case ImageFormat.WEBP:
        return sharpInstance.webp({ quality })
      case ImageFormat.AVIF:
        return sharpInstance.avif({ quality })
      default:
        return sharpInstance.jpeg({ quality })
    }
  }

  getMimeType(format: ImageFormat): string {
    switch (format) {
      case ImageFormat.JPEG:
        return 'image/jpeg'
      case ImageFormat.PNG:
        return 'image/png'
      case ImageFormat.WEBP:
        return 'image/webp'
      case ImageFormat.AVIF:
        return 'image/avif'
      default:
        return 'image/jpeg'
    }
  }

  // Batch processing methods
  async batchResize(
    files: Express.Multer.File[],
    resizeDto: BatchResizeDto,
  ): Promise<BatchProcessingResponseDto> {
    const batchId = this.generateBatchId()
    const startTime = Date.now()

    const tasks = files.map((file) => ({
      type: 'resize' as const,
      imageBuffer: file.buffer,
      options: resizeDto,
    }))

    const results = await this.workerPool.processBatch(tasks)
    const processedResults = this.processResults(files, results)

    const totalProcessingTime = Date.now() - startTime
    const successCount = processedResults.filter((r) => r.success).length
    const failureCount = processedResults.length - successCount

    return {
      batchId,
      totalImages: files.length,
      successCount,
      failureCount,
      totalProcessingTime,
      results: processedResults,
    }
  }

  async batchCrop(
    files: Express.Multer.File[],
    cropDto: BatchCropDto,
  ): Promise<BatchProcessingResponseDto> {
    const batchId = this.generateBatchId()
    const startTime = Date.now()

    const tasks = files.map((file) => ({
      type: 'crop' as const,
      imageBuffer: file.buffer,
      options: cropDto,
    }))

    const results = await this.workerPool.processBatch(tasks)
    const processedResults = this.processResults(files, results)

    const totalProcessingTime = Date.now() - startTime
    const successCount = processedResults.filter((r) => r.success).length
    const failureCount = processedResults.length - successCount

    return {
      batchId,
      totalImages: files.length,
      successCount,
      failureCount,
      totalProcessingTime,
      results: processedResults,
    }
  }

  async batchFilter(
    files: Express.Multer.File[],
    filterDto: BatchFilterDto,
  ): Promise<BatchProcessingResponseDto> {
    const batchId = this.generateBatchId()
    const startTime = Date.now()

    const tasks = files.map((file) => ({
      type: 'filter' as const,
      imageBuffer: file.buffer,
      options: filterDto,
    }))

    const results = await this.workerPool.processBatch(tasks)
    const processedResults = this.processResults(files, results)

    const totalProcessingTime = Date.now() - startTime
    const successCount = processedResults.filter((r) => r.success).length
    const failureCount = processedResults.length - successCount

    return {
      batchId,
      totalImages: files.length,
      successCount,
      failureCount,
      totalProcessingTime,
      results: processedResults,
    }
  }

  private processResults(
    files: Express.Multer.File[],
    results: Array<{ success: boolean; data?: Buffer; error?: string; metadata?: sharp.Metadata }>,
  ): BatchProcessingResultDto[] {
    return files.map((file, index) => {
      const result = results[index]

      if (result.success && result.data && result.metadata) {
        return {
          success: true,
          filename: file.originalname,
          mimeType: file.mimetype,
          size: result.data.length,
          width: result.metadata.width,
          height: result.metadata.height,
        }
      } else {
        return {
          success: false,
          filename: file.originalname,
          error: result.error || 'Unknown error',
        }
      }
    })
  }

  private generateBatchId(): string {
    return `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Worker pool stats
  getWorkerPoolStats() {
    return this.workerPool.getStats()
  }
}
