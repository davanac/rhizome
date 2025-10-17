# Generate random password if not provided
resource "random_password" "db_password" {
  count            = var.database_password == "" ? 1 : 0
  length           = 32
  special          = true
  override_special = "*-_=:.<>:"
  upper            = true
  lower            = true
  numeric          = true
}

locals {
  db_password = var.database_password != "" ? var.database_password : random_password.db_password[0].result
}

# Database instance
resource "scaleway_rdb_instance" "main" {
  name           = "${var.project_name}-${var.environment}-postgres"
  node_type      = var.instance_type
  engine         = "PostgreSQL-${var.engine_version}"
  region         = var.region
  is_ha_cluster  = var.enable_ha
  volume_type       = "sbs_5k"
  volume_size_in_gb = 10

  # Security: Enable encryption at rest for all environments
  # - Encrypts database data at volume level using LUKS with aes-xts-plain64
  # - Automatic backups (snapshots) are also encrypted
  # - Key management handled by Scaleway
  # - Once enabled, cannot be disabled (irreversible)
  encryption_at_rest = true

  # Network configuration
  private_network {
    pn_id       = var.private_network_id
    enable_ipam = true
  }

  # Backup configuration
  backup_schedule_frequency = 24 # Daily
  backup_schedule_retention = var.backup_retention_days
  backup_same_region        = true

  # Maintenance window will use default settings

  tags = ["${var.project_name}", "${var.environment}", "postgresql"]

  # Ensure database is deleted when destroying
  disable_backup = false

}

# Database ACL for security
resource "scaleway_rdb_acl" "main" {
  instance_id = scaleway_rdb_instance.main.id

  # Allow access from private network only
  acl_rules {
    ip          = "10.0.0.0/24" # VPC CIDR
    description = "Private network access"
  }
}

# Database user
resource "scaleway_rdb_user" "main" {
  instance_id = scaleway_rdb_instance.main.id
  name        = var.database_username
  password    = local.db_password
  is_admin    = true
}

# Main database
resource "scaleway_rdb_database" "main" {
  instance_id = scaleway_rdb_instance.main.id
  name        = var.database_name
}

# IMPORTANT: Manual steps required after deployment:
#
# 1. Grant database privileges in Scaleway UI:
#    RDB instance → Users → Select user → Grant privileges on the database
#    (This is a limitation of the current Terraform provider)
