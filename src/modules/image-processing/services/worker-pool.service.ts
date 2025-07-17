import { EventEmitter } from 'node:events'
import { join } from 'node:path'
import { Worker } from 'node:worker_threads'
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import * as sharp from 'sharp'
import { CropImageDto, FilterImageDto, ResizeImageDto } from '../dto/image-processing.dto'

interface WorkerResult {
  success: boolean
  data?: Buffer
  error?: string
  metadata?: sharp.Metadata
}

interface WorkerTask {
  id: string
  type: 'resize' | 'crop' | 'filter'
  imageBuffer: Buffer
  options: ResizeImageDto | CropImageDto | FilterImageDto
  resolve: (result: WorkerResult) => void
  reject: (error: Error) => void
  createdAt: Date
}

interface WorkerInfo {
  worker: Worker
  busy: boolean
  taskId?: string
  createdAt: Date
}

@Injectable()
export class WorkerPoolService extends EventEmitter implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WorkerPoolService.name)
  private readonly workers: Map<string, WorkerInfo> = new Map()
  private readonly taskQueue: WorkerTask[] = []
  private readonly maxWorkers: number
  private readonly workerPath: string
  private isShuttingDown = false

  constructor() {
    super()
    this.maxWorkers = Math.min(4, Math.max(1, require('node:os').cpus().length - 1))
    this.workerPath = join(__dirname, '../workers/image-worker.js')
    this.logger.log(`Worker pool initialized with max ${this.maxWorkers} workers`)
  }

  async onModuleInit() {
    // Pre-create some workers
    const initialWorkers = Math.min(2, this.maxWorkers)
    for (let i = 0; i < initialWorkers; i++) {
      await this.createWorker()
    }
    this.logger.log(`Created ${initialWorkers} initial workers`)
  }

  async onModuleDestroy() {
    this.isShuttingDown = true
    await this.terminateAllWorkers()
    this.logger.log('Worker pool terminated')
  }

  async processTask(
    type: 'resize' | 'crop' | 'filter',
    imageBuffer: Buffer,
    options: ResizeImageDto | CropImageDto | FilterImageDto,
  ): Promise<WorkerResult> {
    if (this.isShuttingDown) {
      throw new Error('Worker pool is shutting down')
    }

    const taskId = this.generateTaskId()

    return new Promise((resolve, reject) => {
      const task: WorkerTask = {
        id: taskId,
        type,
        imageBuffer,
        options,
        resolve,
        reject,
        createdAt: new Date(),
      }

      this.taskQueue.push(task)
      this.processQueue()
    })
  }

  async processBatch(
    tasks: Array<{
      type: 'resize' | 'crop' | 'filter'
      imageBuffer: Buffer
      options: ResizeImageDto | CropImageDto | FilterImageDto
    }>,
  ): Promise<WorkerResult[]> {
    if (this.isShuttingDown) {
      throw new Error('Worker pool is shutting down')
    }

    const promises = tasks.map((task) =>
      this.processTask(task.type, task.imageBuffer, task.options),
    )

    try {
      const results = await Promise.allSettled(promises)
      return results.map((result) => {
        if (result.status === 'fulfilled') {
          return result.value
        } else {
          return {
            success: false,
            error: result.reason?.message || 'Unknown error',
          }
        }
      })
    } catch (error) {
      this.logger.error('Error processing batch:', error)
      throw error
    }
  }

  private async processQueue() {
    if (this.taskQueue.length === 0) {
      return
    }

    const availableWorker = this.getAvailableWorker()
    if (!availableWorker) {
      // Try to create a new worker if we haven't reached the limit
      if (this.workers.size < this.maxWorkers) {
        await this.createWorker()
        this.processQueue() // Retry after creating worker
      }
      return
    }

    const task = this.taskQueue.shift()
    if (!task) {
      return
    }

    this.executeTask(availableWorker, task)

    // Continue processing queue
    if (this.taskQueue.length > 0) {
      setImmediate(() => this.processQueue())
    }
  }

  private async createWorker(): Promise<string> {
    const workerId = this.generateWorkerId()

    try {
      const worker = new Worker(this.workerPath, {
        execArgv: ['--loader', 'ts-node/esm'],
      })

      const workerInfo: WorkerInfo = {
        worker,
        busy: false,
        createdAt: new Date(),
      }

      worker.on('error', (error) => {
        this.logger.error(`Worker ${workerId} error:`, error)
        this.handleWorkerError(workerId, error)
      })

      worker.on('exit', (code) => {
        this.logger.log(`Worker ${workerId} exited with code ${code}`)
        this.workers.delete(workerId)
      })

      this.workers.set(workerId, workerInfo)
      this.logger.debug(`Created worker ${workerId}`)

      return workerId
    } catch (error) {
      this.logger.error(`Failed to create worker ${workerId}:`, error)
      throw error
    }
  }

  private getAvailableWorker(): string | null {
    for (const [workerId, workerInfo] of this.workers) {
      if (!workerInfo.busy) {
        return workerId
      }
    }
    return null
  }

  private executeTask(workerId: string, task: WorkerTask) {
    const workerInfo = this.workers.get(workerId)
    if (!workerInfo) {
      task.reject(new Error(`Worker ${workerId} not found`))
      return
    }

    workerInfo.busy = true
    workerInfo.taskId = task.id

    const timeoutId = setTimeout(() => {
      this.logger.warn(`Task ${task.id} timed out, terminating worker ${workerId}`)
      this.terminateWorker(workerId)
      task.reject(new Error('Task timed out'))
    }, 60000) // 60 second timeout

    const messageHandler = (result: WorkerResult) => {
      clearTimeout(timeoutId)
      workerInfo.busy = false
      workerInfo.taskId = undefined

      if (result.success) {
        task.resolve(result)
      } else {
        task.reject(new Error(result.error || 'Unknown worker error'))
      }

      // Continue processing queue
      this.processQueue()
    }

    const errorHandler = (error: Error) => {
      clearTimeout(timeoutId)
      workerInfo.busy = false
      workerInfo.taskId = undefined
      task.reject(error)
      this.handleWorkerError(workerId, error)
    }

    workerInfo.worker.once('message', messageHandler)
    workerInfo.worker.once('error', errorHandler)

    // Send task to worker
    workerInfo.worker.postMessage({
      type: task.type,
      imageBuffer: task.imageBuffer,
      options: task.options,
      taskId: task.id,
    })
  }

  private async handleWorkerError(workerId: string, error: Error) {
    this.logger.error(`Worker ${workerId} encountered error:`, error)
    await this.terminateWorker(workerId)

    // Try to create a replacement worker
    if (!this.isShuttingDown && this.workers.size < this.maxWorkers) {
      try {
        await this.createWorker()
      } catch (createError) {
        this.logger.error('Failed to create replacement worker:', createError)
      }
    }
  }

  private async terminateWorker(workerId: string): Promise<void> {
    const workerInfo = this.workers.get(workerId)
    if (!workerInfo) {
      return
    }

    try {
      await workerInfo.worker.terminate()
    } catch (error) {
      this.logger.error(`Error terminating worker ${workerId}:`, error)
    }

    this.workers.delete(workerId)
    this.logger.debug(`Terminated worker ${workerId}`)
  }

  private async terminateAllWorkers(): Promise<void> {
    const terminationPromises = Array.from(this.workers.keys()).map((workerId) =>
      this.terminateWorker(workerId),
    )

    await Promise.allSettled(terminationPromises)
    this.workers.clear()
  }

  private generateTaskId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private generateWorkerId(): string {
    return `worker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Utility methods for monitoring
  getStats() {
    return {
      totalWorkers: this.workers.size,
      busyWorkers: Array.from(this.workers.values()).filter((w) => w.busy).length,
      queueLength: this.taskQueue.length,
      maxWorkers: this.maxWorkers,
    }
  }
}
