import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class InfraLayerStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const vpc = new ec2.Vpc(this, 'PBL-Vpc1', {
            maxAzs: 2,
            natGateways: 1,
            subnetConfiguration: [
                {
                    cidrMask: 24,
                    name: 'publicSubnet',
                    subnetType: ec2.SubnetType.PUBLIC
                },
                {
                    cidrMask: 24,
                    name: 'privateSubnet',
                    subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
                }
            ]
        })

        new cdk.CfnOutput(this, 'VpcId', {
            value: vpc.vpcId,
            description: 'VPC ID',
            exportName: 'PBLVpcIdOutput'
        })
        new cdk.CfnOutput(this, 'PublicSubnetIds', {
            value: cdk.Fn.join(',', vpc.publicSubnets.map(subnet => subnet.subnetId)),
            description: 'PublicSubnet ID',
            exportName: 'PBLPublicVpcOutput'
        })
        new cdk.CfnOutput(this, 'PrivateSubnetIds', {
            value: cdk.Fn.join(',', vpc.privateSubnets.map(subnet => subnet.subnetId)),
            description: 'PrivateSubnet ID',
            exportName: 'PBLPrivateVpcOutput'
        })
        new cdk.CfnOutput(this, 'SubnetAZS', {
            value: cdk.Fn.join(',', vpc.availabilityZones),
            description: 'VPCSubnetAZ',
            exportName: 'PBLSubnetAZS'
        })
    }
}
