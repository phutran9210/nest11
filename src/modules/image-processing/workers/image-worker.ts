import { parentPort, workerData } from 'node:worker_threads'
import * as sharp from 'sharp'
import { CropImageDto, FilterImageDto, ResizeImageDto } from '../dto/image-processing.dto'

interface WorkerData {
  type: 'resize' | 'crop' | 'filter'
  imageBuffer: Buffer
  options: ResizeImageDto | CropImageDto | FilterImageDto
  taskId: string
}

interface WorkerResult {
  success: boolean
  data?: Buffer
  error?: string
  taskId: string
  metadata?: {
    width: number
    height: number
    size: number
    format: string
  }
}

async function processImage(workerData: WorkerData): Promise<WorkerResult> {
  const { type, imageBuffer, options, taskId } = workerData

  try {
    let processedBuffer: Buffer
    let sharpInstance = sharp(imageBuffer)

    switch (type) {
      case 'resize': {
        const { width, height, format = 'jpeg', quality = 90, maintainAspectRatio = true } = options

        if (maintainAspectRatio) {
          sharpInstance = sharpInstance.resize(width, height, {
            fit: 'inside',
            withoutEnlargement: true,
          })
        } else {
          sharpInstance = sharpInstance.resize(width, height)
        }

        sharpInstance = applyFormat(sharpInstance, format, quality)
        processedBuffer = await sharpInstance.toBuffer()
        break
      }

      case 'crop': {
        const {
          left,
          top,
          width: cropWidth,
          height: cropHeight,
          format: cropFormat = 'jpeg',
          quality: cropQuality = 90,
        } = options

        sharpInstance = sharpInstance.extract({
          left,
          top,
          width: cropWidth,
          height: cropHeight,
        })

        sharpInstance = applyFormat(sharpInstance, cropFormat, cropQuality)
        processedBuffer = await sharpInstance.toBuffer()
        break
      }

      case 'filter': {
        const {
          filterType,
          value,
          format: filterFormat = 'jpeg',
          quality: filterQuality = 90,
        } = options

        switch (filterType) {
          case 'blur':
            sharpInstance = sharpInstance.blur(value || 3)
            break
          case 'sharpen':
            sharpInstance = sharpInstance.sharpen(value || 1)
            break
          case 'grayscale':
            sharpInstance = sharpInstance.grayscale()
            break
          case 'sepia':
            sharpInstance = sharpInstance.tint({ r: 255, g: 238, b: 196 })
            break
          case 'negative':
            sharpInstance = sharpInstance.negate()
            break
          case 'brightness':
            sharpInstance = sharpInstance.modulate({ brightness: value || 1.2 })
            break
          case 'contrast':
            sharpInstance = sharpInstance.linear(value || 1.2, 0)
            break
          case 'saturation':
            sharpInstance = sharpInstance.modulate({ saturation: value || 1.2 })
            break
          default:
            throw new Error(`Unsupported filter type: ${filterType}`)
        }

        sharpInstance = applyFormat(sharpInstance, filterFormat, filterQuality)
        processedBuffer = await sharpInstance.toBuffer()
        break
      }

      default:
        throw new Error(`Unsupported operation type: ${type}`)
    }

    // Get metadata of processed image
    const metadata = await sharp(processedBuffer).metadata()

    return {
      success: true,
      data: processedBuffer,
      taskId,
      metadata: {
        width: metadata.width || 0,
        height: metadata.height || 0,
        size: processedBuffer.length,
        format: metadata.format || 'unknown',
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      taskId,
    }
  }
}

function applyFormat(sharpInstance: sharp.Sharp, format: string, quality: number): sharp.Sharp {
  switch (format.toLowerCase()) {
    case 'jpeg':
    case 'jpg':
      return sharpInstance.jpeg({ quality })
    case 'png':
      return sharpInstance.png({ quality })
    case 'webp':
      return sharpInstance.webp({ quality })
    case 'avif':
      return sharpInstance.avif({ quality })
    default:
      return sharpInstance.jpeg({ quality })
  }
}

// Main worker execution
if (parentPort && workerData) {
  processImage(workerData)
    .then((result) => {
      parentPort?.postMessage(result)
    })
    .catch((error) => {
      parentPort?.postMessage({
        success: false,
        error: error.message,
        taskId: workerData.taskId,
      })
    })
}
