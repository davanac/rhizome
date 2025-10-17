# Generate secrets if not provided
resource "random_password" "jwt_secret" {
  count            = var.jwt_secret == "" ? 1 : 0
  length           = 64
  special          = true
  override_special = "*-_=:.<>:"
  upper            = true
  lower            = true
  numeric          = true
}

resource "random_password" "encryption_key" {
  count   = var.encryption_key == "" ? 1 : 0
  length  = 32
  special = false
}

locals {
  jwt_secret     = var.jwt_secret != "" ? var.jwt_secret : random_password.jwt_secret[0].result
  encryption_key = var.encryption_key != "" ? var.encryption_key : random_password.encryption_key[0].result
}

# Database Password Secret
resource "scaleway_secret" "database_password" {
  name        = "${var.project_name}-${var.environment}-db-password"
  description = "Database password for ${var.project_name} ${var.environment}"
  region      = var.region
  
  tags = ["database", "password", var.environment, var.project_name]
}

resource "scaleway_secret_version" "database_password" {
  secret_id = scaleway_secret.database_password.id
  region    = var.region
  data      = var.database_password
}

# JWT Secret
resource "scaleway_secret" "jwt_secret" {
  name        = "${var.project_name}-${var.environment}-jwt-secret"
  description = "JWT signing secret for ${var.project_name} ${var.environment}"
  region      = var.region
  type        = "opaque"
  
  tags = ["jwt", "authentication", var.environment, var.project_name]
}

resource "scaleway_secret_version" "jwt_secret" {
  secret_id = scaleway_secret.jwt_secret.id
  region    = var.region
  data      = local.jwt_secret
}

# Encryption Key Secret
resource "scaleway_secret" "encryption_key" {
  name        = "${var.project_name}-${var.environment}-encryption-key"
  description = "Application encryption key for ${var.project_name} ${var.environment}"
  region      = var.region
  type        = "opaque"
  
  tags = ["encryption", "key", var.environment, var.project_name]
}

resource "scaleway_secret_version" "encryption_key" {
  secret_id = scaleway_secret.encryption_key.id
  region    = var.region
  data      = local.encryption_key
}

# Additional Application Secrets
resource "scaleway_secret" "application_secrets" {
  for_each = var.application_secrets
  
  name        = "${var.project_name}-${var.environment}-${each.key}"
  description = "Application secret: ${each.key} for ${var.project_name} ${var.environment}"
  region      = var.region
  type        = "opaque"
  
  tags = ["application", each.key, var.environment, var.project_name]
}

resource "scaleway_secret_version" "application_secrets" {
  for_each = var.application_secrets
  
  secret_id = scaleway_secret.application_secrets[each.key].id
  region    = var.region
  data      = each.value
}

# Note: IAM resources have been moved to the dedicated IAM module
# This module now focuses purely on secret storage and management
