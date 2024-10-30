data "aws_availability_zones" "available" {
  state = "available"
}


locals {
  azs = data.aws_availability_zones.available.names

  # private / public 서브넷 마스크 정의
  subnet_newbits = 8  # /16 to /24 (16 + 8 = /24)

  # 퍼블릭 서브넷 생성 (*.*.0.0/24 부터 시작)
  public_subnet_cidrs = [
    for i in range(length(local.azs)) :
    cidrsubnet(var.vpc_cidr_block, local.subnet_newbits, i)
  ]

  # 프라이빗 서브넷 생성 (*.*.100.0/24 부터 시작)
  private_subnet_cidrs = [
    for i in range(length(local.azs)) :
    cidrsubnet(var.vpc_cidr_block, local.subnet_newbits, i + 100)
  ]
}

module "vpc" {
  source = "terraform-aws-modules/vpc/aws"

  name = "${var.resource_name_prefix}-vpc"
  cidr = var.vpc_cidr_block

  azs             = local.azs
  public_subnets  = local.public_subnet_cidrs
  private_subnets = local.private_subnet_cidrs

  enable_nat_gateway = true
  single_nat_gateway = true

  tags = {
    Name = "${var.resource_name_prefix}-vpc"
  }
}
