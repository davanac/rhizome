# Get current project info
data "scaleway_account_project" "current" {}

# ============================================================================
# INSTANCE ROLE IAM APPLICATION
# For compute instances to access secrets and read artifacts
# ============================================================================

resource "scaleway_iam_application" "instance_role" {
  name        = "${var.project_name}-${var.environment}-instance-role"
  description = "IAM application for compute instances to access secrets and artifacts"
  
  tags = ["iam", "instance-role", "compute", var.environment, var.project_name]
}

# Policy for Secret Manager access (instances need to read secrets)
resource "scaleway_iam_policy" "instance_secrets_access" {
  name           = "${var.project_name}-${var.environment}-instance-secrets-access"
  description    = "Policy allowing compute instances to access application secrets"
  application_id = scaleway_iam_application.instance_role.id
  
  rule {
    permission_set_names = ["SecretManagerFullAccess"]
    project_ids         = [data.scaleway_account_project.current.id]
  }
}

# Policy for Object Storage read access (instances need to download artifacts)
resource "scaleway_iam_policy" "instance_storage_access" {
  count = var.artifacts_bucket_name != "" ? 1 : 0
  
  name           = "${var.project_name}-${var.environment}-instance-storage-access"
  description    = "Policy allowing compute instances to read from artifacts bucket"
  application_id = scaleway_iam_application.instance_role.id
  
  rule {
    permission_set_names = ["ObjectStorageReadOnly"]
    project_ids         = [data.scaleway_account_project.current.id]
  }
}

# Policy for Generative APIs access (instances need to access AI models)
resource "scaleway_iam_policy" "instance_generative_apis_access" {
  name           = "${var.project_name}-${var.environment}-instance-generative-apis-access"
  description    = "Policy allowing compute instances to access Scaleway Generative APIs"
  application_id = scaleway_iam_application.instance_role.id
  
  rule {
    permission_set_names = ["GenerativeApisFullAccess"]
    project_ids         = [data.scaleway_account_project.current.id]
  }
}

# API key for instance role
resource "scaleway_iam_api_key" "instance_role" {
  application_id = scaleway_iam_application.instance_role.id
  description    = "API key for compute instances to access secrets and artifacts"
  
  # Don't set expires_at to avoid constant recreation
}

# ============================================================================
# GITHUB CI/CD IAM APPLICATION  
# For GitHub Actions to deploy to object storage buckets
# ============================================================================

resource "scaleway_iam_application" "github_cicd" {
  name        = "${var.project_name}-${var.environment}-github-cicd"
  description = "IAM application for GitHub Actions CI/CD deployment"
  
  tags = ["iam", "github-cicd", "deployment", var.environment, var.project_name]
}

# Policy for artifacts bucket write access (GitHub deploys backend JARs)
resource "scaleway_iam_policy" "github_artifacts_access" {
  count = var.artifacts_bucket_name != "" ? 1 : 0
  
  name           = "${var.project_name}-${var.environment}-github-artifacts-access"
  description    = "Policy allowing GitHub Actions to write to artifacts bucket"
  application_id = scaleway_iam_application.github_cicd.id
  
  rule {
    permission_set_names = ["ObjectStorageFullAccess"]
    project_ids         = [data.scaleway_account_project.current.id]
  }
}

# Policy for frontend bucket write access (GitHub deploys React files)
resource "scaleway_iam_policy" "github_frontend_access" {
  count = var.frontend_bucket_name != "" ? 1 : 0
  
  name           = "${var.project_name}-${var.environment}-github-frontend-access"
  description    = "Policy allowing GitHub Actions to write to frontend bucket"
  application_id = scaleway_iam_application.github_cicd.id
  
  rule {
    permission_set_names = ["ObjectStorageFullAccess"]
    project_ids         = [data.scaleway_account_project.current.id]
  }
}

# API key for GitHub CI/CD
resource "scaleway_iam_api_key" "github_cicd" {
  application_id = scaleway_iam_application.github_cicd.id
  description    = "API key for GitHub Actions CI/CD deployment"
  
  # Don't set expires_at to avoid constant recreation
}