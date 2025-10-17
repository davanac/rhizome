variable "scaleway_project_id" {
  description = "Scaleway project ID"
  type        = string
}

variable "scaleway_region" {
  description = "Scaleway region"
  type        = string
  default     = "fr-par"
}

variable "scaleway_zone" {
  description = "Scaleway zone"
  type        = string
  default     = "fr-par-1"
}

variable "environment" {
  description = "Environment name (prod, staging, etc.)"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "allowed_ssh_ips" {
  description = "List of IP addresses allowed to SSH to bastion host"
  type        = list(string)
  default     = []
}

variable "ssh_public_key" {
  description = "SSH public key for user access on instances"
  type        = string
  default     = ""
}

variable "api_domain_name" {
  description = "Domain name for the load balancer and SSL certificate"
  type        = string
}

variable "api_url" {
  description = "Full external API URL including protocol (e.g., https://api.example.com)"
  type        = string
  default     = ""
}

variable "frontend_domain_name" {
  description = "Domain name for the frontend application"
  type        = string
}

variable "database_instance_type" {
  description = "Database instance type (DB-DEV-S, DB-GP-S, DB-GP-M, etc.)"
  type        = string
  default     = "DB-PLAY2-NANO"
}

variable "database_enable_ha" {
  description = "Enable database high availability (multi-AZ)"
  type        = bool
  default     = false
}

variable "database_name" {
  description = "Database name"
  type        = string
  default     = "rhizome"
}

variable "database_username" {
  description = "Database username"
  type        = string
  default     = "rhizome"
}

variable "database_password" {
  description = "Password for the database"
  type        = string
  sensitive   = true
}

variable "compute_instance_type" {
  description = "Compute instance type (DEV1-S, DEV1-M, GP1-S, GP1-M, etc.)"
  type        = string
  default     = "DEV1-M"
}

# Edge Services Configuration
variable "edge_services_plan" {
  description = "Edge Services plan for frontend CDN (starter, business, enterprise)"
  type        = string
  default     = "starter"

  validation {
    condition     = contains(["starter", "business", "enterprise"], var.edge_services_plan)
    error_message = "Edge Services plan must be one of: starter, business, enterprise."
  }
}

variable "frontend_cache_ttl" {
  description = "Default cache TTL in seconds for frontend assets"
  type        = number
  default     = 3600
}

variable "enable_frontend_waf" {
  description = "Enable Web Application Firewall for frontend"
  type        = bool
  default     = false
}

variable "grafana_auth_token" {
  description = "Authentication token for Grafana Cloud/Scaleway Cockpit monitoring"
  type        = string
  sensitive   = true
}

variable "wallet_encrypted_private_key" {
  description = "Encrypted blockchain wallet private key (base64 string from cfr.json)"
  type        = string
  sensitive   = true
}

variable "wallet_master_key_password" {
  description = "Master key password for blockchain wallet decryption"
  type        = string
  sensitive   = true
}

variable "wallet_master_key_id" {
  description = "Master key ID for blockchain wallet (JSON key name in cfr.json)"
  type        = string
  sensitive   = true
  default     = "rhizome.production"
}
