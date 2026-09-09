import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Construct } from 'constructs';
import type * as sns from 'aws-cdk-lib/aws-sns';
import type * as sqs from 'aws-cdk-lib/aws-sqs';

interface DlqAlarmProps {
  queue: sqs.Queue;
  alarmTopic?: sns.Topic;
  alarmName: string;
}

export class DlqAlarmConstruct extends Construct {
  constructor(scope: Construct, id: string, props: DlqAlarmProps) {
    super(scope, id);

    const alarm = new cloudwatch.Alarm(this, 'Alarm', {
      alarmName: props.alarmName,
      alarmDescription: `Mensajes visibles en DLQ ${props.queue.queueName} — revisión inmediata requerida`,
      metric: props.queue.metricApproximateNumberOfMessagesVisible({
        period: cdk.Duration.minutes(1),
      }),
      threshold: 0,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    if (props.alarmTopic) alarm.addAlarmAction(new cloudwatch_actions.SnsAction(props.alarmTopic));
  }
}
