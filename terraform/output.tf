# Networking outputs
output "vpc_id" {
  value       = module.networking.vpc_id
  description = "ID of the VPC"
}

output "private_network_id" {
  value       = module.networking.private_network_id
  description = "ID of the private network where all resources will be deployed"
}

output "public_gateway_ip" {
  value       = module.networking.public_gateway_ip
  description = "Public IP of the gateway for outbound internet access"
}

output "app_security_group_ids" {
  value       = module.networking.app_security_group_ids
  description = "Map of security group IDs by zone for application instances"
}

output "db_security_group_id" {
  value       = module.networking.db_security_group_id
  description = "Security group ID for database"
}

# Database outputs
output "database_endpoint" {
  value       = module.database.database_endpoint
  description = "Database connection endpoint"
}

output "database_port" {
  value       = module.database.database_port
  description = "Database connection port"
}

output "database_name" {
  value       = module.database.database_name
  description = "Name of the main database"
}

output "database_username" {
  value       = module.database.database_username
  description = "Database username"
}

output "database_connection_params" {
  value       = module.database.database_connection_params
  description = "Database connection parameters (sensitive)"
  sensitive   = true
}

# Artifacts outputs
output "artifacts_bucket_name" {
  value       = module.artifacts.artifacts_bucket_name
  description = "Name of the artifacts bucket"
}

output "artifacts_bucket_url" {
  value       = module.artifacts.artifacts_bucket_url
  description = "Direct URL to the artifacts bucket"
}

output "github_secrets_config" {
  value       = module.artifacts.github_secrets_config
  description = "GitHub secrets configuration for CI/CD"
}

# Secrets outputs
output "secrets_summary" {
  value       = module.secrets.secrets_summary
  description = "Summary of stored secrets"
  sensitive   = true
}

# IAM outputs  
output "instance_role_credentials" {
  value       = module.iam.instance_role_credentials
  description = "IAM credentials for compute instances"
  sensitive   = true
}

# Compute outputs
output "instance_ids" {
  value       = module.compute.instance_ids
  description = "IDs of the application instances"
}

output "instance_private_network_ids" {
  value       = module.compute.instance_private_network_ids
  description = "Private network IDs for the application instances"
}

output "application_endpoints" {
  value       = module.compute.application_endpoints
  description = "Application endpoints for load balancer configuration"
}

# SSH Bastion outputs (replaces dedicated bastion)
output "ssh_bastion_enabled" {
  value       = module.networking.ssh_bastion_enabled
  description = "Whether SSH bastion is enabled on the public gateway"
}

output "ssh_bastion_address" {
  value       = module.networking.ssh_bastion_address
  description = "Public IP address for SSH bastion connection"
}

output "ssh_bastion_port" {
  value       = module.networking.ssh_bastion_port
  description = "Port on which SSH bastion listens"
}

output "ssh_bastion_command_example" {
  value = module.networking.ssh_bastion_enabled ? "ssh -J root@${module.networking.ssh_bastion_address}:${module.networking.ssh_bastion_port} root@<private-instance-ip>" : "SSH bastion not enabled - add allowed_ssh_ips to enable"
  description = "Example SSH command to connect through the bastion"
}

# Load Balancer outputs
output "lb_public_ip" {
  value       = module.loadbalancer.lb_public_ip
  description = "Public IP address of the load balancer"
}

output "application_url" {
  value       = module.loadbalancer.https_endpoint
  description = "HTTPS URL to access the application"
}

output "dns_configuration" {
  value = "Please configure your DNS A record for ${var.api_domain_name} to point to ${module.loadbalancer.lb_public_ip}"
  description = "DNS configuration instructions for API"
}

# Frontend outputs
output "frontend_bucket_name" {
  value       = module.frontend.frontend_bucket_name
  description = "Name of the frontend bucket"
}

output "frontend_application_url" {
  value       = module.frontend.https_endpoint
  description = "HTTPS URL to access the frontend application"
}

output "frontend_deployment_config" {
  value       = module.frontend.github_deployment_config
  description = "Configuration values for frontend GitHub Actions deployment"
}

# GitHub CI/CD outputs
output "github_cicd_secrets" {
  value       = module.iam.github_secrets_configuration
  description = "GitHub secrets configuration for CI/CD pipelines"
  sensitive   = true
}