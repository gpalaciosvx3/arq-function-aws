import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

interface DlqAlarmProps {
  queue: sqs.Queue;
  alarmTopic: sns.Topic;
}

export class DlqAlarmConstruct extends Construct {
  constructor(scope: Construct, id: string, props: DlqAlarmProps) {
    super(scope, id);

    const alarm = new cloudwatch.Alarm(this, 'Alarm', {
      alarmName: `${props.queue.queueName}-messages-visible`,
      alarmDescription: `Mensajes visibles en DLQ ${props.queue.queueName} — revisión inmediata requerida`,
      metric: props.queue.metricApproximateNumberOfMessagesVisible({
        period: cdk.Duration.minutes(1),
      }),
      threshold: 0,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    alarm.addAlarmAction(new cloudwatch_actions.SnsAction(props.alarmTopic));
  }
}
