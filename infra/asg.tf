data "aws_ami" "ubuntu" {
  most_recent = true

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
  filter {
    name   = "root-device-type"
    values = ["ebs"]
  }

  owners = ["099720109477"] # amazon
}

resource "aws_launch_template" "web_lt" {
  name_prefix   = "${var.resource_name_prefix}-lt-"
  image_id      = data.aws_ami.ubuntu.id
  instance_type = var.instance_type

  iam_instance_profile {
    name = "LabInstanceProfile" # aws_iam_instance_profile.ec2_instance_profile.name
  }

  network_interfaces {
    associate_public_ip_address = false
    security_groups             = [aws_security_group.web_sg.id]
  }

  user_data = base64encode(templatefile("${path.module}/templates/user_data.sh.tftpl", {
    db_endpoint        = aws_rds_cluster.aurora_cluster.endpoint,
    db_master_username = var.db_username,
    db_secret_arn      = aws_secretsmanager_secret.db_secret.arn,
  }))
}

resource "aws_autoscaling_group" "web_asg" {
  name                = "${var.resource_name_prefix}-asg"
  max_size            = 2
  min_size            = 1
  desired_capacity    = 1
  vpc_zone_identifier = module.vpc.private_subnets

  launch_template {
    id      = aws_launch_template.web_lt.id
    version = "$Latest"
  }

  target_group_arns = [aws_lb_target_group.web_tg.arn]

  tag {
    key                 = "Name"
    value               = "${var.resource_name_prefix}-web-instance"
    propagate_at_launch = true
  }
}
