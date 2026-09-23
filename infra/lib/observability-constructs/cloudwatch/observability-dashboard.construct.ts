import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';
import type { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export interface ObservableLambda {
  fn: NodejsFunction;
  name: string;
}

interface ObservabilityDashboardProps {
  dashboardName: string;
  lambdaFunctions: ObservableLambda[];
  businessMetricNamespace: string;
  businessMetricNames?: string[];
}

export class ObservabilityDashboardConstruct extends Construct {
  constructor(scope: Construct, id: string, props: ObservabilityDashboardProps) {
    super(scope, id);

    const dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: props.dashboardName,
    });

    const lambdaWidth = Math.max(4, Math.floor(24 / props.lambdaFunctions.length));
    dashboard.addWidgets(
      ...props.lambdaFunctions.map(
        ({ fn, name }) =>
          new cloudwatch.GraphWidget({
            title: name,
            width: lambdaWidth,
            left: [
              fn.metricInvocations({ period: cdk.Duration.minutes(5) }),
              fn.metricErrors({ period: cdk.Duration.minutes(5) }),
            ],
            right: [fn.metricDuration({ statistic: 'p99', period: cdk.Duration.minutes(5) })],
          }),
      ),
    );

    if (props.businessMetricNames && props.businessMetricNames.length > 0) {
      dashboard.addWidgets(
        new cloudwatch.GraphWidget({
          title: 'Métricas de negocio',
          width: 24,
          left: props.businessMetricNames.map(
            (metricName) =>
              new cloudwatch.Metric({
                namespace: props.businessMetricNamespace,
                metricName,
                period: cdk.Duration.minutes(5),
                statistic: 'Sum',
              }),
          ),
        }),
      );
    }
  }
}
