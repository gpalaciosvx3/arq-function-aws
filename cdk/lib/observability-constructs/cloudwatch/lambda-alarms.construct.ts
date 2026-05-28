import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

export interface AlarmConfig {
  name: string;
  enabled: boolean;
}

interface LambdaAlarmsProps {
  fn: NodejsFunction;
  alarmTopic?: sns.Topic;
  errorRatePercent: number;
  p99DurationMs: number;
  alarmNames: {
    errorRate: AlarmConfig;
    p99Duration: AlarmConfig;
    throttles: AlarmConfig;
  };
}

export class LambdaAlarmsConstruct extends Construct {
  constructor(scope: Construct, id: string, props: LambdaAlarmsProps) {
    super(scope, id);

    const action = props.alarmTopic
      ? new cloudwatch_actions.SnsAction(props.alarmTopic)
      : undefined;

    const addAction = (alarm: cloudwatch.Alarm) => {
      if (action) alarm.addAlarmAction(action);
    };

    if (props.alarmNames.errorRate.enabled) {
      const errorRate = new cloudwatch.Alarm(this, 'ErrorRate', {
        alarmName: props.alarmNames.errorRate.name,
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
      addAction(errorRate);
    }

    if (props.alarmNames.p99Duration.enabled) {
      const p99 = new cloudwatch.Alarm(this, 'P99Duration', {
        alarmName: props.alarmNames.p99Duration.name,
        alarmDescription: `Duración P99 > ${props.p99DurationMs}ms`,
        metric: props.fn.metricDuration({ statistic: 'p99', period: cdk.Duration.minutes(5) }),
        threshold: props.p99DurationMs,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });
      addAction(p99);
    }

    if (props.alarmNames.throttles.enabled) {
      const throttles = new cloudwatch.Alarm(this, 'Throttles', {
        alarmName: props.alarmNames.throttles.name,
        alarmDescription: 'Throttling detectado',
        metric: props.fn.metricThrottles({ period: cdk.Duration.minutes(5) }),
        threshold: 0,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });
      addAction(throttles);
    }
  }
}
