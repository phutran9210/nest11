import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common'

@Injectable()
export class FileValidationPipe implements PipeTransform {
  constructor(
    private readonly options: {
      maxSize?: number
      allowedMimeTypes?: string[]
      allowedExtensions?: string[]
    } = {},
  ) {}

  transform(file: Express.Multer.File): Express.Multer.File {
    if (!file) {
      throw new BadRequestException('No file provided')
    }

    // Check file size
    const maxSize = this.options.maxSize || 10 * 1024 * 1024 // 10MB default
    if (file.size > maxSize) {
      throw new BadRequestException(`File size exceeds maximum allowed size of ${maxSize} bytes`)
    }

    // Check MIME type
    const allowedMimeTypes = this.options.allowedMimeTypes || [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/avif',
      'image/bmp',
      'image/tiff',
    ]

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`,
      )
    }

    // Check file extension
    const allowedExtensions = this.options.allowedExtensions || [
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.webp',
      '.avif',
      '.bmp',
      '.tiff',
    ]

    const fileExtension = file.originalname.toLowerCase().split('.').pop()
    if (!fileExtension || !allowedExtensions.includes(`.${fileExtension}`)) {
      throw new BadRequestException(
        `File extension .${fileExtension} is not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`,
      )
    }

    // Additional validation: check if file buffer is valid
    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Invalid file buffer')
    }

    return file
  }
}

@Injectable()
export class ImageFileValidationPipe extends FileValidationPipe {
  constructor() {
    super({
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/avif',
        'image/bmp',
        'image/tiff',
      ],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.bmp', '.tiff'],
    })
  }
}
