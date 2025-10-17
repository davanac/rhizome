terraform {
  backend "s3" {
    # Scaleway Object Storage is S3-compatible
    # bucket and region are provided via -backend-config during terraform init
    # Example: terraform init -backend-config=backend-prod.hcl
    key                         = "terraform.tfstate"
    skip_credentials_validation = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_metadata_api_check     = true
    skip_s3_checksum            = true
    use_path_style              = true
  }
}
