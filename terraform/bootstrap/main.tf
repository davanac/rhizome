provider "scaleway" {
  project_id = var.scaleway_project_id
  region     = var.scaleway_region
}

# Local variables
locals {
  state_bucket_name = var.state_bucket_name != "" ? var.state_bucket_name : "${var.project_name}-${var.environment}-terraform-state"

  tags = {
    Project     = var.project_name
    ManagedBy   = "Terraform"
    Environment = var.environment
  }
}

# Create the state bucket
resource "scaleway_object_bucket" "terraform_state" {
  name   = local.state_bucket_name
  region = var.scaleway_region
  
  tags = merge(local.tags, {
    Purpose = "Terraform State Storage"
  })
  
  versioning {
    enabled = true
  }
  
  lifecycle_rule {
    id      = "expire-old-versions"
    enabled = true
    
    expiration {
      days = 90
    }
  }
}

# Create bucket lock configuration for state locking
resource "scaleway_object_bucket_lock_configuration" "terraform_state_lock" {
  bucket = scaleway_object_bucket.terraform_state.name
  region = var.scaleway_region
  
  rule {
    default_retention {
      mode = "GOVERNANCE"
      days = 1
    }
  }
}