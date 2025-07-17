import { applyDecorators } from '@nestjs/common'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  MinLength,
  ValidationOptions,
} from 'class-validator'
import { MESSAGES } from '../constant'

interface FieldConfig {
  example: unknown
  description: string
  validators: ((validationOptions?: ValidationOptions) => PropertyDecorator)[]
  additionalConfig?: Record<string, unknown>
}

interface FieldOptions {
  required?: boolean
  description?: string
  example?: unknown
}

const FIELD_CONFIGS: Record<string, FieldConfig> = {
  email: {
    example: 'user@example.com',
    description: 'User email address',
    validators: [(opts) => IsEmail({}, { message: MESSAGES.VALIDATION.INVALID_EMAIL, ...opts })],
  },
  name: {
    example: 'John Doe',
    description: 'User full name',
    validators: [(opts) => IsString({ message: MESSAGES.VALIDATION.INVALID_FORMAT, ...opts })],
  },
  password: {
    example: 'Password123!',
    description:
      'Strong password with at least 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 symbol',
    validators: [
      (opts) => IsString({ message: MESSAGES.VALIDATION.INVALID_FORMAT, ...opts }),
      (opts) =>
        MinLength(8, { message: MESSAGES.VALIDATION.MIN_LENGTH.replace('{0}', '8'), ...opts }),
      (opts) =>
        IsStrongPassword(
          {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1,
          },
          opts,
        ),
    ],
    additionalConfig: { minLength: 8 },
  },
  boolean: {
    example: true,
    description: 'Boolean value',
    validators: [(opts) => IsBoolean({ message: MESSAGES.VALIDATION.INVALID_FORMAT, ...opts })],
  },
  id: {
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Unique identifier',
    validators: [],
  },
}

const createFieldDecorator = (fieldType: string, options: FieldOptions = {}) => {
  const config = FIELD_CONFIGS[fieldType]
  if (!config) {
    throw new Error(`Unknown field type: ${fieldType}`)
  }

  const decorators: PropertyDecorator[] = []
  const isRequired = options.required !== false
  const ApiPropertyDecorator = isRequired ? ApiProperty : ApiPropertyOptional

  decorators.push(
    ApiPropertyDecorator({
      example: options.example ?? config.example,
      description: options.description || config.description,
      ...config.additionalConfig,
    }),
  )

  config.validators.forEach((validator) => {
    decorators.push(validator())
  })

  if (isRequired) {
    decorators.push(IsNotEmpty({ message: MESSAGES.VALIDATION.REQUIRED }))
  } else {
    decorators.push(IsOptional())
  }

  return applyDecorators(...decorators)
}

export const ApiEmailField = (options: FieldOptions = {}) => createFieldDecorator('email', options)

export const ApiOptionalEmailField = (options: Omit<FieldOptions, 'required'> = {}) =>
  createFieldDecorator('email', { ...options, required: false })

export const ApiNameField = (options: FieldOptions = {}) => createFieldDecorator('name', options)

export const ApiOptionalNameField = (options: Omit<FieldOptions, 'required'> = {}) =>
  createFieldDecorator('name', { ...options, required: false })

export const ApiPasswordField = (options: FieldOptions = {}) =>
  createFieldDecorator('password', options)

export const ApiOptionalPasswordField = (options: Omit<FieldOptions, 'required'> = {}) =>
  createFieldDecorator('password', { ...options, required: false })

export const ApiBooleanField = (options: FieldOptions = {}) =>
  createFieldDecorator('boolean', options)

export const ApiOptionalBooleanField = (options: Omit<FieldOptions, 'required'> = {}) =>
  createFieldDecorator('boolean', { ...options, required: false })

export const ApiIdField = (options: Omit<FieldOptions, 'required'> = {}) =>
  createFieldDecorator('id', { ...options, required: true })
