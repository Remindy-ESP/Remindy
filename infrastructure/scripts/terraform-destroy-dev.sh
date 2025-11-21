#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TERRAFORM_DIR="$PROJECT_ROOT/terraform/dev"

# Check prerequisites
if ! command -v terraform &> /dev/null; then
    echo "Error: Terraform is not installed"
    exit 1
fi

if ! az account show >/dev/null 2>&1; then
    echo "Error: Not logged into Azure. Run 'az login' first"
    exit 1
fi

# Destroy infrastructure
cd "$TERRAFORM_DIR"

echo "Initializing Terraform..."
terraform init

echo "Destroying infrastructure..."
if [ -f "terraform.tfvars" ]; then
  terraform destroy -var-file="terraform.tfvars" -auto-approve
else
  terraform destroy -auto-approve
fi

echo "Infrastructure destroyed successfully!"
