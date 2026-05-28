import { APIGatewayProxyResult } from 'aws-lambda';
import { CustomException } from '../errors/custom.exception';
import { ErrorDictionary } from '../errors/error.dictionary';
import { ApiSuccessBody, ApiErrorBody } from '../types/api-response.types';

export class ApiGwHelper {
  static success<T>(
    statusCode: number,
    data: T,
    meta?: Record<string, unknown>,
  ): APIGatewayProxyResult {
    const body: ApiSuccessBody<T> = { data, ...(meta && { meta }) };
    return {
      statusCode,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    };
  }

  static error(error: unknown): APIGatewayProxyResult {
    if (error instanceof CustomException) {
      const body: ApiErrorBody = error.toResponseBody();
      return {
        statusCode: error.statusCode,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      };
    }
    const detalle = error instanceof Error ? error.message : String(error);
    const excepcion = new CustomException(ErrorDictionary.INTERNAL_ERROR, detalle);
    const body: ApiErrorBody = excepcion.toResponseBody();
    return {
      statusCode: excepcion.statusCode,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    };
  }
}
