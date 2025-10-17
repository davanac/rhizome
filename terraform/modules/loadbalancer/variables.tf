variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "zone" {
  description = "Scaleway zone"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = list(string)
  default     = []
}

variable "private_network_id" {
  description = "ID of the private network to attach the load balancer to"
  type        = string
}

variable "lb_type" {
  description = "Load balancer type (LB-S, LB-GP-M, LB-GP-L)"
  type        = string
  default     = "LB-S"
}

variable "backend_ips" {
  description = "List of backend instance IPs"
  type        = list(string)
}

variable "backend_port" {
  description = "Port where the backend application is running"
  type        = number
  default     = 3000
}

variable "domain_name" {
  description = "Domain name for TLS certificate"
  type        = string
}

variable "security_group_id" {
  description = "Security group ID for the load balancer"
  type        = string
}
