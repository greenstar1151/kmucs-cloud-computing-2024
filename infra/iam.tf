# AWS Learner Lab 제한으로 인해 IAM 생성 생략
# `LabRole` 사용

# resource "aws_iam_role" "ec2_role" {
#   name = "${var.resource_name_prefix}-ec2-role"

#   assume_role_policy = data.aws_iam_policy_document.ec2_assume_role_policy.json
# }

# data "aws_iam_policy_document" "ec2_assume_role_policy" {
#   statement {
#     effect = "Allow"

#     principals {
#       type        = "Service"
#       identifiers = ["ec2.amazonaws.com"]
#     }

#     actions = ["sts:AssumeRole"]
#   }
# }

# resource "aws_iam_instance_profile" "ec2_instance_profile" {
#   name = "${var.resource_name_prefix}-ec2-instance-profile"
#   role = aws_iam_role.ec2_role.name
# }

# resource "aws_iam_role_policy_attachment" "attach_secretsmanager_policy" {
#   role       = aws_iam_role.ec2_role.name
#   policy_arn = aws_iam_policy.ec2_secretsmanager_policy.arn
# }
