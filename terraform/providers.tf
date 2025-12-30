terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket  = "alicek106-terraform-state"
    key     = "yamler.tfstate"
    region  = "ap-northeast-2"
    encrypt = true
  }
}

# Default provider for S3 bucket (ap-northeast-2)
provider "aws" {
  region = var.aws_region
}

# Provider for ACM certificate (CloudFront requires us-east-1)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}
