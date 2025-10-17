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

variable "owner_id" {
  description = "Scaleway owner ID for bucket policy (user_id:xxx or application_id:xxx)"
  type        = string
}

variable "domain_name" {
  description = "Domain name for the frontend"
  type        = string
}

variable "bucket_name" {
  description = "Custom bucket name for frontend assets (optional)"
  type        = string
  default     = ""
}

variable "enable_versioning" {
  description = "Enable versioning on the frontend bucket"
  type        = bool
  default     = true
}

variable "lifecycle_days" {
  description = "Number of days to keep old versions"
  type        = number
  default     = 30
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
