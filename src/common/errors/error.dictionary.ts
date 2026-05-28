import { HttpStatus } from '@nestjs/common';

export type InputError = {
  readonly code: string;
  readonly descripcion: string;
  readonly statusCode: number;
};

export class ErrorDictionary {
  static readonly VALIDATION_ERROR: InputError = {
    code: 'ARQ-001',
    descripcion: 'El cuerpo de la solicitud no es válido',
    statusCode: HttpStatus.BAD_REQUEST,
  };

  static readonly INTERNAL_ERROR: InputError = {
    code: 'ARQ-002',
    descripcion: 'Ocurrió un error inesperado',
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
  };

  static readonly ENV_VAR_MISSING: InputError = {
    code: 'ARQ-003',
    descripcion: 'Variable de entorno requerida no encontrada',
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
  };
}
