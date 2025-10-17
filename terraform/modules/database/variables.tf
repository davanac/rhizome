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

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
}

variable "private_network_id" {
  description = "ID of the private network for database"
  type        = string
}

variable "db_security_group_id" {
  description = "Security group ID for database"
  type        = string
}

variable "database_name" {
  description = "Name of the database to create"
  type        = string
}

variable "database_username" {
  description = "Username for the database"
  type        = string
}

variable "database_password" {
  description = "Password for the database (leave empty to auto-generate)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "instance_type" {
  description = "Database instance type"
  type        = string
  default     = "DB-DEV-S" # Small development instance
}

variable "engine_version" {
  description = "PostgreSQL engine version"
  type        = string
  default     = "15"
}

variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 7
}

variable "backup_schedule_hour" {
  description = "Hour of day for automated backups (0-23)"
  type        = number
  default     = 3
}

variable "enable_ha" {
  description = "Enable high availability (multi-AZ)"
  type        = bool
  default     = false
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}
