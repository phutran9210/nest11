import { Module } from '@nestjs/common'
import { ImageProcessingController } from './image-processing.controller'
import { ImageProcessingService } from './image-processing.service'
import { WorkerPoolService } from './services/worker-pool.service'

@Module({
  providers: [ImageProcessingService, WorkerPoolService],
  controllers: [ImageProcessingController],
  exports: [ImageProcessingService, WorkerPoolService],
})
export class ImageProcessingModule {}
