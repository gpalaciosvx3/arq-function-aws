import * as cdk from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { PingFnConstruct } from '../ping-constructs/lambda/ping/ping-fn.construct';
import { HttpApiConstruct } from '../ping-constructs/api-gateway/http-api.construct';

export class PingStack extends cdk.Stack {
  readonly pingFn: NodejsFunction;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const pingFnConstruct = new PingFnConstruct(this, 'PingFn');
    this.pingFn = pingFnConstruct.fn;

    new HttpApiConstruct(this, 'HttpApi', { pingFn: this.pingFn });
  }
}
