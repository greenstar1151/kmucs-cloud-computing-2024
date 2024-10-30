import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as asg from 'aws-cdk-lib/aws-autoscaling';
import * as elb from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';

export class WASLayerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpcId = cdk.Fn.importValue('PBLVpcIdOutput');  // VPC ID 가져오기
    const privateSubnets = cdk.Fn.importValue('PBLPublicVpcOutput').split(','); 
    const publicSubnets = cdk.Fn.importValue('PBLPrivateVpcOutput').split(','); 
    const azs = cdk.Fn.importValue('PBLSubnetAZS').split(','); 

    const importedVpc = ec2.Vpc.fromVpcAttributes(this, 'ImportedVpc', {
        vpcId: vpcId,                
        availabilityZones: azs,      
        publicSubnetIds: publicSubnets,  
        privateSubnetIds: privateSubnets
    });

    // Security group
    const lbSecurityGroup = new ec2.SecurityGroup(this, 'PBLLBSecurityGroup', {vpc: importedVpc})
    lbSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP');

    const asgSecurityGroup = new ec2.SecurityGroup(this, 'PBLASGSecurityGroup', {vpc: importedVpc})
    asgSecurityGroup.addIngressRule(lbSecurityGroup, ec2.Port.tcp(80), "Allow HTTP from LB")

    // ASG, LB health-check
    const healthCheck = asg.HealthCheck.ec2({
      grace: cdk.Duration.minutes(10),          // initial check duration: 10m
    })

    // Auto Scaling Group (ASG) 생성
    const group = new asg.AutoScalingGroup(this, 'PBLAsg', {
        vpc: importedVpc,            
        vpcSubnets: {subnetType: ec2.SubnetType.PUBLIC},
        healthCheck: healthCheck,
        minCapacity: 1,
        maxCapacity: 2,
        desiredCapacity: 1,
    });

    group.addSecurityGroup(asgSecurityGroup);

    group.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 60,
    })

    // Application Load Balancer (ALB) 생성
    const LB = new elb.ApplicationLoadBalancer(this, 'PBLELB', {
      vpc: importedVpc,                // VPC에 배치된 ALB 생성
      internetFacing: true,
    });

    LB.addSecurityGroup(lbSecurityGroup);

    // Connect LB with ASG
    const listner = LB.addListener('Listener', {
      port: 80,
      open: true,
    });

    listner.addTargets('Target', {
      port: 80,
      targets: [group],
      healthCheck: {
        path: "/health",
        interval: cdk.Duration.minutes(1),
      }
    });

  }
}
