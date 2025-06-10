import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiOperation,
  ApiBody,
  ApiParam,
  ApiTags,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { MESSAGES } from '../constant';

interface IApiOperationOptions {
  summary: string;
  description?: string;
  tags?: string[];
}

interface IApiResponseOptions {
  type?: Type<unknown> | (() => unknown) | [() => unknown] | string;
  description?: string;
  isArray?: boolean;
}

// Common API responses
export const ApiCommonResponses = () => {
  return applyDecorators(
    ApiBadRequestResponse({ description: MESSAGES.COMMON.BAD_REQUEST }),
    ApiUnauthorizedResponse({ description: MESSAGES.COMMON.UNAUTHORIZED }),
    ApiForbiddenResponse({ description: MESSAGES.COMMON.FORBIDDEN }),
    ApiInternalServerErrorResponse({ description: MESSAGES.COMMON.ERROR }),
  );
};

// API Operation with common responses
export const ApiOperationWithResponses = (options: IApiOperationOptions) => {
  const decorators = [
    ApiOperation({
      summary: options.summary,
      description: options.description,
    }),
    ApiCommonResponses(),
  ];

  if (options.tags) {
    decorators.push(ApiTags(...options.tags));
  }

  return applyDecorators(...decorators);
};

// API Success Response
export const ApiSuccessResponse = (options: IApiResponseOptions = {}) => {
  return applyDecorators(
    ApiOkResponse({
      description: options.description || MESSAGES.COMMON.SUCCESS,
      type: options.type,
      isArray: options.isArray,
    }),
  );
};

// API Created Response
export const ApiCreatedSuccessResponse = (options: IApiResponseOptions = {}) => {
  return applyDecorators(
    ApiCreatedResponse({
      description: options.description || MESSAGES.COMMON.SUCCESS,
      type: options.type,
      isArray: options.isArray,
    }),
  );
};

// API Not Found Response
export const ApiNotFoundErrorResponse = (description?: string) => {
  return applyDecorators(
    ApiNotFoundResponse({
      description: description || MESSAGES.COMMON.ERROR,
    }),
  );
};

// Complete CRUD API decorators
export const ApiCreateOperation = (options: {
  summary: string;
  bodyType: Type<unknown>;
  responseType?: Type<unknown>;
  description?: string;
}) => {
  return applyDecorators(
    ApiOperationWithResponses({
      summary: options.summary,
      description: options.description,
    }),
    ApiBody({ type: options.bodyType }),
    ApiCreatedSuccessResponse({ type: options.responseType }),
  );
};

export const ApiGetAllOperation = (options: {
  summary: string;
  responseType: Type<unknown>;
  description?: string;
}) => {
  return applyDecorators(
    ApiOperationWithResponses({
      summary: options.summary,
      description: options.description,
    }),
    ApiSuccessResponse({ type: options.responseType, isArray: true }),
  );
};

export const ApiGetByIdOperation = (options: {
  summary: string;
  responseType: Type<unknown>;
  paramName?: string;
  description?: string;
}) => {
  return applyDecorators(
    ApiOperationWithResponses({
      summary: options.summary,
      description: options.description,
    }),
    ApiParam({
      name: options.paramName || 'id',
      type: 'string',
      description: 'Resource ID',
    }),
    ApiSuccessResponse({ type: options.responseType }),
    ApiNotFoundErrorResponse(),
  );
};

export const ApiUpdateOperation = (options: {
  summary: string;
  bodyType: Type<unknown>;
  responseType?: Type<unknown>;
  paramName?: string;
  description?: string;
}) => {
  return applyDecorators(
    ApiOperationWithResponses({
      summary: options.summary,
      description: options.description,
    }),
    ApiParam({
      name: options.paramName || 'id',
      type: 'string',
      description: 'Resource ID',
    }),
    ApiBody({ type: options.bodyType }),
    ApiSuccessResponse({ type: options.responseType }),
    ApiNotFoundErrorResponse(),
  );
};

export const ApiDeleteOperation = (options: {
  summary: string;
  paramName?: string;
  description?: string;
}) => {
  return applyDecorators(
    ApiOperationWithResponses({
      summary: options.summary,
      description: options.description,
    }),
    ApiParam({
      name: options.paramName || 'id',
      type: 'string',
      description: 'Resource ID',
    }),
    ApiSuccessResponse({ description: 'Resource deleted successfully' }),
    ApiNotFoundErrorResponse(),
  );
};
