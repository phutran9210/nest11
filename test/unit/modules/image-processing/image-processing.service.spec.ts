import { BadRequestException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import * as sharp from 'sharp'
import {
  CropImageDto,
  FilterImageDto,
  FilterType,
  ImageFormat,
  ResizeImageDto,
} from '../../../src/modules/image-processing/dto/image-processing.dto'
import { ImageProcessingService } from '../../../src/modules/image-processing/image-processing.service'

describe('ImageProcessingService', () => {
  let service: ImageProcessingService
  let mockImageBuffer: Buffer

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImageProcessingService],
    }).compile()

    service = module.get<ImageProcessingService>(ImageProcessingService)

    // Create a mock image buffer (1x1 pixel PNG)
    mockImageBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 1 },
      },
    })
      .png()
      .toBuffer()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('resizeImage', () => {
    it('should resize image successfully', async () => {
      const resizeDto: ResizeImageDto = {
        width: 50,
        height: 50,
        format: ImageFormat.JPEG,
        quality: 80,
        maintainAspectRatio: true,
      }

      const result = await service.resizeImage(mockImageBuffer, resizeDto)
      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBeGreaterThan(0)

      const metadata = await sharp(result).metadata()
      expect(metadata.width).toBeLessThanOrEqual(50)
      expect(metadata.height).toBeLessThanOrEqual(50)
    })

    it('should throw BadRequestException for invalid image', async () => {
      const resizeDto: ResizeImageDto = {
        width: 50,
        height: 50,
      }

      const invalidBuffer = Buffer.from('invalid image data')

      await expect(service.resizeImage(invalidBuffer, resizeDto)).rejects.toThrow(
        BadRequestException,
      )
    })
  })

  describe('cropImage', () => {
    it('should crop image successfully', async () => {
      const cropDto: CropImageDto = {
        left: 10,
        top: 10,
        width: 50,
        height: 50,
        format: ImageFormat.PNG,
        quality: 90,
      }

      const result = await service.cropImage(mockImageBuffer, cropDto)
      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBeGreaterThan(0)

      const metadata = await sharp(result).metadata()
      expect(metadata.width).toBe(50)
      expect(metadata.height).toBe(50)
    })

    it('should throw BadRequestException for invalid crop parameters', async () => {
      const cropDto: CropImageDto = {
        left: 200, // Beyond image bounds
        top: 200,
        width: 50,
        height: 50,
      }

      await expect(service.cropImage(mockImageBuffer, cropDto)).rejects.toThrow(BadRequestException)
    })
  })

  describe('filterImage', () => {
    it('should apply blur filter successfully', async () => {
      const filterDto: FilterImageDto = {
        filterType: FilterType.BLUR,
        value: 3,
        format: ImageFormat.JPEG,
        quality: 90,
      }

      const result = await service.filterImage(mockImageBuffer, filterDto)
      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should apply grayscale filter successfully', async () => {
      const filterDto: FilterImageDto = {
        filterType: FilterType.GRAYSCALE,
        format: ImageFormat.PNG,
        quality: 90,
      }

      const result = await service.filterImage(mockImageBuffer, filterDto)
      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should apply brightness filter successfully', async () => {
      const filterDto: FilterImageDto = {
        filterType: FilterType.BRIGHTNESS,
        value: 1.5,
        format: ImageFormat.WEBP,
        quality: 85,
      }

      const result = await service.filterImage(mockImageBuffer, filterDto)
      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should throw BadRequestException for invalid filter', async () => {
      const filterDto: FilterImageDto = {
        filterType: 'invalid' as FilterType,
        format: ImageFormat.JPEG,
        quality: 90,
      }

      await expect(service.filterImage(mockImageBuffer, filterDto)).rejects.toThrow(
        BadRequestException,
      )
    })
  })

  describe('getImageMetadata', () => {
    it('should return image metadata successfully', async () => {
      const metadata = await service.getImageMetadata(mockImageBuffer)

      expect(metadata).toBeDefined()
      expect(metadata.width).toBe(100)
      expect(metadata.height).toBe(100)
      expect(metadata.format).toBe('png')
    })

    it('should throw BadRequestException for invalid image', async () => {
      const invalidBuffer = Buffer.from('invalid image data')

      await expect(service.getImageMetadata(invalidBuffer)).rejects.toThrow(BadRequestException)
    })
  })

  describe('getMimeType', () => {
    it('should return correct MIME types', () => {
      expect(service.getMimeType(ImageFormat.JPEG)).toBe('image/jpeg')
      expect(service.getMimeType(ImageFormat.PNG)).toBe('image/png')
      expect(service.getMimeType(ImageFormat.WEBP)).toBe('image/webp')
      expect(service.getMimeType(ImageFormat.AVIF)).toBe('image/avif')
    })
  })
})
