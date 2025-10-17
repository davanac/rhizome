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

variable "database_password" {
  description = "Database password to store as secret"
  type        = string
  sensitive   = true
}

variable "application_secrets" {
  description = "Additional application secrets"
  type        = map(string)
  default     = {}
  sensitive   = false
}

variable "jwt_secret" {
  description = "JWT signing secret (auto-generated if not provided)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "encryption_key" {
  description = "Application encryption key (auto-generated if not provided)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "secret_ttl" {
  description = "Time to live for secrets in seconds (0 means no expiration)"
  type        = number
  default     = 0
}

variable "enable_versioning" {
  description = "Enable secret versioning"
  type        = bool
  default     = true
}

# Note: Bucket names are no longer needed here as IAM is handled separately

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}