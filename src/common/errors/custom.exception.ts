import { ZodIssue } from 'zod';
import { InputError } from './error.dictionary';
import { ApiErrorBody, ApiValidationErrorBody } from '../types/api-response.types';

export class CustomException extends Error {
  public readonly code: string;
  public readonly description: string;
  public readonly statusCode: number;

  constructor(entrada: InputError, detalle?: string) {
    const descripcionFinal = detalle ? `${entrada.descripcion}: ${detalle}` : entrada.descripcion;
    super(descripcionFinal);
    this.code = entrada.code;
    this.description = descripcionFinal;
    this.statusCode = entrada.statusCode;
    this.name = 'CustomException';
  }

  toResponseBody(): ApiErrorBody {
    return { code: this.code, description: this.description };
  }
}

export class ValidationException extends CustomException {
  constructor(
    entrada: InputError,
    public readonly issues: ZodIssue[],
  ) {
    super(entrada);
    this.name = 'ValidationException';
  }

  override toResponseBody(): ApiValidationErrorBody {
    return { code: this.code, description: this.description, issues: this.issues };
  }
}
