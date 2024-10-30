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
    db_name            = var.db_name,
    db_secret_arn      = aws_rds_cluster.aurora_cluster.master_user_secret[0].secret_arn,
  }))

  depends_on = [
    aws_rds_cluster.aurora_cluster # EC2의 user data에서 RDS의 endpoint를 사용하기 때문에 RDS가 먼저 생성되어야 함
  ]
}

resource "aws_autoscaling_group" "web_asg" {
  name                = "${var.resource_name_prefix}-asg"
  max_size            = 4
  min_size            = 2
  desired_capacity    = 2
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

# asg policy
resource "aws_autoscaling_policy" "scale_up" {
  name                   = "${var.resource_name_prefix}-asg-scale_up"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  autoscaling_group_name = aws_autoscaling_group.web_asg.name
}

resource "aws_autoscaling_policy" "scale_down" {
  name                   = "${var.resource_name_prefix}-asg-scale_down"
  scaling_adjustment     = -1  
  adjustment_type        = "ChangeInCapacity"
  autoscaling_group_name = aws_autoscaling_group.web_asg.name
}

# cloud watch
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name           = "${var.resource_name_prefix}-cloud_watch-high"
  comparison_operator  = "GreaterThanThreshold"
  evaluation_periods   = "2"
  metric_name          = "CPUUtilization"
  namespace            = "AWS/EC2"
  period               = "60"
  statistic            = "Average"
  threshold            = "70"       # CPU 사용률 70% 이상
  alarm_actions        = [aws_autoscaling_policy.scale_up.arn]
  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.web_asg.name
  }
}

resource "aws_cloudwatch_metric_alarm" "cpu_low" {
  alarm_name           = "${var.resource_name_prefix}-cloud_watch-low"
  comparison_operator  = "LessThanThreshold"
  evaluation_periods   = "2"
  metric_name          = "CPUUtilization"
  namespace            = "AWS/EC2"
  period               = "60"
  statistic            = "Average"
  threshold            = "30"       # CPU 사용률 30% 이하
  alarm_actions        = [aws_autoscaling_policy.scale_down.arn]
  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.web_asg.name
  }
}