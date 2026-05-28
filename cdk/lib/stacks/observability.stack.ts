import * as cdk from 'aws-cdk-lib';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { AlarmTopicConstruct } from '../observability-constructs/sns/alarm-topic.construct';
import { LambdaAlarmsConstruct } from '../observability-constructs/cloudwatch/lambda-alarms.construct';
import { DlqAlarmConstruct } from '../observability-constructs/cloudwatch/dlq-alarm.construct';
import { QueueAgeAlarmConstruct } from '../observability-constructs/cloudwatch/queue-age-alarm.construct';
import {
  ObservabilityDashboardConstruct,
  ObservableLambda as ObservableLambdaBase,
} from '../observability-constructs/cloudwatch/observability-dashboard.construct';

export interface ObservableLambda extends ObservableLambdaBase {
  alarmNames: {
    errorRate: string;
    p99Duration: string;
    throttles: string;
  };
}

export interface ObservableQueue {
  queue: sqs.Queue;
  alarmName: string;
}

interface ObservabilityStackProps extends cdk.StackProps {
  lambdaFunctions: ObservableLambda[];
  processingQueues?: ObservableQueue[];
  deadLetterQueues?: ObservableQueue[];
  tables?: dynamodb.Table[];
  businessMetricNamespace: string;
  businessMetricNames?: string[];
  environment: string;
  dashboardName: string;
  alarmTopicName: string;
  alarmEmail?: string;
  errorRatePercent?: number;
  p99DurationMs?: number;
  queueAgeSeconds?: number;
}

export class ObservabilityStack extends cdk.Stack {
  readonly alarmTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: ObservabilityStackProps) {
    super(scope, id, props);

    const { topic } = new AlarmTopicConstruct(this, 'AlarmTopic', {
      topicName: props.alarmTopicName,
      alarmEmail: props.alarmEmail,
    });
    this.alarmTopic = topic;

    props.lambdaFunctions.forEach(({ fn, name, alarmNames }) => {
      new LambdaAlarmsConstruct(this, `${name}Alarms`, {
        fn,
        alarmTopic: this.alarmTopic,
        errorRatePercent: props.errorRatePercent ?? 5,
        p99DurationMs: props.p99DurationMs ?? 10_000,
        alarmNames,
      });
    });

    props.processingQueues?.forEach(({ queue, alarmName }, i) => {
      new QueueAgeAlarmConstruct(this, `QueueAgeAlarm${i}`, {
        queue,
        alarmTopic: this.alarmTopic,
        maxAgeSeconds: props.queueAgeSeconds ?? 300,
        alarmName,
      });
    });

    props.deadLetterQueues?.forEach(({ queue, alarmName }, i) => {
      new DlqAlarmConstruct(this, `DlqAlarm${i}`, {
        queue,
        alarmTopic: this.alarmTopic,
        alarmName,
      });
    });

    new ObservabilityDashboardConstruct(this, 'Dashboard', {
      dashboardName: props.dashboardName,
      lambdaFunctions: props.lambdaFunctions,
      processingQueues: props.processingQueues?.map(({ queue }) => queue) ?? [],
      tables: props.tables ?? [],
      businessMetricNamespace: props.businessMetricNamespace,
      businessMetricNames: props.businessMetricNames,
    });

    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: this.alarmTopic.topicArn,
      description:
        'ARN del Topic SNS para notificaciones de alarma — suscribir email/Slack desde la consola o CLI',
    });
  }
}
