output "vpc_id" {
  value       = scaleway_vpc.main.id
  description = "ID of the VPC"
}

output "vpc_name" {
  value       = scaleway_vpc.main.name
  description = "Name of the VPC"
}

output "private_network_id" {
  value       = scaleway_vpc_private_network.main.id
  description = "ID of the private network"
}

output "private_network_name" {
  value       = scaleway_vpc_private_network.main.name
  description = "Name of the private network"
}

output "vpc_cidr" {
  value       = var.vpc_cidr
  description = "CIDR block of the VPC"
}

output "public_gateway_id" {
  value       = scaleway_vpc_public_gateway.main.id
  description = "ID of the public gateway"
}

output "public_gateway_ip" {
  value       = scaleway_vpc_public_gateway_ip.main.address
  description = "Public IP address of the gateway"
}


output "lb_security_group_id" {
  value       = scaleway_instance_security_group.lb.id
  description = "ID of the load balancer security group"
}

output "app_security_group_ids" {
  value       = {
    for zone, sg in scaleway_instance_security_group.app : zone => sg.id
  }
  description = "Map of application security group IDs by zone"
}

output "db_security_group_id" {
  value       = scaleway_instance_security_group.db.id
  description = "ID of the database security group"
}

output "ssh_bastion_enabled" {
  value       = scaleway_vpc_public_gateway.main.bastion_enabled
  description = "Whether SSH bastion is enabled on the public gateway"
}

output "ssh_bastion_port" {
  value       = scaleway_vpc_public_gateway.main.bastion_port
  description = "Port on which SSH bastion listens"
}

output "ssh_bastion_address" {
  value       = scaleway_vpc_public_gateway.main.bastion_enabled ? scaleway_vpc_public_gateway_ip.main.address : null
  description = "Public IP address for SSH bastion connection"
}

output "availability_zones" {
  value       = var.availability_zones
  description = "List of availability zones"
}

output "gateway_zone" {
  value       = var.availability_zones[0]
  description = "Zone where the public gateway is deployed"
}