import * as cdk from 'aws-cdk-lib';
import type { Construct } from 'constructs';

export class StackTags {
  static apply(scope: Construct): void {
    cdk.Tags.of(scope).add('Project', 'arq-serverless-cdk');
    cdk.Tags.of(scope).add('ManagedBy', 'aws-cdk');
    cdk.Tags.of(scope).add('Repository', 'https://github.com/gpalaciosvx3/arq-serverless-cdk');
  }
}
