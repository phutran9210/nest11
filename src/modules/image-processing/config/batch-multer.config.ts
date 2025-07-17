import { extname } from 'node:path'
import { BadRequestException } from '@nestjs/common'
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface'

export const batchMulterConfig: MulterOptions = {
  storage: undefined, // Use memory storage for direct buffer processing
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 20, // Allow up to 20 files at once
    fields: 10, // Allow form fields
  },
  fileFilter: (_req, file, callback) => {
    // Check if file is an image
    if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp|avif|bmp|tiff)$/)) {
      return callback(
        new BadRequestException(
          'Only image files are allowed (jpg, jpeg, png, gif, webp, avif, bmp, tiff)',
        ),
        false,
      )
    }

    // Check file extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.bmp', '.tiff']
    const fileExtension = extname(file.originalname).toLowerCase()

    if (!allowedExtensions.includes(fileExtension)) {
      return callback(
        new BadRequestException(
          `File extension ${fileExtension} is not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`,
        ),
        false,
      )
    }

    callback(null, true)
  },
}

export const createBatchMulterConfig = (options?: {
  maxFileSize?: number
  maxFiles?: number
  allowedMimeTypes?: string[]
  allowedExtensions?: string[]
}): MulterOptions => {
  const {
    maxFileSize = 10 * 1024 * 1024, // 10MB default
    maxFiles = 20, // 20 files default
    allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/avif',
      'image/bmp',
      'image/tiff',
    ],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.bmp', '.tiff'],
  } = options || {}

  return {
    storage: undefined, // Memory storage
    limits: {
      fileSize: maxFileSize,
      files: maxFiles,
      fields: 10,
    },
    fileFilter: (_req, file, callback) => {
      // Check MIME type
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return callback(
          new BadRequestException(
            `File type ${file.mimetype} is not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`,
          ),
          false,
        )
      }

      // Check file extension
      const fileExtension = extname(file.originalname).toLowerCase()
      if (!allowedExtensions.includes(fileExtension)) {
        return callback(
          new BadRequestException(
            `File extension ${fileExtension} is not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`,
          ),
          false,
        )
      }

      callback(null, true)
    },
  }
}
