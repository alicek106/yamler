variable "aws_region" {
  description = "AWS region for S3 bucket"
  type        = string
  default     = "ap-northeast-2"
}

variable "domain_name" {
  description = "Domain name for the website"
  type        = string
  default     = "yamler.alicek106.com"
}

variable "root_domain" {
  description = "Root domain for Route53 hosted zone"
  type        = string
  default     = "alicek106.com"
}

variable "bucket_name" {
  description = "S3 bucket name (must be globally unique)"
  type        = string
  default     = "yamler-alicek106-com"
}
