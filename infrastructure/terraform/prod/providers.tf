terraform {
  required_version = ">= 1.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }

  # Uncomment and configure backend for remote state storage
  # backend "azurerm" {
  #   resource_group_name  = "tfstate-rg"
  #   storage_account_name = "remindytfstate"
  #   container_name       = "tfstate"
  #   key                  = "remindy-prod.tfstate"
  # }
}

provider "azurerm" {
  features {}
}
