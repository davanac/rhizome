# Local variable for bucket name
locals {
  bucket_name = var.bucket_name != "" ? var.bucket_name : "${var.project_name}-${var.environment}-webapp"
}

# Frontend bucket for storing React static files
resource "scaleway_object_bucket" "frontend" {
  name   = local.bucket_name
  region = var.region

  tags = merge(var.tags, {
    Purpose = "Frontend Static Files"
    Type    = "React Application"
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
        days = var.lifecycle_days
      }

    }
  }
}

# Enable static website hosting
resource "scaleway_object_bucket_website_configuration" "frontend" {
  bucket = scaleway_object_bucket.frontend.name
  region = var.region

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"  # SPA: all errors redirect to index.html for client-side routing
  }
}

# # Bucket policy: Owner full access + Public read access
# resource "scaleway_object_bucket_policy" "frontend_policy" {
#   bucket = scaleway_object_bucket.frontend.name
#   region = var.region
#
#   policy = jsonencode(
#   {
#  "Id": "rhizome-production-webapp-policy",
#  "Statement": [
#    {
#      "Action": [
#        "s3:GetObject"
#      ],
#      "Effect": "Allow",
#      "Principal": "*",
#      "Resource": [
#        "rhizome-production-webapp/*"
#      ],
#      "Sid": "PublicReadGetObject"
#    },
#    {
#      "Action": "*",
#      "Effect": "Allow",
#      "Principal": {
#        "SCW": [
#          "user_id:a3218f2a-3c32-4f0a-8927-4470e3a7e5df"
#        ]
#      },
#      "Resource": [
#        "rhizome-production-webapp",
#        "rhizome-production-webapp/*"
#      ],
#      "Sid": "Scaleway secure statement"
#    }
#  ],
#  "Version": "2023-04-17"
# }
# )
# }
