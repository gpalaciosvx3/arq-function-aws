import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

export interface ObservableLambda {
  fn: NodejsFunction;
  name: string;
}

interface ObservabilityDashboardProps {
  dashboardName: string;
  lambdaFunctions: ObservableLambda[];
  processingQueues: sqs.Queue[];
  tables: dynamodb.Table[];
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

    const queueWidth = Math.max(6, Math.floor(24 / Math.max(props.processingQueues.length, 1)));
    dashboard.addWidgets(
      ...props.processingQueues.map(
        (queue) =>
          new cloudwatch.GraphWidget({
            title: `Cola: ${queue.queueName}`,
            width: queueWidth,
            left: [
              queue.metricApproximateNumberOfMessagesVisible({ period: cdk.Duration.minutes(1) }),
            ],
            right: [
              queue.metricApproximateAgeOfOldestMessage({
                statistic: 'Maximum',
                period: cdk.Duration.minutes(1),
              }),
            ],
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

    const tableWidth = Math.max(6, Math.floor(24 / Math.max(props.tables.length, 1)));
    dashboard.addWidgets(
      ...props.tables.map(
        (table) =>
          new cloudwatch.GraphWidget({
            title: `DynamoDB: ${table.tableName}`,
            width: tableWidth,
            left: [
              table.metricConsumedReadCapacityUnits({ period: cdk.Duration.minutes(5) }),
              table.metricConsumedWriteCapacityUnits({ period: cdk.Duration.minutes(5) }),
            ],
          }),
      ),
    );
  }
}
