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

variable "vpc_cidr" {
  description = "CIDR block for VPC (must be between /20 and /29 for Scaleway)"
  type        = string
  default     = "10.0.0.0/24"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["fr-par-1", "fr-par-2"]
}

variable "gateway_type" {
  description = "Type of public gateway (VPC-GW-S, VPC-GW-M, VPC-GW-L)"
  type        = string
  default     = "VPC-GW-S"
}

variable "app_ports" {
  description = "Application ports to allow in security group"
  type        = list(number)
  default     = [3000, 8001]
}


variable "bastion_allowed_ips" {
  description = "List of IPs allowed to SSH to bastion"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}