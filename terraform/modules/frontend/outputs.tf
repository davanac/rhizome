output "frontend_bucket_name" {
  value       = scaleway_object_bucket.frontend.name
  description = "Name of the frontend bucket"
}

output "frontend_bucket_endpoint" {
  value       = "https://s3.${var.region}.scw.cloud"
  description = "S3 endpoint for the frontend bucket"
}

output "frontend_bucket_url" {
  value       = "https://${scaleway_object_bucket.frontend.name}.s3.${var.region}.scw.cloud"
  description = "Direct URL to the frontend bucket"
}

output "frontend_website_endpoint" {
  value       = "https://${scaleway_object_bucket.frontend.name}.s3-website.${var.region}.scw.cloud"
  description = "Static website endpoint for the frontend bucket"
}

output "https_endpoint" {
  value       = "https://${var.domain_name}"
  description = "HTTPS URL to access the frontend application"
}

output "github_deployment_config" {
  value = {
    region = var.region
    bucket_name = scaleway_object_bucket.frontend.name
    bucket_endpoint = "https://s3.${var.region}.scw.cloud"
    domain = var.domain_name
  }
  description = "Configuration values for GitHub Actions deployment"
}

output "website_configuration_status" {
  value = {
    bucket_name       = scaleway_object_bucket.frontend.name
    website_enabled   = true
    index_document    = "index.html"
    error_document    = "index.html"  # SPA routing - all errors go to index.html
    spa_routing       = true
    public_access     = "enabled"
  }
  description = "Frontend bucket website configuration status"
}