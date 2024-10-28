# backend
terraform {
  backend "s3" {
    bucket = "kmucs-cloud-computing-2024-terraform-state-bucket"
    key    = "terraform.tfstate"
    region = "us-west-2"
  }
}