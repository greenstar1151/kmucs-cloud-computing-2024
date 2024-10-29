output "vpc_id" {
  value = module.vpc.vpc_id
}

output "public_subnet_ids" {
  value = module.vpc.public_subnets
}

output "private_subnet_ids" {
  value = module.vpc.private_subnets
}

output "rds_cluster_arn" {
  value = aws_rds_cluster.aurora_cluster.arn
}

output "alb_dns_name" {
  value = aws_lb.web_alb.dns_name
}
