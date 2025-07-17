import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Response } from 'express'
import { multerConfig } from './config/multer.config'
import {
  CropImageDto,
  FilterImageDto,
  ImageFormat,
  ImageProcessingResponseDto,
  ResizeImageDto,
} from './dto/image-processing.dto'
import { ImageProcessingService } from './image-processing.service'

@ApiTags('image-processing')
@Controller('image-processing')
export class ImageProcessingController {
  constructor(private readonly imageProcessingService: ImageProcessingService) {}

  @Post('resize')
  @UseInterceptors(FileInterceptor('image', multerConfig))
  @ApiOperation({ summary: 'Resize an image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Image file to resize (max 10MB)',
        },
        width: { type: 'number', example: 800 },
        height: { type: 'number', example: 600 },
        format: { type: 'string', enum: Object.values(ImageFormat) },
        quality: { type: 'number', example: 90 },
        maintainAspectRatio: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Image resized successfully',
    type: ImageProcessingResponseDto,
  })
  async resizeImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() resizeDto: ResizeImageDto,
    @Res() res: Response,
  ): Promise<void> {
    if (!file) {
      throw new BadRequestException('No image file provided')
    }

    if (!file.buffer) {
      throw new BadRequestException('Invalid file buffer')
    }

    try {
      const processedBuffer = await this.imageProcessingService.resizeImage(file.buffer, resizeDto)
      const _metadata = await this.imageProcessingService.getImageMetadata(processedBuffer)

      const format = resizeDto.format || ImageFormat.JPEG
      const mimeType = this.imageProcessingService.getMimeType(format)

      res.set({
        'Content-Type': mimeType,
        'Content-Length': processedBuffer.length.toString(),
        'Content-Disposition': `attachment; filename="resized-${Date.now()}.${format}"`,
        'X-Original-Filename': file.originalname,
        'X-Original-Size': file.size.toString(),
        'X-Processed-Size': processedBuffer.length.toString(),
      })

      res.send(processedBuffer)
    } catch (_error) {
      throw new HttpException('Failed to resize image', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Post('crop')
  @UseInterceptors(FileInterceptor('image', multerConfig))
  @ApiOperation({ summary: 'Crop an image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Image file to crop (max 10MB)',
        },
        left: { type: 'number', example: 100 },
        top: { type: 'number', example: 100 },
        width: { type: 'number', example: 400 },
        height: { type: 'number', example: 300 },
        format: { type: 'string', enum: Object.values(ImageFormat) },
        quality: { type: 'number', example: 90 },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Image cropped successfully',
    type: ImageProcessingResponseDto,
  })
  async cropImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() cropDto: CropImageDto,
    @Res() res: Response,
  ): Promise<void> {
    if (!file) {
      throw new BadRequestException('No image file provided')
    }

    if (!file.buffer) {
      throw new BadRequestException('Invalid file buffer')
    }

    try {
      const processedBuffer = await this.imageProcessingService.cropImage(file.buffer, cropDto)
      const _metadata = await this.imageProcessingService.getImageMetadata(processedBuffer)

      const format = cropDto.format || ImageFormat.JPEG
      const mimeType = this.imageProcessingService.getMimeType(format)

      res.set({
        'Content-Type': mimeType,
        'Content-Length': processedBuffer.length.toString(),
        'Content-Disposition': `attachment; filename="cropped-${Date.now()}.${format}"`,
        'X-Original-Filename': file.originalname,
        'X-Original-Size': file.size.toString(),
        'X-Processed-Size': processedBuffer.length.toString(),
      })

      res.send(processedBuffer)
    } catch (_error) {
      throw new HttpException('Failed to crop image', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Post('filter')
  @UseInterceptors(FileInterceptor('image', multerConfig))
  @ApiOperation({ summary: 'Apply filter to an image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Image file to apply filter to (max 10MB)',
        },
        filterType: {
          type: 'string',
          enum: [
            'blur',
            'sharpen',
            'grayscale',
            'sepia',
            'negative',
            'brightness',
            'contrast',
            'saturation',
          ],
        },
        value: { type: 'number', example: 5 },
        format: { type: 'string', enum: Object.values(ImageFormat) },
        quality: { type: 'number', example: 90 },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Filter applied successfully',
    type: ImageProcessingResponseDto,
  })
  async filterImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() filterDto: FilterImageDto,
    @Res() res: Response,
  ): Promise<void> {
    if (!file) {
      throw new BadRequestException('No image file provided')
    }

    if (!file.buffer) {
      throw new BadRequestException('Invalid file buffer')
    }

    try {
      const processedBuffer = await this.imageProcessingService.filterImage(file.buffer, filterDto)
      const _metadata = await this.imageProcessingService.getImageMetadata(processedBuffer)

      const format = filterDto.format || ImageFormat.JPEG
      const mimeType = this.imageProcessingService.getMimeType(format)

      res.set({
        'Content-Type': mimeType,
        'Content-Length': processedBuffer.length.toString(),
        'Content-Disposition': `attachment; filename="filtered-${filterDto.filterType}-${Date.now()}.${format}"`,
        'X-Original-Filename': file.originalname,
        'X-Original-Size': file.size.toString(),
        'X-Processed-Size': processedBuffer.length.toString(),
      })

      res.send(processedBuffer)
    } catch (_error) {
      throw new HttpException('Failed to apply filter to image', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Get('metadata/:filename')
  @ApiOperation({ summary: 'Get image metadata' })
  @ApiResponse({
    status: 200,
    description: 'Image metadata retrieved successfully',
  })
  async getImageMetadata(@Param('filename') _filename: string): Promise<sharp.Metadata> {
    // This would typically work with stored images
    // For now, it's a placeholder endpoint
    throw new HttpException(
      'Metadata endpoint requires image storage implementation',
      HttpStatus.NOT_IMPLEMENTED,
    )
  }
}
