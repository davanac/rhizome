output "instance_ids" {
  value = scaleway_instance_server.app[*].id
  description = "IDs of the application instances"
}

output "instance_names" {
  value = scaleway_instance_server.app[*].name
  description = "Names of the application instances"
}

output "instance_private_network_ids" {
  value = [for instance in scaleway_instance_server.app : instance.private_network[0].pn_id]
  description = "Private network IDs for the application instances"
}

output "instance_public_ips" {
  value = scaleway_instance_server.app[*].public_ip
  description = "Public IP addresses of the application instances"
}

output "placement_group_ids" {
  value = var.enable_placement_group ? scaleway_instance_placement_group.app[*].id : []
  description = "IDs of the placement groups (if enabled)"
}

output "application_endpoints" {
  value = [
    for i, instance in scaleway_instance_server.app : "http://app-${i + 1}.internal:3000"
  ]
  description = "Application endpoints for load balancer configuration (use internal hostnames)"
}

output "instance_private_ips" {
  value = [
    for instance in scaleway_instance_server.app : 
      [for ip in instance.private_ips : ip.address if can(regex("^10\\.", ip.address))][0]
  ]
  description = "Private IP addresses of the application instances"
}