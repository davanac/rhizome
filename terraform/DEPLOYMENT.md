# Infrastructure on Scaleway

This Terraform configuration deploys the complete Rhizome application infrastructure on Scaleway cloud.

## Architecture Overview

```
Internet → Load Balancer → Application Instances → Database
                ↓
            Artifacts Bucket ← GitHub Actions
                ↓
            Secrets Bucket
```

### Components

1. **Networking** (`modules/networking/`)
   - VPC with private network
   - Public Gateway for internet access
   - Security groups for application, database, and load balancer

2. **Database** (`modules/database/`)
   - PostgreSQL 15
   - Private network connectivity
   - Automated backups
   - Auto-generated password

3. **Compute** (`modules/compute/`)
   - Application instances with cloud-init
   - Auto-deployment of backend application
   - Health check endpoints
   - SSH key management

4. **Load Balancer** (`modules/loadbalancer/`)
   - HTTP/HTTPS traffic distribution
   - Health checks
   - SSL termination support
   - Session stickiness options

5. **Artifacts** (`modules/artifacts/`)
   - S3-compatible storage for deployable files
   - Public read access for downloads
   - Versioning and lifecycle management
   - GitHub Actions integration

6. **Secrets** (`modules/secrets/`)
   - Scaleway Secret Manager integration
   - AES-256 encryption with KMS
   - Auto-generated JWT and encryption keys
   - IAM-based access control with dedicated service account
   - Runtime secret fetching via API

## Prerequisites

1. **Scaleway Account**
   - Project with billing enabled
   - Access and secret keys

2. **Terraform**
   - Version >= 1.0
   - Scaleway provider v2.55.0+

3. **Environment Variables**
   ```bash
   export SCW_ACCESS_KEY="your-access-key"
   export SCW_SECRET_KEY="your-secret-key"
   export SCW_DEFAULT_PROJECT_ID="your-project-id"
   export SCW_DEFAULT_REGION="fr-par"
   export SCW_DEFAULT_ZONE="fr-par-1"
   ```

## Deployment

### 1. Bootstrap (One-time setup)
First, create the Terraform state bucket:

```bash
cd bootstrap/
terraform init
terraform plan
terraform apply
```

### 2. Main Infrastructure
Deploy the complete infrastructure:

```bash
terraform init
terraform plan
terraform apply
```

### 3. Configuration
Configure your `terraform.tfvars`:

```hcl
project_name = "rhizome"
environment  = "dev"

scaleway_project_id = "your-project-id"
scaleway_region     = "fr-par"
scaleway_zone       = "fr-par-1"

tags = {
  Project     = "Rhizome"
  Environment = "Development"
  ManagedBy   = "Terraform"
}
```

## GitHub Actions Integration

Update your repository secrets with the outputs from Terraform:

1. **Required Secrets:**
   - `SCW_ACCESS_KEY`: Your Scaleway access key
   - `SCW_SECRET_KEY`: Your Scaleway secret key
   - `SCW_REGION`: Deployment region (e.g., fr-par)
   - `ARTIFACTS_BUCKET`: Name of the artifacts bucket

2. **Workflow Updates:**
   The GitHub workflow (`.github/workflows/publish.yml`) has been updated to:
   - Build, package, zip the server
   - Upload zip to Scaleway Object Storage
   - Use S3-compatible endpoints

## Application Configuration

The cloud-init script automatically:

1. **Installs Node** and other dependencies
2. **Downloads the application zip** from artifacts bucket
3. **Sets up Secret Manager integration**:
   - Creates secret fetching script with API access
   - Configures IAM credentials for secret access
   - Implements secure secret retrieval at startup
4. **Configures the application** with:
   - Database connection parameters (password from Secret Manager)
   - Security configuration (JWT and encryption keys from Secret Manager)
   - Application properties with environment variable substitution
   - Logging configuration
5. **Creates systemd service** with secret pre-loading
6. **Sets up health checks** for load balancer

### Application URLs

After deployment:
- **Application**: `http://<load-balancer-ip>`
- **Health Check**: `TBD`

## Security Features

- **Network Isolation**: All resources in private network
- **Security Groups**: Restrictive firewall rules
- **Secret Management**: Scaleway Secret Manager with AES-256 encryption
- **IAM Integration**: Dedicated service accounts with minimal permissions
- **Runtime Secret Fetching**: Secrets never stored on disk permanently
- **SSH Access**: Key-based authentication only
- **Database Security**: Private network access only with secret-managed passwords

## Monitoring & Health Checks

- **Application Health**: Server healthcheck endpoint
- **Load Balancer**: Automatic health checking
- **Database**: Backup monitoring
- **Instance Health**: CloudWatch integration

## Scaling

To scale the application:

1. **Horizontal Scaling**: Increase `instance_count` in `main.tf`
2. **Vertical Scaling**: Change `instance_type` to larger sizes
3. **Database Scaling**: Enable HA and increase instance size
4. **Load Balancer**: Upgrade to larger LB type

## SSL/TLS Configuration

To enable HTTPS:

1. **Obtain SSL Certificate**: From Let's Encrypt or certificate authority
2. **Update Load Balancer**: Set `enable_ssl = true` and provide certificates
3. **Configure Domain**: Point your domain to the load balancer IP

## Troubleshooting

### Common Issues

1. **Application not starting**: Check cloud-init logs
   ```bash
   sudo journalctl -u cloud-init-output.service
   ```

2. **Secret fetching issues**: Check secret access and IAM permissions
   ```bash
   sudo journalctl -u rhizome.service | grep -i secret
   sudo -u rhizome /opt/rhizome/bin/fetch-secrets.sh
   ```

3. **Database connection issues**: Verify security groups and secret access
   ```bash
   sudo systemctl status rhizome
   sudo journalctl -u rhizome
   ```

4. **Load balancer health checks failing**: Check application health endpoint
   ```bash
   curl http://localhost:8000/health
   ```

### Logs Location

- **Application**: `/opt/rhizome/logs/rhizome.log`
- **System**: `sudo journalctl -u rhizozme`
- **Secret Fetching**: Check systemd service logs for secret access issues
- **Cloud-init**: `/var/log/cloud-init-output.log`

### Secret Management Debugging

- **Test secret access**: `sudo -u rhizome /opt/rhizome/bin/fetch-secrets.sh`
- **Check secret configuration**: `sudo cat /opt/rhizome/config/secrets.conf` (IAM credentials)
- **Verify secrets exist**: Use Scaleway console or CLI to check Secret Manager

## Cost Optimization

Current configuration uses:
- **Instances**: DEV1-S (development instances)
- **Database**: DB-DEV-S (small database)
- **Load Balancer**: LB-S (small load balancer)
- **Storage**: Standard Object Storage

For production, consider:
- Upgrading instance types
- Enabling database HA
- Using larger load balancer
- Implementing monitoring and alerting

## Cleanup

To destroy the infrastructure:

```bash
terraform destroy
```

Note: The state bucket in `bootstrap/` should be destroyed separately if no longer needed.
