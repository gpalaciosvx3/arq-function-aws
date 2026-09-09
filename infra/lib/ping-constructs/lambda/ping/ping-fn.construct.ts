import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { InfraConstants } from '../../../../common/constants/infra.constants';
import { ResourceConstants } from '../../../../common/constants/resource.constants';
import { LambdaLogGroupConstruct } from '../../cloudwatch/lambda-log-group.construct';
import { PingRoleConstruct } from '../../iam/ping-role.construct';
import { lambdaBundling, repoRoot } from '../shared/bundling.config';

export class PingFnConstruct extends Construct {
  readonly fn: NodejsFunction;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const { logGroup } = new LambdaLogGroupConstruct(this, 'LogGroup', {
      functionName: ResourceConstants.LAMBDA_PING,
    });

    const { role } = new PingRoleConstruct(this, 'Role');

    this.fn = new NodejsFunction(this, 'Fn', {
      functionName: ResourceConstants.LAMBDA_PING,
      description: 'Recibe POST /ping y responde con pong',
      logGroup,
      role,
      entry: path.join(
        __dirname,
        '../../../../../src/ping/infrastructure/bootstrap/ping.handler.ts',
      ),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(InfraConstants.LAMBDA_TIMEOUT_DEFAULT_SECONDS),
      memorySize: InfraConstants.LAMBDA_MEMORY_DEFAULT_MB,
      tracing: lambda.Tracing.ACTIVE,
      projectRoot: repoRoot,
      bundling: lambdaBundling,
      environment: {
        POWERTOOLS_SERVICE_NAME: ResourceConstants.LAMBDA_PING,
        POWERTOOLS_METRICS_NAMESPACE: ResourceConstants.METRICS_NAMESPACE,
      },
    });
  }
}
