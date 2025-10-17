# ============================================================================
# INSTANCE ROLE OUTPUTS
# For compute instances to access secrets and artifacts
# ============================================================================

output "instance_role_application_id" {
  value       = scaleway_iam_application.instance_role.id
  description = "ID of the instance role IAM application"
}

output "instance_role_access_key" {
  value       = scaleway_iam_api_key.instance_role.access_key
  description = "Access key for instance role"
  sensitive   = true
}

output "instance_role_secret_key" {
  value       = scaleway_iam_api_key.instance_role.secret_key
  description = "Secret key for instance role"
  sensitive   = true
}

output "instance_role_credentials" {
  value = {
    access_key = scaleway_iam_api_key.instance_role.access_key
    secret_key = scaleway_iam_api_key.instance_role.secret_key
  }
  description = "Complete credentials for instance role"
  sensitive   = true
}

# ============================================================================
# GITHUB CI/CD OUTPUTS
# For GitHub Actions deployment
# ============================================================================

output "github_cicd_application_id" {
  value       = scaleway_iam_application.github_cicd.id
  description = "ID of the GitHub CI/CD IAM application"
}

output "github_cicd_access_key" {
  value       = scaleway_iam_api_key.github_cicd.access_key
  description = "Access key for GitHub CI/CD"
  sensitive   = true
}

output "github_cicd_secret_key" {
  value       = scaleway_iam_api_key.github_cicd.secret_key
  description = "Secret key for GitHub CI/CD"
  sensitive   = true
}

output "github_cicd_credentials" {
  value = {
    access_key = scaleway_iam_api_key.github_cicd.access_key
    secret_key = scaleway_iam_api_key.github_cicd.secret_key
  }
  description = "Complete credentials for GitHub CI/CD"
  sensitive   = true
}

# ============================================================================
# GITHUB SECRETS CONFIGURATION
# Ready-to-use values for GitHub repository secrets
# ============================================================================

output "github_secrets_configuration" {
  value = {
    SCALEWAY_ACCESS_KEY = scaleway_iam_api_key.github_cicd.access_key
    SCALEWAY_SECRET_KEY = scaleway_iam_api_key.github_cicd.secret_key
    SCALEWAY_REGION     = var.region
    SCALEWAY_PROJECT_ID = data.scaleway_account_project.current.id
    ARTIFACTS_BUCKET    = var.artifacts_bucket_name
    FRONTEND_BUCKET     = var.frontend_bucket_name
  }
  description = "Complete GitHub secrets configuration for CI/CD pipelines"
  sensitive   = true
}

# ============================================================================
# POLICY IDS (for reference)
# ============================================================================

output "instance_secrets_policy_id" {
  value       = scaleway_iam_policy.instance_secrets_access.id
  description = "ID of the instance secrets access policy"
}

output "instance_storage_policy_id" {
  value       = length(scaleway_iam_policy.instance_storage_access) > 0 ? scaleway_iam_policy.instance_storage_access[0].id : ""
  description = "ID of the instance storage access policy"
}

output "github_artifacts_policy_id" {
  value       = length(scaleway_iam_policy.github_artifacts_access) > 0 ? scaleway_iam_policy.github_artifacts_access[0].id : ""
  description = "ID of the GitHub artifacts access policy"
}

output "github_frontend_policy_id" {
  value       = length(scaleway_iam_policy.github_frontend_access) > 0 ? scaleway_iam_policy.github_frontend_access[0].id : ""
  description = "ID of the GitHub frontend access policy"
}