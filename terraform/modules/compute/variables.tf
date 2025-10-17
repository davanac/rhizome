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
  description = "List of availability zones for instance deployment"
  type        = list(string)
}

variable "instance_count" {
  description = "Number of application instances to deploy"
  type        = number
  default     = 1
}

variable "instance_type" {
  description = "Instance type for application servers"
  type        = string
  default     = "PRO2-XXS"
}

variable "instance_image" {
  description = "Instance image for application servers"
  type        = string
  default     = "ubuntu_noble"
}

variable "private_network_id" {
  description = "Private network ID for instance deployment"
  type        = string
}

variable "app_security_group_ids" {
  description = "Map of security group IDs by zone for application instances"
  type        = map(string)
}

variable "artifacts_bucket_name" {
  description = "Name of the artifacts bucket"
  type        = string
}

variable "artifacts_bucket_url" {
  description = "URL of the artifacts bucket"
  type        = string
}

variable "database_host" {
  description = "Database host address"
  type        = string
}

variable "database_port" {
  description = "Database port"
  type        = number
}

variable "database_name" {
  description = "Database name"
  type        = string
}

variable "database_username" {
  description = "Database username"
  type        = string
}

variable "database_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT secret"
  type        = string
  sensitive   = true
}

variable "database_password_secret_id" {
  description = "Secret Manager ID for database password"
  type        = string
}

variable "jwt_secret_id" {
  description = "Secret Manager ID for JWT secret"
  type        = string
}


variable "iam_access_key" {
  description = "IAM access key for secret access"
  type        = string
  sensitive   = true
}

variable "iam_secret_key" {
  description = "IAM secret key for secret access"
  type        = string
  sensitive   = true
}

variable "enable_placement_group" {
  description = "Enable placement group for high availability"
  type        = bool
  default     = true
}

variable "ssh_public_key" {
  description = "SSH public key for user access"
  type        = string
  default     = ""
}


variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "grafana_auth_token" {
  description = "Authentication token for Grafana Cloud/Scaleway Cockpit monitoring"
  type        = string
  sensitive   = true
}

variable "external_url" {
  description = "External url for the backend"
  type        = string
}

variable "wallet_encrypted_private_key" {
  description = "Encrypted blockchain wallet private key (base64 string from cfr.json)"
  type        = string
  sensitive   = true
}

variable "master_key_id" {
  description = "Master key ID for blockchain wallet encryption (JSON key name in cfr.json)"
  type        = string
  sensitive   = true
}

variable "master_key_password" {
  description = "Master key password for blockchain wallet decryption"
  type        = string
  sensitive   = true
}
