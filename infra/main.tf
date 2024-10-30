terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.73.0"
    }
  }
}

provider "aws" {
  region = var.region
}

# datasource
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
