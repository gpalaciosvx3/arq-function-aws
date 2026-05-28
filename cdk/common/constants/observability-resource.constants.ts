import { ObservabilityNamingConstants } from './observability-naming.constants';

export class ObservabilityResourceConstants {
  static readonly DASHBOARD_NAME = ObservabilityNamingConstants.CWD_001;

  static readonly ALARM_TOPIC = ObservabilityNamingConstants.SNS_001;

  static readonly PING_ERROR_RATE_ALARM = ObservabilityNamingConstants.ALM_001;

  static readonly PING_P99_ALARM = ObservabilityNamingConstants.ALM_002;

  static readonly PING_THROTTLES_ALARM = ObservabilityNamingConstants.ALM_003;
}
