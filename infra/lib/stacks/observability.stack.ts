import * as cdk from 'aws-cdk-lib';
import { InfraConstants } from '../../common/constants/infra.constants';
import { LambdaAlarmsConstruct } from '../observability-constructs/cloudwatch/lambda-alarms.construct';
import { AlarmConfig } from '../observability-constructs/cloudwatch/lambda-alarms.construct';
import { ObservabilityDashboardConstruct } from '../observability-constructs/cloudwatch/observability-dashboard.construct';
import { AlarmTopicConstruct } from '../observability-constructs/sns/alarm-topic.construct';
import type { ObservableLambda as ObservableLambdaBase } from '../observability-constructs/cloudwatch/observability-dashboard.construct';
import type * as sns from 'aws-cdk-lib/aws-sns';
import type { Construct } from 'constructs';

export { AlarmConfig };

export interface ObservableLambda extends ObservableLambdaBase {
  alarmNames: {
    errorRate: AlarmConfig;
    p99Duration: AlarmConfig;
    throttles: AlarmConfig;
  };
}

interface ObservabilityStackProps extends cdk.StackProps {
  lambdaFunctions: ObservableLambda[];
  businessMetricNamespace: string;
  businessMetricNames?: string[];
  environment: string;
  dashboardName: string;
  enableDashboard?: boolean;
  alarmTopicName: string;
  enableTopic?: boolean;
  alarmEmail?: string;
}

export class ObservabilityStack extends cdk.Stack {
  readonly alarmTopic: sns.Topic | undefined;

  constructor(scope: Construct, id: string, props: ObservabilityStackProps) {
    super(scope, id, props);

    if (props.enableTopic !== false) {
      const { topic } = new AlarmTopicConstruct(this, 'AlarmTopic', {
        topicName: props.alarmTopicName,
        alarmEmail: props.alarmEmail,
      });
      this.alarmTopic = topic;

      new cdk.CfnOutput(this, 'AlarmTopicArn', {
        value: this.alarmTopic.topicArn,
        description:
          'ARN del Topic SNS para notificaciones de alarma — suscribir email/Slack desde la consola o CLI',
      });
    }

    props.lambdaFunctions.forEach(({ fn, name, alarmNames }) => {
      new LambdaAlarmsConstruct(this, `${name}Alarms`, {
        fn,
        alarmTopic: this.alarmTopic,
        errorRatePercent: InfraConstants.LAMBDA_ALARM_ERROR_RATE_PERCENT,
        p99DurationMs: InfraConstants.LAMBDA_ALARM_P99_DURATION_MS,
        alarmNames,
      });
    });

    if (props.enableDashboard !== false) {
      new ObservabilityDashboardConstruct(this, 'Dashboard', {
        dashboardName: props.dashboardName,
        lambdaFunctions: props.lambdaFunctions,
        businessMetricNamespace: props.businessMetricNamespace,
        businessMetricNames: props.businessMetricNames,
      });
    }
  }
}
