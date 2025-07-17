import { INestApplication } from '@nestjs/common'
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger'

export const createSwaggerConfig = (): Omit<OpenAPIObject, 'paths'> => {
  return new DocumentBuilder()
    .setTitle('NestJS API')
    .setDescription(
      `
      API documentation for E-Commerce platform
      
      ## Authentication
      Most endpoints require authentication. Use the Authorize button to add your JWT token.
      
      ## Error Handling
      All endpoints return standardized error responses with appropriate HTTP status codes.
      
      ## Rate Limiting
      API is rate limited to 100 requests per minute per IP.
    `,
    )
    .setVersion('1.0')
    .setContact('API Support', 'https://example.com/support', 'support@example.com')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        description: 'API Key for external integrations',
      },
      'API-Key',
    )
    .addTag('users')
    .addBearerAuth()
    .build()
}

export const setupSwagger = (app: INestApplication): void => {
  const config = createSwaggerConfig()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api', app, document)
}
