import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import { Request } from 'express'
import { Observable } from 'rxjs'

@Injectable()
export class FileUploadInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>()
    const file = request.file

    if (!file) {
      throw new BadRequestException('No file uploaded')
    }

    // Additional file validation
    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Empty file uploaded')
    }

    // Log file upload information
    console.log(
      `File uploaded: ${file.originalname}, Size: ${file.size} bytes, Type: ${file.mimetype}`,
    )

    return next.handle()
  }
}

@Injectable()
export class MultipleFileUploadInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>()
    const files = request.files as Express.Multer.File[]

    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded')
    }

    // Validate each file
    files.forEach((file, index) => {
      if (!file.buffer || file.buffer.length === 0) {
        throw new BadRequestException(`File ${index + 1} is empty`)
      }
    })

    // Log files upload information
    console.log(
      `${files.length} files uploaded:`,
      files.map((f) => ({
        name: f.originalname,
        size: f.size,
        type: f.mimetype,
      })),
    )

    return next.handle()
  }
}
