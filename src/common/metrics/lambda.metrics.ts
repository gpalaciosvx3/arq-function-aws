import { MetricUnit } from '@aws-lambda-powertools/metrics';
import { powertoolsMetrics } from '../config/aws.config';

class AppMetrics {
  add(name: string, unit = MetricUnit.Count, value = 1): void {
    powertoolsMetrics.addMetric(name, unit, value);
  }

  dimension(name: string, value: string): void {
    powertoolsMetrics.addDimension(name, value);
  }

  flush(): void {
    powertoolsMetrics.publishStoredMetrics();
  }
}

export const appMetrics = new AppMetrics();
