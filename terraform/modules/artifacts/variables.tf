variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region" {
  description = "Scaleway region"
  type        = string
}

variable "bucket_name" {
  description = "Name of the artifacts bucket (defaults to <project_name>-<environment>-artifacts)"
  type        = string
  default     = ""
}

variable "enable_versioning" {
  description = "Enable versioning for artifacts"
  type        = bool
  default     = true
}

variable "lifecycle_days" {
  description = "Days to keep old versions of artifacts"
  type        = number
  default     = 30
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}