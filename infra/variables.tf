variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2" # Oregon
}

variable "resource_name_prefix" {
  description = "Resource name prefix(lowercase alphanumeric, hyphens, underscores, periods, spaces)"
  type        = string
  default     = "pbl"
}

variable "vpc_cidr_block" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.32.0.0/16"
}

variable "db_username" {
  description = "Username for the RDS database"
  type        = string
  default     = "nodeapp"
}

variable "db_name" {
  description = "Name of the RDS database"
  type        = string
  default     = "COFFEE"
}

variable "instance_type" {
  description = "EC2 instance type for the ASG"
  type        = string
  default     = "t3.nano"
}
