declare namespace Express {
  interface Request {
    file: import('multer').File
  }
  namespace Multer {
    interface File {
      fieldname: string
      originalname: string
      encoding: string
      mimetype: string
      size: number
      buffer: Buffer
    }
  }
}
