# Local variable for bucket name
locals {
  bucket_name = var.bucket_name != "" ? var.bucket_name : "${var.project_name}-${var.environment}-artifacts"
}

# Artifacts bucket for storing JAR files and other build artifacts
resource "scaleway_object_bucket" "artifacts" {
  name   = local.bucket_name
  region = var.region
  
  tags = merge(var.tags, {
    Purpose = "Build Artifacts Storage"
  })
  
  dynamic "versioning" {
    for_each = var.enable_versioning ? [1] : []
    content {
      enabled = true
    }
  }
  
  dynamic "lifecycle_rule" {
    for_each = var.enable_versioning ? [1] : []
    content {
      id      = "cleanup-old-versions"
      enabled = true
      
      expiration {
        days = var.lifecycle_days * 3 # Keep current versions longer
      }
      
    }
  }
}

# Public read access for artifacts (needed for downloading JARs)
resource "scaleway_object_bucket_policy" "artifacts_policy" {
  bucket = scaleway_object_bucket.artifacts.name
  region = var.region
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${scaleway_object_bucket.artifacts.name}/*"
      }
    ]
  })
}

# Note: For now, use the main Scaleway credentials for CI/CD
# In production, you should create dedicated IAM credentials
# For this setup, use the main project credentials in GitHub secrets