# GitHub Actions Workflows

This repository includes two simple GitHub Actions workflows for automated CI/CD, following the same pattern as the Friday repository:

## Workflows

### 1. Staging Workflow (`staging.yml`)
- **Trigger**: Pushes to `staging` branch and PRs to `staging`
- **Purpose**: Builds, pushes to ECR, and deploys to staging environment
- **Jobs**:
  - **Build & Push**: Builds Docker image and pushes to ECR staging repository
  - **Deploy**: Deploys to Qovery staging environment

### 2. Production Workflow (`production.yml`)
- **Trigger**: Pushes to `prod` branch
- **Purpose**: Builds, pushes to ECR, and deploys to production environment
- **Jobs**:
  - **Build & Push**: Builds Docker image and pushes to ECR production repository
  - **Deploy**: Deploys to Qovery production environment

## Required Secrets

Set up the following secrets in your GitHub repository settings:

- `AWS_ACCESS_KEY_ID` - AWS access key for ECR access
- `AWS_SECRET_ACCESS_KEY` - AWS secret key for ECR access
- `QOVERY_CLI_ACCESS_TOKEN` - Qovery CLI token for deployments

## Setup Instructions

1. **Create ECR Repositories**:
   - `datadog-rum-proxy-staging`
   - `datadog-rum-proxy-production`

2. **Configure Qovery Containers**:
   - Set up staging container: `datadog-rum-proxy-staging`
   - Set up production container: `datadog-rum-proxy-production`

3. **Branch Strategy**:
   - `prod`: Production deployments
   - `staging`: Staging deployments 