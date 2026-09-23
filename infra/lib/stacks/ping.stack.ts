import * as cdk from 'aws-cdk-lib';
import { StackTags } from '../../common/tags/stack.tags';
import { PingFnConstruct } from '../ping-constructs/lambda/ping/ping-fn.construct';
import type { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import type { Construct } from 'constructs';

export class PingStack extends cdk.Stack {
  readonly pingFn: NodejsFunction;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, {
      ...props,
      description: 'Arquetipo function AWS - función ping',
    });

    StackTags.apply(this);

    const pingFnConstruct = new PingFnConstruct(this, 'PingFn');
    this.pingFn = pingFnConstruct.fn;
  }
}
