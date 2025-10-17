# Cloud-init configuration
locals {
  cloud_init = templatefile("${path.module}/templates/cloud-init.yml", {
    artifacts_bucket_name = var.artifacts_bucket_name
    
    # Database configuration
    database_host     = var.database_host
    database_port     = var.database_port
    database_name     = var.database_name
    database_username = var.database_username
    database_password = var.database_password
    
    # Application secrets
    jwt_secret     = var.jwt_secret
    
    # Secret Manager configuration (kept for reference but not used)
    database_password_secret_id = var.database_password_secret_id
    jwt_secret_id = var.jwt_secret_id
    
    # IAM credentials for secret access
    scw_access_key = var.iam_access_key
    scw_secret_key = var.iam_secret_key
    scw_region = var.region
    
    # Application configuration
    project_name = var.project_name
    environment = var.environment
    
    # SSH key configuration
    ssh_public_key = var.ssh_public_key
    
    # Monitoring configuration
    grafana_auth_token = var.grafana_auth_token

    # External URL
    external_url = var.external_url

    # Blockchain wallet configuration
    wallet_encrypted_private_key = var.wallet_encrypted_private_key
    master_key_id                = var.master_key_id
    master_key_password          = var.master_key_password

  })
}

# Placement groups for high availability (one per zone)
resource "scaleway_instance_placement_group" "app" {
  count = var.enable_placement_group ? length(var.availability_zones) : 0
  
  name        = "${var.project_name}-${var.environment}-app-pg-${count.index + 1}"
  policy_type = "max_availability"
  policy_mode = "optional"
  zone        = var.availability_zones[count.index]
  
  tags = ["${var.project_name}", "${var.environment}", "placement-group", "zone-${count.index + 1}"]
}

# Application instances
resource "scaleway_instance_server" "app" {
  count = var.instance_count
  
  name  = "${var.project_name}-${var.environment}-app-${count.index + 1}"
  image = var.instance_image
  type  = var.instance_type
  zone  = var.availability_zones[count.index % length(var.availability_zones)]
  
  # Placement group for HA (if enabled) - use the placement group for this zone
  placement_group_id = var.enable_placement_group ? scaleway_instance_placement_group.app[count.index % length(var.availability_zones)].id : null
  
  # Network configuration
  private_network {
    pn_id = var.private_network_id
  }
  
  # Security - use the security group for this instance's zone
  security_group_id = var.app_security_group_ids[var.availability_zones[count.index % length(var.availability_zones)]]
  
  # Cloud-init user data
  user_data = {
    cloud-init = local.cloud_init
  }
  
  # Enable deletion protection for production
  enable_dynamic_ip = false
  
  tags = ["${var.project_name}", "${var.environment}", "application", "instance-${count.index + 1}"]

}