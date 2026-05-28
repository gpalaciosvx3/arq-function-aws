import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PingStack } from '../lib/stacks/ping.stack';
import { ObservabilityStack } from '../lib/stacks/observability.stack';
import { ResourceConstants } from '../common/constants/resource.constants';
import { ObservabilityResourceConstants } from '../common/constants/observability-resource.constants';
import { InfraConstants } from '../common/constants/infra.constants';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT || '000000000000',
  region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
};

const pingStack = new PingStack(app, 'PingStack', { env });

if (process.env.DEPLOY_OBSERVABILITY === 'true') {
  new ObservabilityStack(app, 'ObservabilityStack', {
    lambdaFunctions: [
      {
        fn: pingStack.pingFn,
        name: 'ping',
        alarmNames: {
          errorRate: ObservabilityResourceConstants.PING_ERROR_RATE_ALARM,
          p99Duration: ObservabilityResourceConstants.PING_P99_ALARM,
          throttles: ObservabilityResourceConstants.PING_THROTTLES_ALARM,
        },
      },
    ],
    businessMetricNamespace: ResourceConstants.METRICS_NAMESPACE,
    businessMetricNames: ['pong_executed'],
    environment: 'prod',
    dashboardName: ObservabilityResourceConstants.DASHBOARD_NAME,
    alarmTopicName: ObservabilityResourceConstants.ALARM_TOPIC,
    alarmEmail: process.env.ALARM_EMAIL,
    errorRatePercent: InfraConstants.LAMBDA_ALARM_ERROR_RATE_PERCENT,
    p99DurationMs: InfraConstants.LAMBDA_ALARM_P99_DURATION_MS,
    env,
  });
}
