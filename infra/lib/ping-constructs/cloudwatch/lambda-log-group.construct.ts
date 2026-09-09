import * as logs from 'aws-cdk-lib/aws-logs';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

interface LambdaLogGroupProps {
  functionName: string;
}

export class LambdaLogGroupConstruct extends Construct {
  readonly logGroup: logs.LogGroup;

  constructor(scope: Construct, id: string, props: LambdaLogGroupProps) {
    super(scope, id);

    this.logGroup = new logs.LogGroup(this, 'LogGroup', {
      logGroupName: `/aws/lambda/${props.functionName}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }
}
