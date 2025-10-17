output "state_bucket_name" {
  value       = scaleway_object_bucket.terraform_state.name
  description = "Name of the S3 bucket for Terraform state"
}

output "state_bucket_endpoint" {
  value       = "https://s3.${var.scaleway_region}.scw.cloud"
  description = "S3 endpoint for the Terraform state bucket"
}

output "backend_config" {
  value = <<-EOT
    Create a backend configuration file (backend-${var.environment}.hcl) with this content:

    bucket = "${scaleway_object_bucket.terraform_state.name}"
    region = "${var.scaleway_region}"
    endpoints = {
      s3 = "https://s3.${var.scaleway_region}.scw.cloud"
    }

    Then initialize your main Terraform configuration with:
    terraform init -backend-config=backend-${var.environment}.hcl

    Make sure to set these environment variables:
    export AWS_ACCESS_KEY_ID="your-scaleway-access-key"
    export AWS_SECRET_ACCESS_KEY="your-scaleway-secret-key"
  EOT
  description = "Backend configuration instructions"
}

output "backend_config_hcl" {
  value = <<-EOT
bucket = "${scaleway_object_bucket.terraform_state.name}"
region = "${var.scaleway_region}"
endpoints = {
  s3 = "https://s3.${var.scaleway_region}.scw.cloud"
}
  EOT
  description = "Backend configuration file content (ready to save)"
}