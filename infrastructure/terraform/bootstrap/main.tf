# Bootstrap - Storage Account for Terraform State
# Run this ONCE manually to create the backend storage
# After creation, you can use the backend in dev/prod configurations

terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "tfstate" {
  name     = "rg-remindy-tfstate"
  location = "francecentral"

  tags = {
    project    = "remindy"
    purpose    = "terraform-state"
    managed_by = "terraform"
  }
}

resource "azurerm_storage_account" "tfstate" {
  name                     = "remindytfstate"
  resource_group_name      = azurerm_resource_group.tfstate.name
  location                 = azurerm_resource_group.tfstate.location
  account_tier             = "Standard"
  account_replication_type = "LRS"  # Locally redundant - cheapest option
  min_tls_version          = "TLS1_2"

  blob_properties {
    versioning_enabled = true  # Permet de récupérer un ancien state si besoin
  }

  tags = {
    project    = "remindy"
    purpose    = "terraform-state"
    managed_by = "terraform"
  }
}

resource "azurerm_storage_container" "tfstate" {
  name                  = "tfstate"
  storage_account_name  = azurerm_storage_account.tfstate.name
  container_access_type = "private"  # Important: state reste privé
}
