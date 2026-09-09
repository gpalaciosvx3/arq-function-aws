import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Construct } from 'constructs';
import type * as sns from 'aws-cdk-lib/aws-sns';
import type * as sqs from 'aws-cdk-lib/aws-sqs';

interface QueueAgeAlarmProps {
  queue: sqs.Queue;
  alarmTopic?: sns.Topic;
  maxAgeSeconds: number;
  alarmName: string;
}

export class QueueAgeAlarmConstruct extends Construct {
  constructor(scope: Construct, id: string, props: QueueAgeAlarmProps) {
    super(scope, id);

    const alarm = new cloudwatch.Alarm(this, 'Alarm', {
      alarmName: props.alarmName,
      alarmDescription: `Antigüedad del mensaje más viejo > ${props.maxAgeSeconds}s`,
      metric: props.queue.metricApproximateAgeOfOldestMessage({
        statistic: 'Maximum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: props.maxAgeSeconds,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    if (props.alarmTopic) alarm.addAlarmAction(new cloudwatch_actions.SnsAction(props.alarmTopic));
  }
}
