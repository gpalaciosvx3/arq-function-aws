import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

interface LambdaAlarmsProps {
  fn: NodejsFunction;
  alarmTopic: sns.Topic;
  errorRatePercent: number;
  p99DurationMs: number;
  alarmNames: {
    errorRate: string;
    p99Duration: string;
    throttles: string;
  };
}

export class LambdaAlarmsConstruct extends Construct {
  constructor(scope: Construct, id: string, props: LambdaAlarmsProps) {
    super(scope, id);

    const action = new cloudwatch_actions.SnsAction(props.alarmTopic);

    const errorRate = new cloudwatch.Alarm(this, 'ErrorRate', {
      alarmName: props.alarmNames.errorRate,
      alarmDescription: `Tasa de error > ${props.errorRatePercent}%`,
      metric: new cloudwatch.MathExpression({
        expression: 'IF(invocations > 0, errors / invocations * 100, 0)',
        usingMetrics: {
          errors: props.fn.metricErrors({ period: cdk.Duration.minutes(5) }),
          invocations: props.fn.metricInvocations({ period: cdk.Duration.minutes(5) }),
        },
        period: cdk.Duration.minutes(5),
      }),
      threshold: props.errorRatePercent,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    errorRate.addAlarmAction(action);

    const p99 = new cloudwatch.Alarm(this, 'P99Duration', {
      alarmName: props.alarmNames.p99Duration,
      alarmDescription: `Duración P99 > ${props.p99DurationMs}ms`,
      metric: props.fn.metricDuration({ statistic: 'p99', period: cdk.Duration.minutes(5) }),
      threshold: props.p99DurationMs,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    p99.addAlarmAction(action);

    const throttles = new cloudwatch.Alarm(this, 'Throttles', {
      alarmName: props.alarmNames.throttles,
      alarmDescription: 'Throttling detectado',
      metric: props.fn.metricThrottles({ period: cdk.Duration.minutes(5) }),
      threshold: 0,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    throttles.addAlarmAction(action);
  }
}
