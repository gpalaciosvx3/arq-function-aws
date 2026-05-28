import { Injectable } from '@nestjs/common';
import { AppLogger } from '../../../common/logger/lambda.logger';
import { AppTracer } from '../../../common/tracer/lambda.tracer';
import { AppMetrics } from '../../../common/metrics/lambda.metrics';
import { PingConstants } from '../constants/ping.constants';
import { PingInput } from '../types/ping-input.types';
import { PingOutput } from '../types/ping-output.types';

@Injectable()
export class PingService {
  constructor(
    private readonly logger: AppLogger,
    private readonly tracer: AppTracer,
    private readonly metrics: AppMetrics,
  ) {}

  pong(input: PingInput): PingOutput {
    this.tracer.annotate('feature', 'ping');
    this.logger.step(1, 'Generando respuesta pong', { echo: input.message });
    this.metrics.add('pong_executed');
    return {
      message: PingConstants.PONG_MESSAGE,
      echo: input.message,
      receivedAt: new Date().toISOString(),
    };
  }
}
