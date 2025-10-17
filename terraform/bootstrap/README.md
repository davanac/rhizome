# Bootstrap - Terraform State Management

This directory contains the infrastructure for managing Terraform state storage on Scaleway.

## Purpose

The bootstrap creates:
- S3-compatible Object Storage bucket for Terraform state
- Bucket versioning for state history
- Object lock configuration for state locking
- Lifecycle rules for old version cleanup

## Usage

### 1. First-time Setup

```bash
# Navigate to bootstrap directory
cd terraform/bootstrap

# Create terraform.tfvars
cat > terraform.tfvars <<EOF
scaleway_project_id = "your-project-id"
scaleway_region     = "fr-par"
environment         = "prod"
project_name        = "rhizome"
EOF

# Set environment variables
export SCW_ACCESS_KEY="your-scaleway-access-key"
export SCW_SECRET_KEY="your-scaleway-secret-key"
export SCW_PROJECT_ID="your-project-id"

# For S3 backend (same credentials)
export AWS_ACCESS_KEY_ID="$SCW_ACCESS_KEY"
export AWS_SECRET_ACCESS_KEY="$SCW_SECRET_KEY"

# Initialize and apply
terraform init
terraform plan
terraform apply
```

### 2. Get Backend Configuration

After applying, the output will show the backend configuration to use in your main Terraform configuration.

### 3. Configure Main Infrastructure

Copy the backend configuration from the output and add it to your main `terraform/backend.tf`.

## Important Notes

- **Run this ONCE per project/environment**
- The state bucket stores the state for your main infrastructure
- Don't delete this unless you want to lose all state history
- Keep the bootstrap state local (it's small and doesn't change often)

## State Management

The bootstrap itself uses local state storage since:
1. It's a one-time setup that rarely changes
2. Bootstrapping remote state with remote state creates circular dependency
3. The bootstrap state is small and can be backed up manually if needed

## Cleanup

To destroy the state infrastructure (⚠️ **DANGEROUS** ⚠️):

```bash
# This will destroy the bucket containing your main infrastructure state!
terraform destroy
```

Only do this when completely tearing down the project.

## Directory Structure

```
bootstrap/
├── main.tf          # State bucket and lock configuration
├── variables.tf     # Input variables
├── versions.tf      # Provider requirements
├── outputs.tf       # Backend configuration instructions
├── terraform.tfvars # Your specific values (gitignored)
└── README.md        # This file
```
