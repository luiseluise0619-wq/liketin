variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-2"
}

variable "project_name" {
  description = "Project / resource name prefix"
  type        = string
  default     = "liketin"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
}
