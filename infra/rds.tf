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
  deletion_protection         = false
  skip_final_snapshot         = true

  # Multi-AZ
  allocated_storage         = 256
  db_cluster_instance_class = "db.r6gd.large"
  iops                      = 20
  storage_type              = "io1"
}

resource "aws_rds_cluster_instance" "aurora_instance" {
  count                = 2  # AZ: 2개
  availability_zone    = element(data.aws_availability_zones.available.names, count.index) # 데이터 리소스 이름 수정
  identifier           = "${var.resource_name_prefix}-cluster-instance-${count.index + 1}"
  cluster_identifier   = aws_rds_cluster.aurora_cluster.id
  instance_class       = "db.t4g.medium"
  engine               = aws_rds_cluster.aurora_cluster.engine
  engine_version       = aws_rds_cluster.aurora_cluster.engine_version
  publicly_accessible   = false
}