import { appLogger } from '../logger/lambda.logger';

export function awsError(context: string, error: unknown): void {
  appLogger.error(`AWS SDK error — ${context}`, { error: String(error) });
}
