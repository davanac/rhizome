output "artifacts_bucket_name" {
  value       = scaleway_object_bucket.artifacts.name
  description = "Name of the artifacts bucket"
}

output "artifacts_bucket_endpoint" {
  value       = "https://s3.${var.region}.scw.cloud"
  description = "S3 endpoint for the artifacts bucket"
}

output "artifacts_bucket_url" {
  value       = "https://${scaleway_object_bucket.artifacts.name}.s3.${var.region}.scw.cloud"
  description = "Direct URL to the artifacts bucket"
}

output "github_secrets_config" {
  value = {
    scw_region = var.region
    artifacts_bucket = scaleway_object_bucket.artifacts.name
  }
  description = "GitHub secrets configuration for CI/CD"
}