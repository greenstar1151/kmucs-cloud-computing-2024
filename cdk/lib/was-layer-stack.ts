import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as asg from 'aws-cdk-lib/aws-autoscaling'
import * as elb from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class WASLayerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpcId = cdk.Fn.importValue('PBLVocIdOutput');
    const privateSubnets = cdk.Fn.importValue('PBLPublicVpcOutput').split(',');
    const publicSubnets = cdk.Fn.importValue('PBLPrivateVpcOutput').split(',');
    const azs = cdk.Fn.importValue('PBLSubnetAZS').split(',')

    const importedVpc = ec2.Vpc.fromVpcAttributes(this, 'ImportedVpc', {
        vpcId: vpcId,
        availabilityZones: azs, // 사용할 가용 영역 설정
        publicSubnetIds: publicSubnets,
        privateSubnetIds: privateSubnets
    });

    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_autoscaling.AutoScalingGroup.html
    const group = new asg.AutoScalingGroup(this, 'PBLAsg', {
        vpc: importedVpc
    })

    // https://stackoverflow.com/questions/67687521/how-to-configure-elb-for-two-different-ports-in-cdk
    const LB = new elb.ApplicationLoadBalancer(this, 'PBLELB', {
      vpc: importedVpc
    })
  }
}
