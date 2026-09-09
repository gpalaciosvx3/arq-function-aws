import { Injectable } from '@nestjs/common';
import { appLogger, appTracer, appMetrics } from '@gpalacios/aws-lambda/observability';
import { PingConstants } from '../constants/ping.constants';
import { PingInput } from '../types/ping-input.types';
import { PingOutput } from '../types/ping-output.types';

@Injectable()
export class PingService {
  pong(input: PingInput): PingOutput {
    appTracer.annotate('feature', 'ping');
    appLogger.step(1, 'Generando respuesta pong', { echo: input.message });
    appMetrics.add('pong_executed');
    return {
      message: PingConstants.PONG_MESSAGE,
      echo: input.message,
      receivedAt: new Date().toISOString(),
    };
  }
}
