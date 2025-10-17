variable "scaleway_project_id" {
  description = "Scaleway project ID"
  type        = string
}

variable "scaleway_region" {
  description = "Scaleway region"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name (prod, staging, etc.)"
  type        = string
}

variable "state_bucket_name" {
  description = "Name of the S3 bucket for Terraform state (defaults to <project_name>-<environment>-terraform-state)"
  type        = string
  default     = ""
}
