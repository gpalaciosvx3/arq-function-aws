import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { InfraConstants } from '../common/constants/infra.constants';
import { ObservabilityResourceConstants } from '../common/constants/observability-resource.constants';
import { ResourceConstants } from '../common/constants/resource.constants';
import { ObservabilityStack } from '../lib/stacks/observability.stack';
import { PingStack } from '../lib/stacks/ping.stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
};

const pingStack = new PingStack(app, 'PingStack', { env });

if (process.env.DEPLOY_OBSERVABILITY === 'true') {
  new ObservabilityStack(app, 'ObservabilityStack', {
    env,
    lambdaFunctions: [
      {
        fn: pingStack.pingFn,
        name: 'ping',
        alarmNames: {
          errorRate: { name: ObservabilityResourceConstants.PING_ERROR_RATE_ALARM, enabled: true },
          p99Duration: { name: ObservabilityResourceConstants.PING_P99_ALARM, enabled: false },
          throttles: { name: ObservabilityResourceConstants.PING_THROTTLES_ALARM, enabled: false },
        },
      },
    ],
    businessMetricNamespace: ResourceConstants.METRICS_NAMESPACE,
    environment: InfraConstants.OBSERVABILITY_ENVIRONMENT,
    dashboardName: ObservabilityResourceConstants.DASHBOARD_NAME,
    alarmTopicName: ObservabilityResourceConstants.ALARM_TOPIC,
    alarmEmail: process.env.ALARM_EMAIL,
    enableTopic: false,
    enableDashboard: false,
  });
}
