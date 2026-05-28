import { Injectable } from '@nestjs/common';
import { powertoolsLogger } from '../config/aws.config';

@Injectable()
export class AppLogger {
  start(featureName: string, context?: Record<string, unknown>): void {
    powertoolsLogger.info({ message: `--- ${featureName} start ---`, ...context });
  }

  end(
    featureName: string,
    durationMs: number,
    success: boolean,
    context?: Record<string, unknown>,
  ): void {
    powertoolsLogger.info({ message: `--- ${featureName} end ---`, durationMs, success, ...context });
  }

  step(n: number, message: string, context?: Record<string, unknown>): void {
    powertoolsLogger.info({ message: `[PASO ${n}] ${message}`, ...context });
  }

  info(message: string, context?: Record<string, unknown>): void {
    powertoolsLogger.info({ message, ...context });
  }

  warn(message: string, context?: Record<string, unknown>): void {
    powertoolsLogger.warn({ message, ...context });
  }

  error(message: string, context?: Record<string, unknown>): void {
    powertoolsLogger.error({ message, ...context });
  }
}

export const appLogger = new AppLogger();
