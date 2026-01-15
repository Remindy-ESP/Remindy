# Backend configuration for Terraform state
# Uses Azure Storage Account created by bootstrap/

terraform {
  backend "azurerm" {
    resource_group_name  = "rg-remindy-tfstate"
    storage_account_name = "remindytfstate"
    container_name       = "tfstate"
    key                  = "remindy-dev.tfstate"
  }
}
