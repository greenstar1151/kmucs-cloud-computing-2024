import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as rds from 'aws-cdk-lib/aws-rds'
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class DBLayerStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const vpcId = cdk.Fn.importValue('PBLVpcIdOutput');
        const privateSubnets = cdk.Fn.importValue('PBLPublicVpcOutput').split(',');
        const publicSubnets = cdk.Fn.importValue('PBLPrivateVpcOutput').split(',');
        const azs = cdk.Fn.importValue('PBLSubnetAZS').split(',')

        const importedVpc = ec2.Vpc.fromVpcAttributes(this, 'ImportedVpc', {
            vpcId: vpcId,
            availabilityZones: azs, // 사용할 가용 영역 설정
            publicSubnetIds: publicSubnets,
            privateSubnetIds: privateSubnets
        });

        const dbSecurityGroup = new ec2.SecurityGroup(this, 'PBLDBSecurityGroup', {
            vpc: importedVpc,
            allowAllOutbound: true
        })

        dbSecurityGroup.addIngressRule(
            ec2.Peer.anyIpv4(),
            ec2.Port.MYSQL_AURORA,
            "allow inbound traffic with mysql"
        )

        const db = new rds.DatabaseCluster(this, "PBLdb", {
            engine: rds.DatabaseClusterEngine.auroraMysql({
                version: rds.AuroraMysqlEngineVersion.VER_3_07_1
            }),
            writer: rds.ClusterInstance.provisioned('writer', {
                publiclyAccessible: false,
                instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM)
            }),
            port: 3306,
            securityGroups: [dbSecurityGroup],
            vpc: importedVpc,
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
            },
            defaultDatabaseName: 'PBL',
            credentials: rds.Credentials.fromGeneratedSecret("pbl", {
                secretName: 'PBLCluster-secret'
            })
        })

        new cdk.CfnOutput(this, 'PBLRDSCluster', {
            value: db.clusterArn,
            description: 'RDS Cluster Arn',
            exportName: 'PBLRDSClusterArn'
        })
        new cdk.CfnOutput(this, 'PBLRDSSecret', {
            value: db.secret?.secretArn ?? "",
            description: 'RDS Cluster Secret Arn',
            exportName: 'PBLRDSSecretArn'
        })
    }
}