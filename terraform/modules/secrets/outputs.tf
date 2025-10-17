output "database_password_secret_id" {
  value       = scaleway_secret.database_password.id
  description = "Secret Manager ID for database password"
}

output "jwt_secret_id" {
  value       = scaleway_secret.jwt_secret.id
  description = "Secret Manager ID for JWT secret"
}

output "encryption_key_secret_id" {
  value       = scaleway_secret.encryption_key.id
  description = "Secret Manager ID for encryption key"
}

output "application_secrets_ids" {
  value = {
    for key, secret in scaleway_secret.application_secrets : key => secret.id
  }
  description = "Secret Manager IDs for application secrets"
}

# Note: IAM-related outputs have been moved to the IAM module

output "all_secret_ids" {
  value = merge(
    {
      database_password = scaleway_secret.database_password.id
      jwt_secret       = scaleway_secret.jwt_secret.id
      encryption_key   = scaleway_secret.encryption_key.id
    },
    {
      for key, secret in scaleway_secret.application_secrets : key => secret.id
    }
  )
  description = "All secret IDs for application configuration"
}

output "secrets_summary" {
  value = {
    database_password_stored = true
    jwt_secret_generated     = local.jwt_secret != ""
    encryption_key_generated = local.encryption_key != ""
    additional_secrets_count = length(var.application_secrets)
    region                  = var.region
    versioning_enabled      = var.enable_versioning
  }
  description = "Summary of stored secrets"
  sensitive   = true
}

# Note: IAM credentials are now provided by the IAM module

# Output actual secret values for direct use
output "jwt_secret_value" {
  value       = local.jwt_secret
  description = "JWT secret value"
  sensitive   = true
}

output "encryption_key_value" {
  value       = local.encryption_key
  description = "Encryption key value"
  sensitive   = true
}

# Note: GitHub CI/CD outputs have been moved to the IAM module