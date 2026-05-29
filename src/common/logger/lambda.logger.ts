import { Injectable } from '@nestjs/common';
import { powertoolsLogger } from '../config/aws.config';

const IS_LOCAL = Boolean(process.env.LOCALSTACK_HOSTNAME);

@Injectable()
export class AppLogger {
  start(featureName: string, context?: Record<string, unknown>): void {
    if (IS_LOCAL) { console.log(this.fmt(`--- ${featureName} start ---`, context)); return; }
    powertoolsLogger.info({ message: `--- ${featureName} start ---`, ...context });
  }

  end(
    featureName: string,
    durationMs: number,
    success: boolean,
    context?: Record<string, unknown>,
  ): void {
    if (IS_LOCAL) { console.log(this.fmt(`--- ${featureName} end ---`, { durationMs, success, ...context })); return; }
    powertoolsLogger.info({ message: `--- ${featureName} end ---`, durationMs, success, ...context });
  }

  step(n: number, message: string, context?: Record<string, unknown>): void {
    if (IS_LOCAL) { console.log(this.fmt(`[PASO ${n}] ${message}`, context)); return; }
    powertoolsLogger.info({ message: `[PASO ${n}] ${message}`, ...context });
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (IS_LOCAL) { console.log(this.fmt(`${message}`, context)); return; }
    powertoolsLogger.info({ message, ...context });
  }

  warn(message: string, context?: Record<string, unknown>): void {
    if (IS_LOCAL) { console.warn(this.fmt(`${message}`, context)); return; }
    powertoolsLogger.warn({ message, ...context });
  }

  error(message: string, context?: Record<string, unknown>): void {
    if (IS_LOCAL) { console.error(this.fmt(`${message}`, context)); return; }
    powertoolsLogger.error({ message, ...context });
  }

  private fmt(message: string, context?: Record<string, unknown>): string {
    const extra = context && Object.keys(context).length ? ` ${JSON.stringify(context)}` : '';
    return `${message}${extra}`;
  }
}

export const appLogger = new AppLogger();
