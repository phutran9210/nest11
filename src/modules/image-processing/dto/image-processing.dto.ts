import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsNumber, IsOptional, Max, Min } from 'class-validator'

export enum ImageFormat {
  JPEG = 'jpeg',
  PNG = 'png',
  WEBP = 'webp',
  AVIF = 'avif',
}

export enum FilterType {
  BLUR = 'blur',
  SHARPEN = 'sharpen',
  GRAYSCALE = 'grayscale',
  SEPIA = 'sepia',
  NEGATIVE = 'negative',
  BRIGHTNESS = 'brightness',
  CONTRAST = 'contrast',
  SATURATION = 'saturation',
}

export class ResizeImageDto {
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

export class CropImageDto {
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

export class FilterImageDto {
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

export class ImageProcessingResponseDto {
  @ApiProperty({ example: 'processed-image.jpg', description: 'Filename of processed image' })
  filename: string

  @ApiProperty({ example: 'image/jpeg', description: 'MIME type of processed image' })
  mimeType: string

  @ApiProperty({ example: 1024, description: 'Size in bytes' })
  size: number

  @ApiProperty({ example: 800, description: 'Width in pixels' })
  width: number

  @ApiProperty({ example: 600, description: 'Height in pixels' })
  height: number
}
