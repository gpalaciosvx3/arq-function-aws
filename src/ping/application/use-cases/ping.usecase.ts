import { Injectable } from '@nestjs/common';
import { ZodIssue } from 'zod';
import { PingService } from '../../domain/service/ping.service';
import { PingRequestSchema } from '../dtos/ping.request.dto';
import { PingOutput } from '../../domain/types/ping-output.types';
import { ValidationException } from '../../../common/errors/custom.exception';
import { ErrorDictionary } from '../../../common/errors/error.dictionary';
import { appLogger } from '../../../common/logger/lambda.logger';

@Injectable()
export class PingUseCase {
  constructor(private readonly service: PingService) {}

  execute(raw: unknown): PingOutput {
    appLogger.info('Body recibido', { payload: raw });
    const result = PingRequestSchema.safeParse(raw);
    if (!result.success)
      throw new ValidationException(
        ErrorDictionary.VALIDATION_ERROR,
        result.error.issues as ZodIssue[],
      );

    const output = this.service.pong(result.data);
    appLogger.info('Resultado', { output });
    return output;
  }
}
