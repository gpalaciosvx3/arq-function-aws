import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { ResourceConstants } from '../../../common/constants/resource.constants';

export class PingRoleConstruct extends Construct {
  readonly role: iam.Role;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.role = new iam.Role(this, 'Role', {
      roleName: ResourceConstants.PING_ROLE,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
      ],
    });
  }
}
