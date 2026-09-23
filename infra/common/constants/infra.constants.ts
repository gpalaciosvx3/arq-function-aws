export class InfraConstants {
  static readonly LAMBDA_TIMEOUT_DEFAULT_SECONDS = 30;
  static readonly LAMBDA_MEMORY_DEFAULT_MB = 256;

  static readonly LAMBDA_ALARM_ERROR_RATE_PERCENT = 5;
  static readonly LAMBDA_ALARM_P99_DURATION_MS = 10_000;

  static readonly OBSERVABILITY_ENVIRONMENT = 'prd';
}
