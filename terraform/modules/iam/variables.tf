variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name (prod, staging, etc.)"
  type        = string
}

variable "region" {
  description = "Scaleway region"
  type        = string
}

variable "artifacts_bucket_name" {
  description = "Name of the artifacts bucket for object storage access"
  type        = string
  default     = ""
}

variable "frontend_bucket_name" {
  description = "Name of the frontend bucket for object storage access"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}