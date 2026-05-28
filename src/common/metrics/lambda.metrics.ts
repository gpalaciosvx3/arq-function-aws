import { Injectable } from '@nestjs/common';
import { MetricUnit } from '@aws-lambda-powertools/metrics';
import { powertoolsMetrics } from '../config/aws.config';

@Injectable()
export class AppMetrics {
  add(metricName: string, value = 1, unit: typeof MetricUnit[keyof typeof MetricUnit] = MetricUnit.Count): void {
    powertoolsMetrics.addMetric(metricName, unit, value);
  }

  dimension(name: string, value: string): void {
    powertoolsMetrics.addDimension(name, value);
  }

  flush(): void {
    powertoolsMetrics.publishStoredMetrics();
  }
}
