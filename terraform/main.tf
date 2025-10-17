provider "scaleway" {
  project_id = var.scaleway_project_id
  region     = var.scaleway_region
  zone       = var.scaleway_zone
}

# Main infrastructure configuration
# State management is handled in the bootstrap/ directory

# Local variables
locals {
  tags = {
    Project     = var.project_name
    ManagedBy   = "Terraform"
    Environment = var.environment
  }

  # Construct API URL if not provided
  api_url = var.api_url != "" ? var.api_url : "https://${var.api_domain_name}"
}

# Networking Module
module "networking" {
  source = "./modules/networking"

  project_name       = var.project_name
  environment        = var.environment
  region             = var.scaleway_region
  availability_zones = ["${var.scaleway_region}-1", "${var.scaleway_region}-2"]

  vpc_cidr = "10.0.0.0/24"

  # Gateway configuration
  gateway_type = "VPC-GW-S" # Small gateway for cost optimization

  # Application ports
  app_ports = [3000] # rhizome app port

  # SSH Bastion configuration (uses Public Gateway SSH bastion)
  bastion_allowed_ips = var.allowed_ssh_ips

  tags = local.tags
}

# Database Module
module "database" {
  source = "./modules/database"

  project_name       = var.project_name
  environment        = var.environment
  region             = var.scaleway_region
  availability_zones = ["${var.scaleway_region}-1", "${var.scaleway_region}-2"]

  # Network configuration
  private_network_id    = module.networking.private_network_id
  db_security_group_id  = module.networking.db_security_group_id

  # Database configuration
  database_name     = var.database_name
  database_username = var.database_username
  database_password = var.database_password

  # Instance configuration
  instance_type           = var.database_instance_type
  engine_version         = "16"
  backup_retention_days  = 7
  backup_schedule_hour   = 3
  enable_ha             = var.database_enable_ha

  tags = local.tags
}

# Artifacts Module
module "artifacts" {
  source = "./modules/artifacts"

  project_name = var.project_name
  environment  = var.environment
  region       = var.scaleway_region

  # Artifacts configuration
  enable_versioning = true
  lifecycle_days    = 30 # Keep old versions for 30 days

  tags = local.tags
}

# IAM Module (must come before secrets and compute modules)
module "iam" {
  source = "./modules/iam"

  project_name = var.project_name
  environment  = var.environment
  region       = var.scaleway_region

  # Bucket names for IAM policy configuration
  artifacts_bucket_name = module.artifacts.artifacts_bucket_name
  frontend_bucket_name  = module.frontend.frontend_bucket_name

  tags = local.tags
}

# Secrets Module
module "secrets" {
  source = "./modules/secrets"

  project_name = var.project_name
  environment  = var.environment
  region       = var.scaleway_region

  # Pass database password from database module
  database_password = module.database.database_connection_params.password

  # Application-specific secrets
  application_secrets = {
    # Add your application secrets here
    # api_key = "your-api-key"
    # oauth_secret = "your-oauth-secret"
  }

  # Auto-generate these if not provided
  jwt_secret     = ""  # Will be auto-generated
  encryption_key = ""  # Will be auto-generated

  tags = local.tags
}

# Compute Module
module "compute" {
  source = "./modules/compute"

  project_name = var.project_name
  environment  = var.environment
  region       = var.scaleway_region

  # Instance configuration
  instance_count      = 1
  instance_type       = var.compute_instance_type
  availability_zones  = ["${var.scaleway_region}-1", "${var.scaleway_region}-2"]

  # Network configuration
  private_network_id    = module.networking.private_network_id
  app_security_group_ids = module.networking.app_security_group_ids

  # Artifacts configuration
  artifacts_bucket_name = module.artifacts.artifacts_bucket_name
  artifacts_bucket_url  = module.artifacts.artifacts_bucket_url

  # Database configuration
  database_host     = module.database.database_endpoint
  database_port     = module.database.database_port
  database_name     = module.database.database_name
  database_username = module.database.database_username
  database_password = module.database.database_connection_params.password

  # Application secrets (direct values)
  jwt_secret     = module.secrets.jwt_secret_value

  # Secret Manager configuration (kept for compatibility)
  database_password_secret_id = module.secrets.database_password_secret_id
  jwt_secret_id              = module.secrets.jwt_secret_id

  # IAM credentials for secret access (from IAM module)
  iam_access_key = module.iam.instance_role_credentials.access_key
  iam_secret_key = module.iam.instance_role_credentials.secret_key


  # High availability
  enable_placement_group = true

  # SSH key configuration
  ssh_public_key = var.ssh_public_key

  # Monitoring configuration
  grafana_auth_token = var.grafana_auth_token

  # External URL
  external_url = local.api_url

  # Blockchain wallet configuration
  wallet_encrypted_private_key = var.wallet_encrypted_private_key
  master_key_password          = var.wallet_master_key_password
  master_key_id                = var.wallet_master_key_id

  tags = local.tags
}

# Load Balancer Module
module "loadbalancer" {
  source = "./modules/loadbalancer"

  name_prefix = "${var.project_name}-${var.environment}"
  zone        = var.scaleway_zone

  # Network configuration
  private_network_id = module.networking.private_network_id
  security_group_id  = module.networking.lb_security_group_id

  # Backend configuration
  backend_ips  = module.compute.instance_private_ips
  backend_port = 3000

  # TLS configuration
  domain_name = var.api_domain_name

  tags = [for k, v in local.tags : "${k}:${v}"]
}

# Frontend Module
module "frontend" {
  source = "./modules/frontend"

  project_name = var.project_name
  environment  = var.environment
  region       = var.scaleway_region
  owner_id     = var.scaleway_project_id

  # Domain configuration
  domain_name = var.frontend_domain_name

  # Frontend configuration
  enable_versioning = true
  lifecycle_days    = 30

  tags = local.tags
}

