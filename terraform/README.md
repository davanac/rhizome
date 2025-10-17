# Terraform Infrastructure

This directory contains Terraform configurations for deploying on Scaleway.

## Prerequisites

1. **Scaleway Account**: You need a Scaleway account with:
   - Project ID
   - Access Key and Secret Key

2. **Terraform**: Install Terraform >= 1.5.0

3. **Environment Variables**: Set the following:
   ```bash
   export SCW_ACCESS_KEY="your-scaleway-access-key"
   export SCW_SECRET_KEY="your-scaleway-secret-key"
   export SCW_PROJECT_ID="your-project-id"
   
   # For S3 backend (uses same credentials)
   export AWS_ACCESS_KEY_ID="$SCW_ACCESS_KEY"
   export AWS_SECRET_ACCESS_KEY="$SCW_SECRET_KEY"
   ```

## Initial Setup

### 1. Bootstrap State Management (One-time)

Before deploying infrastructure, you need to create the Terraform state storage:

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
export AWS_ACCESS_KEY_ID="$SCW_ACCESS_KEY"
export AWS_SECRET_ACCESS_KEY="$SCW_SECRET_KEY"

# Initialize and create state bucket
terraform init
terraform apply
```

### 2. Configure Main Infrastructure

After bootstrap, use the output to create your backend configuration:

```bash
# Navigate back to main terraform directory
cd ../

# Save the backend config from bootstrap output
cd bootstrap
terraform output -raw backend_config_hcl > ../backend-prod.hcl
cd ../

# Or manually create backend configuration file
cat > backend-prod.hcl <<EOF
bucket = "rhizome-prod-terraform-state"
region = "fr-par"
endpoints = {
  s3 = "https://s3.fr-par.scw.cloud"
}
EOF

# Create terraform.tfvars for main infrastructure
cat > terraform.tfvars <<EOF
scaleway_project_id = "your-project-id"
scaleway_owner_id   = "user_id:your-user-id"  # Find at https://console.scaleway.com/iam/users
scaleway_region     = "fr-par"
scaleway_zone       = "fr-par-1"
environment         = "prod"
project_name        = "rhizome"

# Database Configuration (optional, defaults to "rhizome")
database_name       = "rhizome"
database_username   = "rhizome"

# Domain Configuration
api_domain_name      = "api.yourdomain.com"
frontend_domain_name = "app.yourdomain.com"

# SSH Configuration (REQUIRED)
ssh_public_key  = "ssh-rsa AAAA... your-public-key"
allowed_ssh_ips = ["your.public.ip.address/32"]

# Monitoring
grafana_auth_token = "your-grafana-token"
EOF

# Initialize with remote state backend
terraform init -backend-config=backend-prod.hcl

# Deploy infrastructure
terraform plan
terraform apply
```

**For different environments or regions**, create separate backend config files:

```bash
# Staging environment (same region)
cat > backend-staging.hcl <<EOF
bucket = "rhizome-staging-terraform-state"
region = "fr-par"
endpoints = {
  s3 = "https://s3.fr-par.scw.cloud"
}
EOF

# Production in different region (e.g., nl-ams)
cat > backend-prod-nl.hcl <<EOF
bucket = "rhizome-prod-terraform-state"
region = "nl-ams"
endpoints = {
  s3 = "https://s3.nl-ams.scw.cloud"
}
EOF

terraform init -backend-config=backend-staging.hcl
```

## Naming Conventions

All resources follow this naming pattern:
- State bucket: `<project_name>-<environment>-terraform-state`
- Resources: `<project_name>-<environment>-<resource-type>`

## Usage

### Plan changes:
```bash
terraform plan
```

### Apply changes:
```bash
terraform apply
```

### Destroy infrastructure:
```bash
terraform destroy
```

## Architecture

The infrastructure will include:
- VPC with public/DMZ/private subnets across 2 AZs
- Application instances with auto-scaling
- Managed PostgreSQL database
- Application Load Balancer with SSL
- Secrets management
- Monitoring and logging

## Using Deployed Infrastructure

### Accessing Secrets

To access secrets from your application, use the Scaleway SDK or API with the provided IAM credentials:

1. **Get IAM credentials from Terraform outputs:**
   ```bash
   terraform output iam_credentials
   ```

2. **Access secrets by ID:**
   - Database Password: Use `terraform output secrets_summary` to get secret IDs
   - JWT Secret: Available in Secret Manager
   - Encryption Key: Available in Secret Manager

3. **Example API call:**
   ```bash
   curl -H "X-Auth-Token: $SCW_SECRET_KEY" \
        "https://api.scaleway.com/secret-manager/v1alpha1/regions/fr-par/secrets/{secret_id}/access"
   ```

### GitHub CI/CD Configuration

Set these GitHub repository secrets for CI/CD:

```bash
# Get values from terraform outputs
SCW_ACCESS_KEY: (use your main Scaleway access key)
SCW_SECRET_KEY: (use your main Scaleway secret key)
SCW_REGION: $(terraform output -raw github_secrets_config | jq -r .scw_region)
ARTIFACTS_BUCKET: $(terraform output -raw github_secrets_config | jq -r .artifacts_bucket)
```

### Database Connection

Your application can connect to the PostgreSQL database using:

```bash
# Get connection details
terraform output database_endpoint
terraform output database_port
terraform output database_name
terraform output database_username
# Password is stored in Secret Manager
```

### SSH Access to Instances

**Connect to bastion host:**
```bash
# Get bastion IP and SSH command
terraform output bastion_public_ip
terraform output bastion_ssh_command

# Connect to bastion
ssh -i ~/.ssh/your_private_key root@$(terraform output -raw bastion_public_ip)
```

**From bastion, connect to application instances:**
```bash
# Use helper commands on bastion
ssh-app 1  # Connect to first app instance
ssh-app 2  # Connect to second app instance

# Check application status on all instances
check-app-status

# Manual SSH to specific instance
ssh -i ~/.ssh/your_private_key rhizome@10.0.0.5  # First instance
ssh -i ~/.ssh/your_private_key rhizome@10.0.0.6  # Second instance
```

**Monitor application:**
```bash
# On app instances, check service status
sudo systemctl status rhizome
sudo journalctl -u rhizome -f  # Follow logs
sudo systemctl restart rhizome  # Restart if needed

# Check cloud-init logs
sudo tail -f /var/log/cloud-init-output.log
```

## Architecture

The deployed infrastructure includes:
- ✅ VPC with private networking
- ✅ Managed PostgreSQL database with private access
- ✅ Object storage for artifacts
- ✅ Secret Manager for sensitive data
- ✅ IAM policies for secure access
- ✅ Security groups for network isolation
