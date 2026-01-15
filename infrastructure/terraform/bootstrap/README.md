# Bootstrap - Terraform State Backend

This folder create the storage account azure to stock the terraform states.

## Use this commands one time

```bash
cd infrastructure/terraform/bootstrap

# Init Terraform
terraform init

# View the plan
terraform plan

# Create ressources
terraform apply
```

## After commands

The `backend.tf` files of dev and prod are already configurates to use this bacakend.
The CI/CD Github Actions will use automatically this backend.
