# VPC Configuration
resource "scaleway_vpc" "main" {
  name   = "${var.project_name}-${var.environment}-vpc"
  region = var.region
  
  tags = ["${var.project_name}", "${var.environment}", "vpc"]
}

# Single Private Network for all resources
resource "scaleway_vpc_private_network" "main" {
  name   = "${var.project_name}-${var.environment}-network"
  vpc_id = scaleway_vpc.main.id
  region = var.region
  
  ipv4_subnet {
    subnet = var.vpc_cidr
  }
  
  tags = ["${var.project_name}", "${var.environment}", "private-network"]
}

# Public Gateway for outbound internet access
resource "scaleway_vpc_public_gateway" "main" {
  name            = "${var.project_name}-${var.environment}-gateway"
  type            = var.gateway_type
  zone            = var.availability_zones[0]
  ip_id           = scaleway_vpc_public_gateway_ip.main.id
  bastion_enabled = length(var.bastion_allowed_ips) > 0
  bastion_port    = 2222
  
  tags = ["${var.project_name}", "${var.environment}", "public-gateway"]
}

# Public Gateway IP
resource "scaleway_vpc_public_gateway_ip" "main" {
  zone = var.availability_zones[0]
  
  tags = ["${var.project_name}", "${var.environment}", "gateway-ip"]
}


# Attach the gateway to the private network
resource "scaleway_vpc_gateway_network" "main" {
  gateway_id         = scaleway_vpc_public_gateway.main.id
  private_network_id = scaleway_vpc_private_network.main.id
  zone              = var.availability_zones[0]
  
  ipam_config {
    push_default_route = true
  }
}

# Security Groups
# Load Balancer Security Group
resource "scaleway_instance_security_group" "lb" {
  name                    = "${var.project_name}-${var.environment}-lb-sg"
  description            = "Security group for load balancer"
  zone                    = var.availability_zones[0]  # LB will be in first zone
  inbound_default_policy = "drop"
  outbound_default_policy = "accept"

  inbound_rule {
    action   = "accept"
    port     = 80
    protocol = "TCP"
    ip_range = "0.0.0.0/0"
  }

  inbound_rule {
    action   = "accept"
    port     = 443
    protocol = "TCP"
    ip_range = "0.0.0.0/0"
  }

  tags = ["${var.project_name}", "${var.environment}", "load-balancer", "security-group"]
}

# Application Security Groups (one per zone)
resource "scaleway_instance_security_group" "app" {
  for_each = toset(var.availability_zones)
  
  name                    = "${var.project_name}-${var.environment}-app-sg-${each.key}"
  description            = "Security group for application instances in ${each.key}"
  zone                    = each.key
  inbound_default_policy = "drop"
  outbound_default_policy = "accept"

  # Allow traffic from load balancer (using VPC CIDR)
  inbound_rule {
    action   = "accept"
    port     = var.app_ports[0] # Application port (3000, also used for health checks)
    protocol = "TCP"
    ip_range = var.vpc_cidr
  }

  # SSH access from within VPC
  inbound_rule {
    action   = "accept"
    port     = 22
    protocol = "TCP"
    ip_range = var.vpc_cidr
  }


  tags = ["${var.project_name}", "${var.environment}", "application", "security-group"]
}

# Database Security Group
resource "scaleway_instance_security_group" "db" {
  name                    = "${var.project_name}-${var.environment}-db-sg"
  description            = "Security group for database"
  zone                    = var.availability_zones[0]  # Database is in first zone
  inbound_default_policy = "drop"
  outbound_default_policy = "accept"

  # Allow database access from within VPC
  inbound_rule {
    action   = "accept"
    port     = 5432
    protocol = "TCP"
    ip_range = var.vpc_cidr
  }

  tags = ["${var.project_name}", "${var.environment}", "database", "security-group"]
}

