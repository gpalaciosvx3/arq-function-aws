import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

interface QueueAgeAlarmProps {
  queue: sqs.Queue;
  alarmTopic: sns.Topic;
  maxAgeSeconds: number;
}

export class QueueAgeAlarmConstruct extends Construct {
  constructor(scope: Construct, id: string, props: QueueAgeAlarmProps) {
    super(scope, id);

    const alarm = new cloudwatch.Alarm(this, 'Alarm', {
      alarmName: `${props.queue.queueName}-oldest-message-age`,
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
    alarm.addAlarmAction(new cloudwatch_actions.SnsAction(props.alarmTopic));
  }
}
