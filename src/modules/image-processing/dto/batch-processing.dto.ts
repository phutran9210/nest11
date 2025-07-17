import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsNumber, IsOptional, Max, Min } from 'class-validator'
import { FilterType, ImageFormat } from './image-processing.dto'

export class BatchResizeDto {
  @ApiProperty({ example: 800, description: 'Width in pixels' })
  @IsNumber()
  @Min(1)
  @Max(4096)
  width: number

  @ApiProperty({ example: 600, description: 'Height in pixels' })
  @IsNumber()
  @Min(1)
  @Max(4096)
  height: number

  @ApiProperty({ enum: ImageFormat, default: ImageFormat.JPEG, required: false })
  @IsOptional()
  @IsEnum(ImageFormat)
  format?: ImageFormat

  @ApiProperty({ example: 90, description: 'Quality (1-100)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  quality?: number

  @ApiProperty({ example: true, description: 'Maintain aspect ratio', required: false })
  @IsOptional()
  maintainAspectRatio?: boolean
}

export class BatchCropDto {
  @ApiProperty({ example: 100, description: 'Left position' })
  @IsNumber()
  @Min(0)
  left: number

  @ApiProperty({ example: 100, description: 'Top position' })
  @IsNumber()
  @Min(0)
  top: number

  @ApiProperty({ example: 400, description: 'Width to crop' })
  @IsNumber()
  @Min(1)
  width: number

  @ApiProperty({ example: 300, description: 'Height to crop' })
  @IsNumber()
  @Min(1)
  height: number

  @ApiProperty({ enum: ImageFormat, default: ImageFormat.JPEG, required: false })
  @IsOptional()
  @IsEnum(ImageFormat)
  format?: ImageFormat

  @ApiProperty({ example: 90, description: 'Quality (1-100)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  quality?: number
}

export class BatchFilterDto {
  @ApiProperty({ enum: FilterType, description: 'Filter type to apply' })
  @IsEnum(FilterType)
  filterType: FilterType

  @ApiProperty({ example: 5, description: 'Filter intensity/value', required: false })
  @IsOptional()
  @IsNumber()
  value?: number

  @ApiProperty({ enum: ImageFormat, default: ImageFormat.JPEG, required: false })
  @IsOptional()
  @IsEnum(ImageFormat)
  format?: ImageFormat

  @ApiProperty({ example: 90, description: 'Quality (1-100)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  quality?: number
}

export class BatchProcessingResultDto {
  @ApiProperty({ example: true, description: 'Whether processing succeeded' })
  success: boolean

  @ApiProperty({ example: 'image-1.jpg', description: 'Original filename' })
  filename: string

  @ApiProperty({ example: 'image/jpeg', description: 'MIME type of processed image' })
  mimeType?: string

  @ApiProperty({ example: 1024, description: 'Size in bytes' })
  size?: number

  @ApiProperty({ example: 800, description: 'Width in pixels' })
  width?: number

  @ApiProperty({ example: 600, description: 'Height in pixels' })
  height?: number

  @ApiProperty({ example: 'Failed to process image', description: 'Error message if failed' })
  error?: string

  @ApiProperty({ example: 1500, description: 'Processing time in milliseconds' })
  processingTime?: number
}

export class BatchProcessingResponseDto {
  @ApiProperty({ example: 'batch-123456', description: 'Batch processing ID' })
  batchId: string

  @ApiProperty({ example: 10, description: 'Total number of images processed' })
  totalImages: number

  @ApiProperty({ example: 8, description: 'Number of successfully processed images' })
  successCount: number

  @ApiProperty({ example: 2, description: 'Number of failed images' })
  failureCount: number

  @ApiProperty({ example: 5000, description: 'Total processing time in milliseconds' })
  totalProcessingTime: number

  @ApiProperty({ type: [BatchProcessingResultDto], description: 'Results for each image' })
  results: BatchProcessingResultDto[]
}

export class BatchProgressDto {
  @ApiProperty({ example: 'batch-123456', description: 'Batch processing ID' })
  batchId: string

  @ApiProperty({ example: 10, description: 'Total number of images' })
  totalImages: number

  @ApiProperty({ example: 7, description: 'Number of completed images' })
  completedImages: number

  @ApiProperty({ example: 70, description: 'Completion percentage' })
  progressPercentage: number

  @ApiProperty({ example: 'processing', description: 'Current status' })
  status: 'pending' | 'processing' | 'completed' | 'failed'

  @ApiProperty({ example: 3000, description: 'Estimated remaining time in milliseconds' })
  estimatedTimeRemaining?: number
}
