resource "aws_db_subnet_group" "db_subnet_group" {
  name       = "${var.resource_name_prefix}-db-subnet-group"
  subnet_ids = module.vpc.private_subnets

  tags = {
    Name = "${var.resource_name_prefix}-db-subnet-group"
  }
}
resource "aws_rds_cluster" "aurora_cluster" {
  cluster_identifier          = "${var.resource_name_prefix}-cluster"
  engine                      = "aurora-mysql"
  engine_version              = "8.0.mysql_aurora.3.07.1"
  database_name               = var.db_name
  master_username             = var.db_username
  manage_master_user_password = true
  port                        = 3306
  vpc_security_group_ids      = [aws_security_group.db_sg.id]
  db_subnet_group_name        = aws_db_subnet_group.db_subnet_group.name
  skip_final_snapshot         = false
  final_snapshot_identifier   = "${var.resource_name_prefix}-final-snapshot"

  # Multi-AZ configuration
  availability_zones      = data.aws_availability_zones.available.names
}

resource "aws_rds_cluster_instance" "aurora_instance" {
  count               = 2
  identifier          = "${var.resource_name_prefix}-cluster-instance-${count.index + 1}"
  cluster_identifier  = aws_rds_cluster.aurora_cluster.id
  instance_class      = var.db_instance_type
  engine              = aws_rds_cluster.aurora_cluster.engine
  engine_version      = aws_rds_cluster.aurora_cluster.engine_version
  publicly_accessible = false
  availability_zone   = element(data.aws_availability_zones.available.names, count.index)
}
